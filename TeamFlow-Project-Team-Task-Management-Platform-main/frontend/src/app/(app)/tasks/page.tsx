"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, priorityClass, statusLabel, taskStatusClass } from "@/lib/labels";
import type { Task, TaskStatus } from "@/lib/types";

export default function TasksPage() {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [mineOnly, setMineOnly] = useState(hasRole("TEAM_MEMBER"));
  const [error, setError] = useState("");

  async function load() {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q.trim()) params.set("q", q.trim());
      if (mineOnly && user) params.set("assigneeId", user.id);
      const data = await api<Task[]>(`/tasks?${params.toString()}`);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, mineOnly]);

  const grouped = useMemo(() => {
    const order: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
    return order.map((s) => ({
      status: s,
      items: tasks.filter((t) => t.status === s),
    }));
  }, [tasks]);

  return (
    <div>
      <h1 className="page-title">Tasks</h1>
      <p className="page-sub">Filter, track, and update work across your projects.</p>

      {error ? <div className="error">{error}</div> : null}

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <div className="row">
          <input
            placeholder="Search tasks…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="TODO">To do</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
          </select>
          <label className="row" style={{ gap: "0.4rem" }}>
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
            />
            Assigned to me
          </label>
          <button className="btn btn-primary" onClick={() => void load()}>
            Apply
          </button>
        </div>
      </div>

      <div className="stack">
        {grouped.map((group) => (
          <div className="panel" key={group.status}>
            <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>
              {statusLabel(group.status)}{" "}
              <span style={{ color: "var(--muted)", fontSize: "1rem" }}>
                ({group.items.length})
              </span>
            </h2>
            {group.items.length === 0 ? (
              <p className="empty">No tasks.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Project</th>
                    <th>Priority</th>
                    <th>Progress</th>
                    <th>Due</th>
                    <th>Assignee</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <Link
                          href={`/tasks/${t.id}`}
                          style={{ color: "var(--brand)", fontWeight: 600 }}
                        >
                          {t.title}
                        </Link>
                        <div>
                          <span className={`badge ${taskStatusClass(t.status)}`}>
                            {statusLabel(t.status)}
                          </span>
                        </div>
                      </td>
                      <td>
                        {t.project ? (
                          <Link href={`/projects/${t.project.id}`}>{t.project.name}</Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span className={`badge ${priorityClass(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td>
                        <div className="progress-bar" style={{ width: 110 }}>
                          <span style={{ width: `${t.progress}%` }} />
                        </div>
                        <small>{t.progress}%</small>
                      </td>
                      <td>{formatDate(t.dueDate)}</td>
                      <td>{t.assignee?.name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
