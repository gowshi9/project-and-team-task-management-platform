"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@teamflow.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="panel login-card">
        <p style={{ color: "var(--brand)", fontWeight: 700, margin: 0 }}>TeamFlow</p>
        <h1 className="page-title" style={{ marginTop: "0.4rem" }}>
          Sign in
        </h1>
        <p className="page-sub">
          Manage projects, teams, and tasks with role-based access.
        </p>

        {error ? <div className="error">{error}</div> : null}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: "100%" }}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: "1.2rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          <p style={{ margin: "0 0 0.4rem" }}>Demo accounts (password: Password123!)</p>
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            <li>admin@teamflow.local</li>
            <li>pm@teamflow.local</li>
            <li>alex@teamflow.local</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
