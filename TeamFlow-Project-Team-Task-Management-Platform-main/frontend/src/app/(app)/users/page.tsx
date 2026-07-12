"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate, roleLabel, statusLabel } from "@/lib/labels";
import type { Role, User, UserStatus } from "@/lib/types";

export default function UsersPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password123!");
  const [role, setRole] = useState<Role>("TEAM_MEMBER");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasRole("ADMIN")) {
      router.replace("/dashboard");
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      setUsers(await api<User[]>("/users"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/users", {
        method: "POST",
        body: JSON.stringify({ name, email, password, role }),
      });
      setShowForm(false);
      setName("");
      setEmail("");
      setPassword("Password123!");
      setRole("TEAM_MEMBER");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: User) {
    const next: UserStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  }

  async function changeRole(user: User, nextRole: Role) {
    try {
      await api(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: nextRole }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function removeUser(user: User) {
    if (!confirm(`Delete ${user.name}?`)) return;
    try {
      await api(`/users/${user.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  if (!hasRole("ADMIN")) return null;

  return (
    <div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-sub">Manage accounts, roles, and access.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New user"}
        </button>
      </div>

      {error ? <div className="error">{error}</div> : null}

      {showForm ? (
        <form className="panel" onSubmit={onCreate} style={{ marginBottom: "1rem" }}>
          <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)" }}>Create user</h2>
          <div className="field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="field">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="ADMIN">Administrator</option>
              <option value="PROJECT_MANAGER">Project Manager</option>
              <option value="TEAM_MEMBER">Team Member</option>
            </select>
          </div>
          <button className="btn btn-primary" disabled={saving}>
            {saving ? "Creating…" : "Create user"}
          </button>
        </form>
      ) : null}

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value as Role)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="TEAM_MEMBER">Team Member</option>
                  </select>
                </td>
                <td>
                  <span className="badge badge-todo">{statusLabel(u.status)}</span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td className="row">
                  <button className="btn btn-ghost" onClick={() => toggleStatus(u)}>
                    {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                  </button>
                  <button className="btn btn-danger" onClick={() => removeUser(u)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
          Roles: {roleLabel("ADMIN")}, {roleLabel("PROJECT_MANAGER")}, {roleLabel("TEAM_MEMBER")}
        </p>
      </div>
    </div>
  );
}
