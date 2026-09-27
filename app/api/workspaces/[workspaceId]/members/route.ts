import {
  ApiError,
  assertSameOrigin,
  ok,
  readJson,
  toErrorResponse,
} from "@/lib/api";
import { assertRole, requireMembership, requireSession } from "@/lib/access";
import { ROLES } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { toMemberDto } from "@/lib/serialize";
import { Fields } from "@/lib/validate";

type Ctx = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const session = await requireSession();
    const { workspaceId } = await ctx.params;
    await requireMembership(workspaceId, session.userId);

    const members = await prisma.membership.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    return ok({ members: members.map(toMemberDto) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();
    const { workspaceId } = await ctx.params;

    const { role, workspace } = await requireMembership(
      workspaceId,
      session.userId,
    );
    assertRole(role, ["OWNER"]);

    const body = await readJson(request);
    const fields = new Fields();
    const userId = fields.id(body.userId, "userId", "Участник");
    const nextRole = fields.oneOf(body.role, "role", ROLES, "MEMBER");
    fields.throwIfInvalid();

    if (userId === workspace.ownerId) {
      throw new ApiError(
        "FORBIDDEN",
        "Роль владельца пространства не меняется",
      );
    }

    const target = await prisma.membership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!target) throw new ApiError("NOT_FOUND");

    const updated = await prisma.membership.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role: nextRole },
      include: { user: true },
    });

    return ok({ member: toMemberDto(updated) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
