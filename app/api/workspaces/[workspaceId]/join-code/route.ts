import { ok, toErrorResponse } from "@/lib/api";
import { assertRole, requireMembership, requireSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { rotateJoinCode } from "@/lib/workspaces";

type Ctx = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { workspaceId } = await ctx.params;

    const { role } = await requireMembership(workspaceId, session.userId);
    assertRole(role, ["OWNER"]);

    const joinCode = await prisma.$transaction((tx) =>
      rotateJoinCode(tx, workspaceId),
    );

    return ok({ joinCode });
  } catch (error) {
    return toErrorResponse(error);
  }
}
