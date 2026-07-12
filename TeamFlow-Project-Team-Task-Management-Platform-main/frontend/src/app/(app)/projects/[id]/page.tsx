"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, priorityClass, statusLabel, taskStatusClass } from "@/lib/labels";
import type { Project, Task, TaskPriority, TaskStatus, User } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [memberId, setMemberId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");

  const canManage =
    hasRole("ADMIN") ||
    (hasRole("PROJECT_MANAGER") && project?.createdById === user?.id);

  async function load() {
    try {
      const data = await api<Project>(`/projects/${params.id}`);
      setProject(data);
      if (canManage || hasRole("ADMIN", "PROJECT_MANAGER")) {
        try {
          setUsers(await api<User[]>("/users/directory"));
        } catch {
          setUsers([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function archiveProject() {
    if (!project) return;
    try {
      await api(`/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ARCHIVED" }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive");
    }
  }

  async function deleteProject() {
    if (!project || !confirm("Delete this project and its tasks?")) return;
    try {
      await api(`/projects/${project.id}`, { method: "DELETE" });
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function addMember(e: FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    try {
      await api(`/projects/${params.id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: memberId }),
      });
      setMemberId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  async function removeMember(userId: string) {
    try {
      await api(`/projects/${params.id}/members/${userId}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  async function createTask(e: FormEvent) {
    e.preventDefault();
    try {
      await api<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          projectId: params.id,
          title: taskTitle,
          priority: taskPriority,
          assigneeId: taskAssignee || null,
          status: "TODO" as TaskStatus,
        }),
      });
      setTaskTitle("");
      setTaskAssignee("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  }

  if (!project && !error) {
    return <p>Loading project…</p>;
  }

  if (!project) {
    return <div className="error">{error || "Project not found"}</div>;
  }

  return (
    <div>
      <Link href="/projects" style={{ color: "var(--brand)" }}>
        ← Back to projects
      </Link>
      <h1 className="page-title" style={{ marginTop: "0.6rem" }}>
        {project.name}
      </h1>
      <p className="page-sub">{project.description || "No description"}</p>

      {error ? <div className="error">{error}</div> : null}

      <div className="row" style={{ marginBottom: "1rem" }}>
        <span className="badge badge-progress">{statusLabel(project.status)}</span>
        <span style={{ color: "var(--muted)" }}>
          Owner: {project.createdBy?.name} · Updated {formatDate(project.updatedAt)}
        </span>
        {canManage ? (
          <>
            <button className="btn btn-ghost" onClick={archiveProject}>
              Archive
            </button>
            <button className="btn btn-danger" onClick={deleteProject}>
              Delete
            </button>
          </>
        ) : null}
      </div>

      <div className="stack">
        <div className="panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Members</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {project.members?.map((m) => (
                <tr key={m.id}>
                  <td>{m.user.name}</td>
                  <td>{statusLabel(m.user.role)}</td>
                  <td>
                    {canManage && m.userId !== project.createdById ? (
                      <button className="btn btn-ghost" onClick={() => removeMember(m.userId)}>
                        Remove
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {canManage && users.length > 0 ? (
            <form className="row" onSubmit={addMember} style={{ marginTop: "0.8rem" }}>
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
                <option value="">Add member…</option>
                {users
                  .filter((u) => !project.members?.some((m) => m.userId === u.id))
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
              <button className="btn btn-primary">Add</button>
            </form>
          ) : null}
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Tasks</h2>
          {canManage ? (
            <form className="row" onSubmit={createTask} style={{ marginBottom: "1rem" }}>
              <input
                placeholder="New task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                style={{ flex: 1, minWidth: 180 }}
              />
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
              <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {project.members?.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary">Add task</button>
            </form>
          ) : null}

          {project.tasks && project.tasks.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Progress</th>
                  <th>Assignee</th>
                </tr>
              </thead>
              <tbody>
                {project.tasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/tasks/${t.id}`} style={{ color: "var(--brand)", fontWeight: 600 }}>
                        {t.title}
                      </Link>
                    </td>
                    <td>
                      <span className={`badge ${taskStatusClass(t.status)}`}>
                        {statusLabel(t.status)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${priorityClass(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <div className="progress-bar" style={{ width: 100 }}>
                        <span style={{ width: `${t.progress}%` }} />
                      </div>
                    </td>
                    <td>{t.assignee?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty">No tasks in this project.</p>
          )}
        </div>
      </div>
    </div>
  );
}
