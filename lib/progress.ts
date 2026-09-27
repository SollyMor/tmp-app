import type { Prisma } from "@prisma/client";
import type { TaskStatus } from "@/lib/domain";

export type Db = Prisma.TransactionClient;

export function progressFromSubtasks(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((100 * done) / total);
}

export function statusFromProgress(progress: number): TaskStatus {
  if (progress >= 100) return "DONE";
  if (progress <= 0) return "TODO";
  return "IN_PROGRESS";
}

export async function recomputePlanTaskFromSubtasks(db: Db, taskId: string) {
  const subtasks = await db.planSubtask.findMany({
    where: { taskId },
    select: { isDone: true },
  });

  if (subtasks.length === 0) return null;

  const done = subtasks.filter((subtask) => subtask.isDone).length;
  const progress = progressFromSubtasks(done, subtasks.length);

  return db.planTask.update({
    where: { id: taskId },
    data: {
      progress,
      status: statusFromProgress(progress),
      version: { increment: 1 },
    },
  });
}

export function averageProgress(values: readonly number[]) {
  if (values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round(sum / values.length);
}
