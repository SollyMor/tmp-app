import { assertSameOrigin, ok, readJson, toErrorResponse } from "@/lib/api";
import { requireSession } from "@/lib/access";
import { WORKSPACE_KINDS, type Role } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { toProjectDto, toWorkspaceDto } from "@/lib/serialize";
import { Fields } from "@/lib/validate";
import { createWorkspaceWithOwner } from "@/lib/workspaces";

export async function GET() {
  try {
    const session = await requireSession();

    const memberships = await prisma.membership.findMany({
      where: { userId: session.userId },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });

    return ok({
      workspaces: memberships.map((membership) =>
        toWorkspaceDto(
          membership.workspace,
          membership.role as Role,
          session.userId,
        ),
      ),
    });
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
    const name = fields.text(body.name, "name", { max: 80, label: "Название" });
    const kind = fields.oneOf(body.kind, "kind", WORKSPACE_KINDS, "STUDY");
    fields.throwIfInvalid();

    const result = await prisma.$transaction(async (tx) => {
      const created = await createWorkspaceWithOwner(tx, {
        name,
        kind,
        ownerId: session.userId,
        firstProjectName: "Общее",
      });
      const projects = await tx.project.findMany({
        where: { workspaceId: created.workspace.id },
      });
      return { ...created, projects };
    });

    return ok(
      {
        workspace: toWorkspaceDto(result.workspace, "OWNER", session.userId),
        projects: result.projects.map(toProjectDto),
        joinCode: result.joinCode,
      },
      201,
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
