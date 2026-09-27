import { assertSameOrigin, ok, readJson, toErrorResponse } from "@/lib/api";
import { assertRole, requireMembership, requireSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { toProjectDto } from "@/lib/serialize";
import { Fields } from "@/lib/validate";

export async function GET(request: Request) {
  try {
    const session = await requireSession();

    const fields = new Fields();
    const workspaceId = fields.id(
      new URL(request.url).searchParams.get("workspaceId"),
      "workspaceId",
      "Пространство",
    );
    fields.throwIfInvalid();

    await requireMembership(workspaceId, session.userId);

    const projects = await prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "asc" },
    });

    return ok({ projects: projects.map(toProjectDto) });
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
    const workspaceId = fields.id(
      body.workspaceId,
      "workspaceId",
      "Пространство",
    );
    const name = fields.text(body.name, "name", { max: 80, label: "Название" });
    fields.throwIfInvalid();

    const { role } = await requireMembership(workspaceId, session.userId);
    assertRole(role, ["OWNER", "MEMBER"]);

    const project = await prisma.project.create({
      data: { workspaceId, name },
    });

    return ok({ project: toProjectDto(project) }, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
