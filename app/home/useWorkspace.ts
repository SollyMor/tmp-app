"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, errorMessage } from "@/lib/client";
import type {
  MemberDto,
  ProjectDto,
  TaskDto,
  WorkspaceDto,
} from "@/lib/serialize";

export type WorkspaceState = {
  status: "loading" | "ready" | "error";
  error: string;
  workspaces: WorkspaceDto[];
  activeWorkspace: WorkspaceDto | null;
  projects: ProjectDto[];
  members: MemberDto[];
  tasks: TaskDto[];
};

export function useWorkspace(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null,
  );
  const [state, setState] = useState<WorkspaceState>({
    status: "loading",
    error: "",
    workspaces: [],
    activeWorkspace: null,
    projects: [],
    members: [],
    tasks: [],
  });

  const load = useCallback(
    async (workspaceId?: string | null) => {
      if (!enabled) return;
      setState((prev) => ({ ...prev, status: "loading", error: "" }));

      try {
        const { workspaces } = await apiGet<{ workspaces: WorkspaceDto[] }>(
          "/api/workspaces",
        );

        const wanted = workspaceId ?? activeWorkspaceId;
        const active =
          workspaces.find((workspace) => workspace.id === wanted) ??
          workspaces[0] ??
          null;

        if (!active) {
          setState({
            status: "ready",
            error: "",
            workspaces,
            activeWorkspace: null,
            projects: [],
            members: [],
            tasks: [],
          });
          return;
        }

        const [projects, members, tasks] = await Promise.all([
          apiGet<{ projects: ProjectDto[] }>(
            `/api/projects?workspaceId=${active.id}`,
          ),
          apiGet<{ members: MemberDto[] }>(
            `/api/workspaces/${active.id}/members`,
          ),
          apiGet<{ tasks: TaskDto[] }>(
            `/api/plan-tasks?workspaceId=${active.id}`,
          ),
        ]);

        setActiveWorkspaceId(active.id);
        setState({
          status: "ready",
          error: "",
          workspaces,
          activeWorkspace: active,
          projects: projects.projects,
          members: members.members,
          tasks: tasks.tasks,
        });
      } catch (caught) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage(caught, "Не удалось загрузить данные"),
        }));
      }
    },
    [activeWorkspaceId, enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    void load(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const selectWorkspace = useCallback(
    (workspaceId: string) => {
      setActiveWorkspaceId(workspaceId);
      void load(workspaceId);
    },
    [load],
  );

  const replaceTask = useCallback((task: TaskDto) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.some((item) => item.id === task.id)
        ? prev.tasks.map((item) => (item.id === task.id ? task : item))
        : [...prev.tasks, task],
    }));
  }, []);

  return { state, selectWorkspace, replaceTask, reload: load };
}
