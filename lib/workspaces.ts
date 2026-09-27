import {
  composeJoinCode,
  generateJoinSecret,
  hashJoinSecret,
} from "@/lib/auth";
import type { WorkspaceKind } from "@/lib/domain";
import type { Db } from "@/lib/progress";

export type CreateWorkspaceInput = {
  name: string;
  kind: WorkspaceKind;
  ownerId: string;
  firstProjectName?: string;
};

export async function createWorkspaceWithOwner(
  db: Db,
  input: CreateWorkspaceInput,
) {
  const secret = generateJoinSecret();

  const workspace = await db.workspace.create({
    data: {
      name: input.name,
      kind: input.kind,
      ownerId: input.ownerId,
      joinCodeHash: await hashJoinSecret(secret),
    },
  });

  await db.membership.create({
    data: {
      workspaceId: workspace.id,
      userId: input.ownerId,
      role: "OWNER",
    },
  });

  if (input.firstProjectName) {
    await db.project.create({
      data: { workspaceId: workspace.id, name: input.firstProjectName },
    });
  }

  return { workspace, joinCode: composeJoinCode(workspace.id, secret) };
}

export async function rotateJoinCode(db: Db, workspaceId: string) {
  const secret = generateJoinSecret();

  await db.workspace.update({
    where: { id: workspaceId },
    data: { joinCodeHash: await hashJoinSecret(secret) },
  });

  return composeJoinCode(workspaceId, secret);
}
