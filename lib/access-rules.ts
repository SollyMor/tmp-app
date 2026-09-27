import type { Role } from "@/lib/domain";

export function canCreateTasks(role: Role) {
  return role === "OWNER" || role === "MEMBER";
}

export function canEditTask(
  role: Role,
  task: { creatorId: string; assigneeId: string },
  userId: string,
) {
  if (role === "OWNER") return true;
  if (role === "VIEWER") return false;
  return task.creatorId === userId || task.assigneeId === userId;
}

export function canManageWorkspace(role: Role) {
  return role === "OWNER";
}
