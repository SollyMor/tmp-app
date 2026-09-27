import type {
  Membership,
  PlanSubtask,
  PlanTask,
  Project,
  User,
  Workspace,
} from "@prisma/client";
import type { Priority, Role, TaskStatus, WorkspaceKind } from "@/lib/domain";

export type WorkspaceDto = {
  id: string;
  name: string;
  kind: WorkspaceKind;
  role: Role;
  isOwner: boolean;
};

export type ProjectDto = {
  id: string;
  workspaceId: string;
  name: string;
};

export type MemberDto = {
  userId: string;
  nick: string;
  email: string;
  role: Role;
};

export type SubtaskDto = {
  id: string;
  title: string;
  isDone: boolean;
};

export type TaskDto = {
  id: string;
  projectId: string;
  creatorId: string;
  assigneeId: string;
  assigneeNick: string;
  title: string;
  description: string;
  deadline: string;
  priority: Priority;
  estimateMin: number;
  status: TaskStatus;
  progress: number;
  version: number;
  subtasks: SubtaskDto[];
};

export function toWorkspaceDto(
  workspace: Workspace,
  role: Role,
  userId: string,
): WorkspaceDto {
  return {
    id: workspace.id,
    name: workspace.name,
    kind: workspace.kind as WorkspaceKind,
    role,
    isOwner: workspace.ownerId === userId,
  };
}

export function toProjectDto(project: Project): ProjectDto {
  return {
    id: project.id,
    workspaceId: project.workspaceId,
    name: project.name,
  };
}

export function toMemberDto(
  membership: Membership & { user: User },
): MemberDto {
  return {
    userId: membership.userId,
    nick: membership.user.nick,
    email: membership.user.email,
    role: membership.role as Role,
  };
}

export function toTaskDto(
  task: PlanTask & {
    subtasks: PlanSubtask[];
    assignee: Pick<User, "nick">;
  },
): TaskDto {
  return {
    id: task.id,
    projectId: task.projectId,
    creatorId: task.creatorId,
    assigneeId: task.assigneeId,
    assigneeNick: task.assignee.nick,
    title: task.title,
    description: task.description,
    deadline: task.deadline.toISOString(),
    priority: task.priority as Priority,
    estimateMin: task.estimateMin,
    status: task.status as TaskStatus,
    progress: task.progress,
    version: task.version,
    subtasks: task.subtasks
      .slice()
      .sort((left, right) => left.sortKey - right.sortKey)
      .map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        isDone: subtask.isDone,
      })),
  };
}

export const PLAN_TASK_INCLUDE = {
  subtasks: true,
  assignee: { select: { nick: true } },
} as const;
