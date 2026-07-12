"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, priorityClass, statusLabel, taskStatusClass } from "@/lib/labels";
import type { Task, TaskStatus } from "@/lib/types";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [progress, setProgress] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api<Task>(`/tasks/${params.id}`);
      setTask(data);
      setStatus(data.status);
      setProgress(data.progress);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const canFullEdit = hasRole("ADMIN", "PROJECT_MANAGER");
  const canUpdateProgress =
    canFullEdit || (task?.assigneeId != null && task.assigneeId === user?.id);

  async function saveProgress(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = canFullEdit
        ? { status, progress }
        : { status, progress };
      const updated = await api<Task>(`/tasks/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setTask(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setSaving(false);
    }
  }

  async function addComment(e: FormEvent) {
    e.preventDefault();
    try {
      await api(`/tasks/${params.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: comment }),
      });
      setComment("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    }
  }

  if (!task && !error) return <p>Loading task…</p>;
  if (!task) return <div className="error">{error || "Task not found"}</div>;

  return (
    <div>
      <Link href="/tasks" style={{ color: "var(--brand)" }}>
        ← Back to tasks
      </Link>
      <h1 className="page-title" style={{ marginTop: "0.6rem" }}>
        {task.title}
      </h1>
      <p className="page-sub">{task.description || "No description"}</p>

      {error ? <div className="error">{error}</div> : null}

      <div className="row" style={{ marginBottom: "1rem" }}>
        <span className={`badge ${taskStatusClass(task.status)}`}>
          {statusLabel(task.status)}
        </span>
        <span className={`badge ${priorityClass(task.priority)}`}>{task.priority}</span>
        {task.project ? (
          <Link href={`/projects/${task.project.id}`} style={{ color: "var(--brand)" }}>
            {task.project.name}
          </Link>
        ) : null}
        <span style={{ color: "var(--muted)" }}>Due {formatDate(task.dueDate)}</span>
        <span style={{ color: "var(--muted)" }}>
          Assignee: {task.assignee?.name ?? "Unassigned"}
        </span>
      </div>

      <div className="stack">
        {canUpdateProgress ? (
          <form className="panel" onSubmit={saveProgress}>
            <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>
              Update progress
            </h2>
            <div className="row">
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                >
                  <option value="TODO">To do</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0, minWidth: 180 }}>
                <label htmlFor="progress">Progress ({progress}%)</label>
                <input
                  id="progress"
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                />
              </div>
              <button className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <div className="panel">
            <div className="progress-bar">
              <span style={{ width: `${task.progress}%` }} />
            </div>
            <p style={{ marginBottom: 0 }}>{task.progress}% complete</p>
          </div>
        )}

        <div className="panel">
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Comments</h2>
          {task.comments && task.comments.length > 0 ? (
            <div className="stack" style={{ marginBottom: "1rem" }}>
              {task.comments.map((c) => (
                <div key={c.id} style={{ borderBottom: "1px solid var(--line)", paddingBottom: "0.7rem" }}>
                  <strong>{c.author?.name}</strong>{" "}
                  <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    {formatDate(c.createdAt)}
                  </span>
                  <p style={{ margin: "0.35rem 0 0" }}>{c.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty">No comments yet.</p>
          )}
          <form onSubmit={addComment}>
            <div className="field">
              <label htmlFor="comment">Add comment</label>
              <textarea
                id="comment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary">Post comment</button>
          </form>
        </div>
      </div>
    </div>
  );
}
