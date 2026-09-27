import {
  ApiError,
  assertSameOrigin,
  ok,
  readJson,
  toErrorResponse,
} from "@/lib/api";
import {
  canCreateTasks,
  requireAssignee,
  requireMembership,
  requireProjectAccess,
  requireSession,
} from "@/lib/access";
import { PRIORITIES } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { PLAN_TASK_INCLUDE, toTaskDto } from "@/lib/serialize";
import { Fields } from "@/lib/validate";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const params = new URL(request.url).searchParams;
    const projectId = params.get("projectId");
    const workspaceId = params.get("workspaceId");

    if (!projectId && !workspaceId) {
      throw new ApiError("VALIDATION_ERROR", undefined, {
        projectId: "Укажите projectId или workspaceId",
      });
    }

    if (projectId) {
      await requireProjectAccess(projectId, session.userId);
    } else if (workspaceId) {
      await requireMembership(workspaceId, session.userId);
    }

    const tasks = await prisma.planTask.findMany({
      where: projectId
        ? { projectId }
        : { project: { workspaceId: workspaceId ?? "" } },
      include: PLAN_TASK_INCLUDE,
      orderBy: [{ deadline: "asc" }, { createdAt: "asc" }],
    });

    return ok({ tasks: tasks.map(toTaskDto) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();

    const body = await readJson(request);
    const fields = new Fields();
    const projectId = fields.id(body.projectId, "projectId", "Проект");
    const title = fields.text(body.title, "title", {
      max: 200,
      label: "Название",
    });
    const description = fields.optionalText(body.description, "description");
    const deadline = fields.dateTime(body.deadline, "deadline", "Дедлайн");
    const priority = fields.oneOf(
      body.priority,
      "priority",
      PRIORITIES,
      "MEDIUM",
    );
    const estimateMin = fields.int(body.estimateMin, "estimateMin", {
      min: 15,
      max: 540,
      label: "Оценка в минутах",
    });
    fields.throwIfInvalid();

    const { project, role } = await requireProjectAccess(
      projectId,
      session.userId,
    );
    if (!canCreateTasks(role)) throw new ApiError("FORBIDDEN");

    const assigneeId =
      typeof body.assigneeId === "string" && body.assigneeId.trim()
        ? body.assigneeId.trim()
        : session.userId;
    await requireAssignee(project.workspaceId, assigneeId);

    const created = await prisma.planTask.create({
      data: {
        projectId,
        creatorId: session.userId,
        assigneeId,
        title,
        description,
        deadline,
        priority,
        estimateMin,
      },
      include: PLAN_TASK_INCLUDE,
    });

    return ok({ task: toTaskDto(created) }, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
