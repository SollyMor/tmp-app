import {
  ApiError,
  assertSameOrigin,
  ok,
  readJson,
  toErrorResponse,
} from "@/lib/api";
import { requireSession } from "@/lib/access";
import { parseJoinCode, verifyJoinSecret } from "@/lib/auth";
import type { Role } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { toWorkspaceDto } from "@/lib/serialize";
import { Fields } from "@/lib/validate";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const session = await requireSession();

    const body = await readJson(request);
    const fields = new Fields();
    const code = fields.text(body.code, "code", { max: 80, label: "Код" });
    fields.throwIfInvalid();

    const parsed = parseJoinCode(code);
    const workspace = parsed
      ? await prisma.workspace.findUnique({ where: { id: parsed.workspaceId } })
      : null;

    if (!parsed || !workspace) {
      throw new ApiError("JOIN_CODE_INVALID", undefined, {
        code: "Код не найден",
      });
    }
    if (!(await verifyJoinSecret(parsed.secret, workspace.joinCodeHash))) {
      throw new ApiError("JOIN_CODE_INVALID", undefined, {
        code: "Код не подходит",
      });
    }

    const membership = await prisma.membership.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: session.userId,
        },
      },
      update: {},
      create: {
        workspaceId: workspace.id,
        userId: session.userId,
        role: "MEMBER",
      },
    });

    return ok({
      workspace: toWorkspaceDto(
        workspace,
        membership.role as Role,
        session.userId,
      ),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
