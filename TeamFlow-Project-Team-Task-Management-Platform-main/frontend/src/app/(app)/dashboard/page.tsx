"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, roleLabel, statusLabel } from "@/lib/labels";
import type { ActivityLog } from "@/lib/types";

interface Stats {
  role: string;
  users?: number;
  projects?: number;
  activeProjects?: number;
  tasks?: number;
  doneTasks?: number;
  members?: number;
  assignedTasks?: number;
  completedTasks?: number;
  tasksByStatus?: Record<string, number>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api<Stats>("/dashboard/stats"),
      api<ActivityLog[]>("/dashboard/activity?limit=12"),
    ])
      .then(([s, a]) => {
        setStats(s);
        setActivity(a);
      })
      .catch((err) => setError(err.message || "Failed to load dashboard"));
  }, []);

  const cards = stats
    ? [
        stats.users != null && { label: "Users", value: stats.users },
        stats.projects != null && { label: "Projects", value: stats.projects },
        stats.activeProjects != null && {
          label: "Active projects",
          value: stats.activeProjects,
        },
        stats.tasks != null && { label: "Tasks", value: stats.tasks },
        stats.doneTasks != null && { label: "Done tasks", value: stats.doneTasks },
        stats.members != null && { label: "Members", value: stats.members },
        stats.assignedTasks != null && {
          label: "Assigned to you",
          value: stats.assignedTasks,
        },
        stats.completedTasks != null && {
          label: "Completed by you",
          value: stats.completedTasks,
        },
      ].filter(Boolean) as { label: string; value: number }[]
    : [];

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">
        Welcome back, {user?.name}. You are signed in as {user ? roleLabel(user.role) : ""}.
      </p>

      {error ? <div className="error">{error}</div> : null}

      <div className="grid-stats" style={{ marginBottom: "1.25rem" }}>
        {cards.map((card) => (
          <div className="stat" key={card.label}>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginBottom: "1.25rem" }}>
        <Link className="btn btn-primary" href="/projects">
          View projects
        </Link>
        <Link className="btn btn-ghost" href="/tasks">
          View tasks
        </Link>
      </div>

      <div className="panel">
        <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Recent activity</h2>
        {activity.length === 0 ? (
          <p className="empty">No activity yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.createdAt)}</td>
                  <td>{log.user?.name ?? "—"}</td>
                  <td>{statusLabel(log.action)}</td>
                  <td>{log.details ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {stats?.tasksByStatus ? (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Tasks by status</h2>
          <div className="row">
            {Object.entries(stats.tasksByStatus).map(([status, count]) => (
              <span className="badge badge-todo" key={status}>
                {statusLabel(status)}: {count}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
