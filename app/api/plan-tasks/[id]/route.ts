import type { Prisma } from "@prisma/client";
import {
  ApiError,
  assertSameOrigin,
  ok,
  readJson,
  toErrorResponse,
} from "@/lib/api";
import {
  canEditTask,
  requireAssignee,
  requirePlanTaskAccess,
  requireSession,
} from "@/lib/access";
import { PRIORITIES, TASK_STATUSES } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { PLAN_TASK_INCLUDE, toTaskDto } from "@/lib/serialize";
import { Fields } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    await requirePlanTaskAccess(id, session.userId);

    const task = await prisma.planTask.findUnique({
      where: { id },
      include: PLAN_TASK_INCLUDE,
    });
    if (!task) throw new ApiError("NOT_FOUND");

    return ok({ task: toTaskDto(task) });
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
    const version = fields.int(body.version, "version", {
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
      label: "Версия",
    });

    const data: Prisma.PlanTaskUncheckedUpdateManyInput = {};

    if (body.title !== undefined) {
      data.title = fields.text(body.title, "title", {
        max: 200,
        label: "Название",
      });
    }
    if (body.description !== undefined) {
      data.description = fields.optionalText(body.description, "description");
    }
    if (body.deadline !== undefined) {
      data.deadline = fields.dateTime(body.deadline, "deadline", "Дедлайн");
    }
    if (body.priority !== undefined) {
      data.priority = fields.oneOf(
        body.priority,
        "priority",
        PRIORITIES,
        "MEDIUM",
      );
    }
    if (body.estimateMin !== undefined) {
      data.estimateMin = fields.int(body.estimateMin, "estimateMin", {
        min: 15,
        max: 540,
        label: "Оценка в минутах",
      });
    }

    let nextAssigneeId: string | null = null;
    if (body.assigneeId !== undefined) {
      nextAssigneeId = fields.id(body.assigneeId, "assigneeId", "Исполнитель");
    }

    const subtaskCount = await prisma.planSubtask.count({
      where: { taskId: id },
    });

    if (body.status !== undefined) {
      const status = fields.oneOf(
        body.status,
        "status",
        TASK_STATUSES,
        "TODO",
      );
      if (subtaskCount > 0) {
        throw new ApiError("SUBTASKS_PRESENT", "Статус считается по подзадачам");
      }
      data.status = status;
      data.progress = status === "DONE" ? 100 : status === "TODO" ? 0 : 50;
    }

    if (body.progress !== undefined && subtaskCount === 0) {
      const progress = fields.int(body.progress, "progress", {
        min: 0,
        max: 100,
        label: "Прогресс",
      });
      data.progress = progress;
      data.status =
        progress >= 100 ? "DONE" : progress <= 0 ? "TODO" : "IN_PROGRESS";
    }

    fields.throwIfInvalid();

    if (nextAssigneeId) {
      await requireAssignee(task.project.workspaceId, nextAssigneeId);
      data.assigneeId = nextAssigneeId;
    }

    const updatedCount = await prisma.planTask.updateMany({
      where: { id, version },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });

    if (updatedCount.count === 0) {
      throw new ApiError("VERSION_CONFLICT");
    }

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
