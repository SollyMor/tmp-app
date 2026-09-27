import {
  ApiError,
  assertSameOrigin,
  ok,
  readJson,
  toErrorResponse,
} from "@/lib/api";
import {
  canEditTask,
  requirePlanTaskAccess,
  requireSession,
} from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  progressFromSubtasks,
  recomputePlanTaskFromSubtasks,
  statusFromProgress,
} from "@/lib/progress";
import { PLAN_TASK_INCLUDE, toTaskDto } from "@/lib/serialize";
import { Fields } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    const { id } = await ctx.params;

    const { task, role } = await requirePlanTaskAccess(id, session.userId);
    if (!canEditTask(role, task, session.userId)) {
      throw new ApiError("FORBIDDEN");
    }

    const body = await readJson(request);
    const fields = new Fields();
    const title = fields.text(body.title, "title", {
      max: 200,
      label: "Подзадача",
    });
    fields.throwIfInvalid();

    const maxSort = await prisma.planSubtask.aggregate({
      where: { taskId: id },
      _max: { sortKey: true },
    });

    await prisma.planSubtask.create({
      data: {
        taskId: id,
        title,
        sortKey: (maxSort._max.sortKey ?? -1) + 1,
      },
    });

    await prisma.$transaction((tx) => recomputePlanTaskFromSubtasks(tx, id));

    const fresh = await prisma.planTask.findUnique({
      where: { id },
      include: PLAN_TASK_INCLUDE,
    });
    if (!fresh) throw new ApiError("NOT_FOUND");
    return ok({ task: toTaskDto(fresh) }, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    const { id } = await ctx.params;

    const { task, role } = await requirePlanTaskAccess(id, session.userId);
    if (!canEditTask(role, task, session.userId)) {
      throw new ApiError("FORBIDDEN");
    }

    const body = await readJson(request);
    const fields = new Fields();
    const subtaskId = fields.id(body.subtaskId, "subtaskId", "Подзадача");
    fields.throwIfInvalid();

    if (typeof body.isDone !== "boolean") {
      throw new ApiError("VALIDATION_ERROR", undefined, {
        isDone: "Нужен флаг isDone",
      });
    }

    const subtask = await prisma.planSubtask.findFirst({
      where: { id: subtaskId, taskId: id },
    });
    if (!subtask) throw new ApiError("NOT_FOUND");

    await prisma.planSubtask.update({
      where: { id: subtaskId },
      data: { isDone: body.isDone },
    });

    const subtasks = await prisma.planSubtask.findMany({
      where: { taskId: id },
      select: { isDone: true },
    });
    const done = subtasks.filter((item) => item.isDone).length;
    const progress = progressFromSubtasks(done, subtasks.length);

    await prisma.planTask.update({
      where: { id },
      data: {
        progress,
        status: statusFromProgress(progress),
        version: { increment: 1 },
      },
    });

    const fresh = await prisma.planTask.findUnique({
      where: { id },
      include: PLAN_TASK_INCLUDE,
    });
    if (!fresh) throw new ApiError("NOT_FOUND");
    return ok({ task: toTaskDto(fresh) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
