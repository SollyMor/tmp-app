/** Перечисления домена CRM / Планы. */

export const WORKSPACE_KINDS = ["STUDY", "PERSONAL", "STARTUP"] as const;
export type WorkspaceKind = (typeof WORKSPACE_KINDS)[number];

export const ROLES = ["OWNER", "MEMBER", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "высокий",
  MEDIUM: "средний",
  LOW: "низкий",
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "к выполнению",
  IN_PROGRESS: "в работе",
  DONE: "готово",
};

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "владелец",
  MEMBER: "участник",
  VIEWER: "наблюдатель",
};

export const WORKSPACE_KIND_LABELS: Record<WorkspaceKind, string> = {
  STUDY: "учёба",
  PERSONAL: "личное",
  STARTUP: "стартап",
};

/** Приоритет в шкалу 1..3 для PriorityBars */
export const PRIORITY_LEVELS: Record<Priority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};
