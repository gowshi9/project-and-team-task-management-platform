"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { roleLabel } from "@/lib/labels";
import type { Role } from "@/lib/types";

const links: { href: string; label: string; roles?: Role[] }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/tasks", label: "Tasks" },
  { href: "/users", label: "Users", roles: ["ADMIN"] },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="login-page">
        <p>Loading workspace…</p>
      </div>
    );
  }

  const visibleLinks = links.filter(
    (l) => !l.roles || hasRole(...l.roles)
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand">TeamFlow</div>
          <p style={{ margin: "0.35rem 0 0", opacity: 0.75, fontSize: "0.9rem" }}>
            Project &amp; team tasks
          </p>
        </div>

        <nav className="stack" style={{ gap: "0.35rem", flex: 1 }}>
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link${pathname.startsWith(link.href) ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div>
          <div style={{ fontWeight: 600 }}>{user.name}</div>
          <div style={{ opacity: 0.75, fontSize: "0.85rem", marginBottom: "0.8rem" }}>
            {roleLabel(user.role)}
          </div>
          <button
            className="btn btn-ghost"
            style={{ color: "white", borderColor: "rgba(255,255,255,0.25)", width: "100%" }}
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
