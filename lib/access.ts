import { ApiError } from "@/lib/api";
import { getSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/domain";

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError("UNAUTHORIZED");
  return session;
}

export async function requireMembership(workspaceId: string, userId: string) {
  const membership = await prisma.membership.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    include: { workspace: true },
  });

  if (!membership) throw new ApiError("NOT_FOUND");

  return { role: membership.role as Role, workspace: membership.workspace };
}

export function assertRole(role: Role, allowed: readonly Role[]) {
  if (!allowed.includes(role)) throw new ApiError("FORBIDDEN");
}

export { canCreateTasks, canEditTask } from "@/lib/access-rules";

export async function requireProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new ApiError("NOT_FOUND");

  const { role } = await requireMembership(project.workspaceId, userId);
  return { project, role };
}

export async function requirePlanTaskAccess(taskId: string, userId: string) {
  const task = await prisma.planTask.findUnique({
    where: { id: taskId },
    include: { project: true },
  });
  if (!task) throw new ApiError("NOT_FOUND");

  const { role } = await requireMembership(task.project.workspaceId, userId);
  return { task, role };
}

export async function requireAssignee(workspaceId: string, assigneeId: string) {
  const membership = await prisma.membership.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: assigneeId } },
  });
  if (!membership) throw new ApiError("INVALID_ASSIGNEE");
  return membership;
}
