"use client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Brand, Icon, type IconName } from "@/components/Ui";

export default function AppShell({ children, active, admin = false, participant = false, name, onLogout }: { children: ReactNode; active: "groups" | "admin" | "participation"; admin?: boolean; participant?: boolean; name?: string; onLogout?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links: { href: string; label: string; icon: IconName; key: string }[] = [
    { href: "/groups", label: "Meus grupos", icon: "groups", key: "groups" },
    ...(participant ? [{ href: "/wishlist", label: "Minha participação", icon: "gift" as const, key: "participation" }] : []),
    ...(admin ? [{ href: "/admin/dashboard", label: "Painel do administrador", icon: "settings" as const, key: "admin" }] : []),
    { href: "/create", label: "Criar grupo", icon: "plus", key: "create" },
    { href: "/join", label: "Abrir convite", icon: "link", key: "join" },
  ];
  return <div className="app-shell">
    <aside className={`app-sidebar ${menuOpen ? "is-open" : ""}`}>
      <div className="sidebar-brand"><Brand light /><button type="button" className="mobile-menu-button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="app-navigation" onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? "close" : "menu"} /></button></div>
      <div id="app-navigation" className="sidebar-content">
        <p className="sidebar-caption">SEU ESPAÇO</p>
        <nav aria-label="Menu principal">{links.map(link => <Link key={link.key} href={link.href} aria-current={active === link.key ? "page" : undefined} className={`sidebar-link ${active === link.key ? "is-active" : ""}`} onClick={() => setMenuOpen(false)}><Icon name={link.icon} /><span>{link.label}</span>{active === link.key && <span className="nav-dot" />}</Link>)}</nav>
        <div className="sidebar-note"><Icon name="sparkles" /><p>O melhor do amigo secreto<br /><strong>é surpreender alguém.</strong></p></div>
        <div className="sidebar-bottom">
          {name && <div className="sidebar-user"><span className="avatar">{name.trim().slice(0, 1).toUpperCase()}</span><span>{name}</span></div>}
          {onLogout && <button onClick={onLogout} className="sidebar-link"><Icon name="logout" />Sair</button>}
          <Link href="/" className="sidebar-home">Voltar ao início <Icon name="arrow" /></Link>
        </div>
      </div>
    </aside>
    <main className="app-main"><div className="app-content">{children}</div></main>
  </div>;
}
