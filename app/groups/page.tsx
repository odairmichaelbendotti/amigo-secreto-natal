"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Icon } from "@/components/Ui";
interface Group { id: string; name: string; year: number; status: "PENDING" | "APPROVED" | "REJECTED" | null; isAdmin: boolean; wishlistsEnabled?: boolean }
export default function MyGroups() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(""); const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/account/groups", { cache: "no-store" });
      if (response.status === 401) { router.replace("/login"); return; }
      if (!response.ok) throw new Error();
      const data = await response.json(); setUser(data.user); setGroups(data.groups); setError("");
    } catch { setError("Não foi possível carregar seus grupos. Tente novamente."); } finally { setLoading(false); }
  }, [router]);
  useEffect(() => { void load(); const timer = setInterval(load, 5000); window.addEventListener("focus", load); return () => { clearInterval(timer); window.removeEventListener("focus", load); }; }, [load]);
  async function enter(group: Group, admin: boolean) {
    setBusy(group.id); setError("");
    try {
      const response = await fetch(`/api/groups/${group.id}/select`, { method: "POST" }); const data = await response.json();
      if (!response.ok) { setError(data.error); return; }
      router.push(admin && data.isAdmin ? "/admin/dashboard" : "/wishlist");
    } catch { setError("Não foi possível abrir o grupo."); } finally { setBusy(""); }
  }
  async function logout() { const response = await fetch("/api/auth/logout", { method: "POST" }); if (response.ok) router.replace("/login"); }
  const approvedCount = groups.filter(group => group.status === "APPROVED").length;
  const pendingCount = groups.filter(group => group.status === "PENDING").length;
  return <AppShell active="groups" name={user?.name} onLogout={logout}>
    <header className="page-header"><div><span className="eyebrow">BONS ENCONTROS COMEÇAM AQUI</span><h1>Meus grupos</h1><p>{user ? `${user.name} · ${user.email}` : "Todos os seus amigos secretos em um só lugar."}</p></div><div className="page-actions"><Link href="/create" className="ui-btn ui-btn-primary"><Icon name="plus" />Criar novo grupo</Link></div></header>
    <div className="welcome-banner"><div><h2>Uma boa surpresa está a caminho.</h2><p>Escolha seu amigo secreto e clique em <strong>Entrar no grupo</strong> para acessar sua participação.</p></div><Icon name="gift" /></div>
    <div className="stats-grid">
      <div className="stat-card"><span className="stat-icon"><Icon name="groups" /></span><div><strong>{groups.length}</strong><p>Grupos na sua conta</p></div></div>
      <div className="stat-card"><span className="stat-icon"><Icon name="check" /></span><div><strong>{approvedCount}</strong><p>Participações aprovadas</p></div></div>
      <div className="stat-card"><span className="stat-icon"><Icon name="clock" /></span><div><strong>{pendingCount}</strong><p>Aguardando aprovação</p></div></div>
    </div>
    {error && <p role="alert" className="ui-alert">{error}</p>}
    <div className="section-label"><h2>Seus amigos secretos</h2><span>{groups.length} {groups.length === 1 ? "grupo" : "grupos"}</span></div>
    {loading ? <div className="ui-loading">Carregando seus grupos...</div> : <div className="groups-grid" aria-live="polite">
      {groups.length === 0 && <div className="ui-panel"><div className="ui-empty"><Icon name="gift" /><p>Você ainda não tem grupos. Abra o convite de um organizador ou crie seu grupo.</p></div><Link href="/join" className="ui-btn ui-btn-secondary">Abrir um convite <Icon name="arrow" /></Link></div>}
      {groups.map(group => <article key={group.id} className="group-card">
        <div className="group-card-top"><span className={`group-avatar ${group.status === "PENDING" ? "gold" : ""}`}><Icon name="gift" /></span><span className={`ui-pill ${group.status === "PENDING" ? "ui-pill-wait" : group.status === "REJECTED" ? "ui-pill-muted" : ""}`}>{group.isAdmin ? "Administrador" : group.status === "APPROVED" ? "Participação aprovada" : group.status === "PENDING" ? "Em análise" : "Não aprovada"}</span></div>
        <h2>{group.name}</h2><p className="group-card-meta">Amigo secreto · {group.year}</p>
        {group.status === "PENDING" && <><p className="group-pending">Aguardando aprovação do administrador</p><p className="panel-copy">Assim que sua entrada for aprovada, o acesso ao grupo aparece aqui.</p></>}
        {group.status === "REJECTED" && <p className="panel-copy">Solicitação não aprovada. Fale com o organizador.</p>}
        {group.status === "APPROVED" && <div className="group-card-actions"><button onClick={() => enter(group, false)} disabled={Boolean(busy)} className="ui-btn ui-btn-primary ui-btn-wide">{busy === group.id ? "Abrindo..." : "Entrar no grupo"}<Icon name="arrow" /></button><p className="ui-hint">{group.wishlistsEnabled === false ? "Escolha o presente livremente e surpreenda." : "Sua lista de desejos e o resultado do sorteio."}</p>{group.isAdmin ? <button onClick={() => enter(group, true)} disabled={Boolean(busy)} className="group-admin-link">Administrar</button> : <span className="group-admin-spacer" aria-hidden="true" />}</div>}
        {group.isAdmin && group.status !== "APPROVED" && <button onClick={() => enter(group, true)} disabled={Boolean(busy)} className="ui-btn ui-btn-primary ui-btn-wide">Administrar</button>}
      </article>)}
    </div>}
  </AppShell>;
}
