"use client";

import { useState } from "react";
import { apiGet, apiSend, errorMessage } from "@/lib/client";
import {
  ROLES,
  ROLE_LABELS,
  WORKSPACE_KINDS,
  WORKSPACE_KIND_LABELS,
  type Role,
  type WorkspaceKind,
} from "@/lib/domain";
import { averageProgress } from "@/lib/progress";
import type { MemberDto, ProjectDto, TaskDto, WorkspaceDto } from "@/lib/serialize";
import { inputClassName, smallButtonClassName } from "@/lib/ui";

type WorkspacePanelProps = {
  workspaces: WorkspaceDto[];
  activeWorkspace: WorkspaceDto | null;
  projects: ProjectDto[];
  members: MemberDto[];
  tasks: TaskDto[];
  activeProjectId: string | null;
  onSelectWorkspace: (workspaceId: string) => void;
  onSelectProject: (projectId: string | null) => void;
  onChanged: () => void;
};

type Panel = "none" | "workspace" | "join" | "project" | "members";

export default function WorkspacePanel({
  workspaces,
  activeWorkspace,
  projects,
  members,
  tasks,
  activeProjectId,
  onSelectWorkspace,
  onSelectProject,
  onChanged,
}: WorkspacePanelProps) {
  const [panel, setPanel] = useState<Panel>("none");
  const [name, setName] = useState("");
  const [kind, setKind] = useState<WorkspaceKind>("STUDY");
  const [code, setCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function togglePanel(next: Panel) {
    setPanel((current) => (current === next ? "none" : next));
    setError("");
    setJoinCode("");
  }

  async function run(action: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await action();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  const createWorkspace = () =>
    run(async () => {
      const created = await apiSend<{ workspace: WorkspaceDto; joinCode: string }>(
        "/api/workspaces",
        "POST",
        { name, kind },
      );
      setName("");
      setJoinCode(created.joinCode);
      onChanged();
      onSelectWorkspace(created.workspace.id);
    });

  const joinWorkspace = () =>
    run(async () => {
      const joined = await apiSend<{ workspace: WorkspaceDto }>(
        "/api/workspaces/join",
        "POST",
        { code },
      );
      setCode("");
      setPanel("none");
      onSelectWorkspace(joined.workspace.id);
    });

  const createProject = () =>
    run(async () => {
      if (!activeWorkspace) return;
      await apiSend("/api/projects", "POST", {
        workspaceId: activeWorkspace.id,
        name,
      });
      setName("");
      setPanel("none");
      onChanged();
    });

  const issueJoinCode = () =>
    run(async () => {
      if (!activeWorkspace) return;
      const issued = await apiGet<{ joinCode: string }>(
        `/api/workspaces/${activeWorkspace.id}/join-code`,
      );
      setJoinCode(issued.joinCode);
    });

  const changeRole = (userId: string, role: Role) =>
    run(async () => {
      if (!activeWorkspace) return;
      await apiSend(`/api/workspaces/${activeWorkspace.id}/members`, "PATCH", {
        userId,
        role,
      });
      onChanged();
    });

  const canManage = activeWorkspace?.role === "OWNER";
  const canCreateProject =
    activeWorkspace?.role === "OWNER" || activeWorkspace?.role === "MEMBER";

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r-3 border-[#F8F6E7] px-3 py-3 text-[#F8F6E7]">
      <h2 className="font-amatic mb-2 text-3xl font-bold tracking-wide">
        ПРОСТРАНСТВА
      </h2>

      <ul className="flex flex-col gap-1">
        {workspaces.map((workspace) => {
          const active = workspace.id === activeWorkspace?.id;
          return (
            <li key={workspace.id}>
              <button
                type="button"
                onClick={() => onSelectWorkspace(workspace.id)}
                className={`font-zen w-full rounded-[3px] border px-2 py-1 text-left text-sm transition-colors ${
                  active
                    ? "border-[#F8F6E7] bg-[#F8F6E7] text-[#191919]"
                    : "border-[#F8F6E7]/30 hover:bg-[#222222]"
                }`}
              >
                <span className="block truncate">{workspace.name}</span>
                <span className="block truncate text-xs opacity-60">
                  {WORKSPACE_KIND_LABELS[workspace.kind]} · {ROLE_LABELS[workspace.role]}
                </span>
              </button>
            </li>
          );
        })}
        {workspaces.length === 0 ? (
          <li className="font-zen text-sm opacity-50">Пока нет пространств</li>
        ) : null}
      </ul>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => togglePanel("workspace")}
          className={smallButtonClassName}
        >
          + Пространство
        </button>
        <button
          type="button"
          onClick={() => togglePanel("join")}
          className={smallButtonClassName}
        >
          По коду
        </button>
      </div>

      {panel === "workspace" ? (
        <div className="mt-2 flex flex-col gap-2">
          <input
            className={inputClassName}
            placeholder="Название"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="flex flex-wrap gap-1">
            {WORKSPACE_KINDS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setKind(option)}
                className={`font-zen rounded-[3px] border px-2 py-1 text-xs ${
                  kind === option ? "border-[#F8F6E7]" : "border-[#F8F6E7]/30"
                }`}
              >
                {WORKSPACE_KIND_LABELS[option]}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void createWorkspace()}
            className={smallButtonClassName}
          >
            {busy ? "..." : "Создать"}
          </button>
        </div>
      ) : null}

      {panel === "join" ? (
        <div className="mt-2 flex flex-col gap-2">
          <input
            className={inputClassName}
            placeholder="Код приглашения"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void joinWorkspace()}
            className={smallButtonClassName}
          >
            {busy ? "..." : "Присоединиться"}
          </button>
        </div>
      ) : null}

      <div className="mt-5 mb-2 flex items-center gap-2 border-b border-[#F8F6E7] pb-1">
        <h2 className="font-amatic text-2xl font-bold tracking-wide">ПРОЕКТЫ</h2>
        {canCreateProject ? (
          <button
            type="button"
            aria-label="Добавить проект"
            onClick={() => togglePanel("project")}
            className="ml-auto font-zen text-lg leading-none opacity-70 hover:opacity-100"
          >
            +
          </button>
        ) : null}
      </div>

      {panel === "project" ? (
        <div className="mb-2 flex flex-col gap-2">
          <input
            className={inputClassName}
            placeholder="Название проекта"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void createProject()}
            className={smallButtonClassName}
          >
            {busy ? "..." : "Создать"}
          </button>
        </div>
      ) : null}

      <ul className="flex flex-col gap-1">
        <li>
          <button
            type="button"
            onClick={() => onSelectProject(null)}
            className={`font-zen w-full rounded-[3px] px-2 py-1 text-left text-sm transition-colors ${
              activeProjectId === null
                ? "bg-[#49644E]"
                : "hover:bg-[#222222] opacity-80"
            }`}
          >
            Все проекты
          </button>
        </li>
        {projects.map((project) => {
          const progress = averageProgress(
            tasks
              .filter((task) => task.projectId === project.id)
              .map((task) => task.progress),
          );
          return (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => onSelectProject(project.id)}
                className={`font-zen flex w-full items-center gap-2 rounded-[3px] px-2 py-1 text-left text-sm transition-colors ${
                  activeProjectId === project.id
                    ? "bg-[#49644E]"
                    : "hover:bg-[#222222] opacity-80"
                }`}
              >
                <span className="min-w-0 truncate">{project.name}</span>
                <span className="ml-auto shrink-0 text-[11px] opacity-70">
                  {progress}%
                </span>
              </button>
            </li>
          );
        })}
        {projects.length === 0 ? (
          <li className="font-zen text-sm opacity-50">Пока нет проектов</li>
        ) : null}
      </ul>

      <div className="mt-5 mb-2 flex items-center gap-2 border-b border-[#F8F6E7] pb-1">
        <h2 className="font-amatic text-2xl font-bold tracking-wide">КОМАНДА</h2>
        <button
          type="button"
          onClick={() => togglePanel("members")}
          className="ml-auto font-zen text-xs opacity-70 hover:opacity-100"
        >
          {panel === "members" ? "скрыть" : "роли"}
        </button>
      </div>

      <ul className="flex flex-col gap-1">
        {members.map((member) => (
          <li key={member.userId} className="font-zen flex flex-wrap items-baseline gap-x-1 text-sm">
            <span className="max-w-[9rem] truncate" title={member.nick}>
              {member.nick}
            </span>
            <span className="shrink-0 text-xs opacity-60">
              {ROLE_LABELS[member.role]}
            </span>
            {panel === "members" && canManage ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    disabled={busy || role === member.role}
                    onClick={() => void changeRole(member.userId, role)}
                    className={`font-zen rounded-[3px] border px-1.5 py-0.5 text-[11px] disabled:opacity-40 ${
                      role === member.role
                        ? "border-[#F8F6E7]"
                        : "border-[#F8F6E7]/30 hover:bg-[#222222]"
                    }`}
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {canManage ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void issueJoinCode()}
          className={`${smallButtonClassName} mt-3`}
        >
          Новый код приглашения
        </button>
      ) : null}

      {joinCode ? (
        <p className="font-zen mt-2 rounded-[3px] border border-[#49644E] p-2 text-xs break-all">
          {joinCode}
          <span className="mt-1 block opacity-60">
            Код виден один раз — скопируйте его.
          </span>
        </p>
      ) : null}

      {error ? (
        <p className="font-zen mt-2 text-sm text-red-400">{error}</p>
      ) : null}
    </aside>
  );
}
