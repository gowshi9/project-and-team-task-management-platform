"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, statusLabel } from "@/lib/labels";
import type { Project, User } from "@/lib/types";

export default function ProjectsPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN", "PROJECT_MANAGER");
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const data = await api<Project[]>("/projects");
      setProjects(data);
      if (canManage) {
        try {
          setUsers(await api<User[]>("/users/directory"));
        } catch {
          setUsers([]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api<Project>("/projects", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: description || null,
          memberIds,
        }),
      });
      setName("");
      setDescription("");
      setMemberIds([]);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">Browse and manage projects you can access.</p>
        </div>
        {canManage ? (
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "New project"}
          </button>
        ) : null}
      </div>

      {error ? <div className="error">{error}</div> : null}

      {showForm ? (
        <form className="panel" onSubmit={onCreate} style={{ marginBottom: "1rem" }}>
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Create project</h2>
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {users.length > 0 ? (
            <div className="field">
              <label>Members</label>
              <select
                multiple
                value={memberIds}
                onChange={(e) =>
                  setMemberIds(Array.from(e.target.selectedOptions).map((o) => o.value))
                }
                style={{ minHeight: 120 }}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Creating…" : "Create project"}
          </button>
        </form>
      ) : null}

      <div className="panel">
        {projects.length === 0 ? (
          <p className="empty">No projects yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Tasks</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/projects/${p.id}`} style={{ color: "var(--brand)", fontWeight: 600 }}>
                      {p.name}
                    </Link>
                    {p.description ? (
                      <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                        {p.description.slice(0, 90)}
                        {p.description.length > 90 ? "…" : ""}
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <span className="badge badge-progress">{statusLabel(p.status)}</span>
                  </td>
                  <td>{p.createdBy?.name ?? "—"}</td>
                  <td>{p._count?.tasks ?? p.tasks?.length ?? 0}</td>
                  <td>{formatDate(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
