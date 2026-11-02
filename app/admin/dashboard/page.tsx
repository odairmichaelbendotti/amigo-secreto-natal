"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import DrawResults, { type DrawAssignment } from "@/components/DrawResults";
import { Icon } from "@/components/Ui";
import { formatCurrency } from "@/lib/format";
import { getDrawBlockReason } from "@/lib/draw-rules";
import type { ParticipantStatus } from "@/lib/participants";

interface Person { id: string; name: string; status: ParticipantStatus; _count: { wishlistItems: number } }
const currencies: Record<string, string> = { BRL: "Real brasileiro", USD: "Dólar americano", EUR: "Euro", GBP: "Libra esterlina", CAD: "Dólar canadense", AUD: "Dólar australiano", ZAR: "Rand sul-africano", JPY: "Iene japonês", CHF: "Franco suíço", SEK: "Coroa sueca", NOK: "Coroa norueguesa", DKK: "Coroa dinamarquesa", NZD: "Dólar neozelandês", MXN: "Peso mexicano", INR: "Rupia indiana", CNY: "Yuan chinês", KRW: "Won sul-coreano", SGD: "Dólar de Singapura" };
export default function AdminDashboard() {
  const router = useRouter();
  const [group, setGroup] = useState({ id: "", name: "", inviteCode: "", year: new Date().getFullYear() });
  const [origin, setOrigin] = useState("");
  const [section, setSection] = useState<"overview" | "people" | "settings" | "results">("overview");
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<DrawAssignment[]>([]);
  const [finishedAt, setFinishedAt] = useState<string | null>(null);
  const [wishlistsEnabled, setWishlistsEnabled] = useState(true);
  const [adminPersonId, setAdminPersonId] = useState<string | null>(null);
  const [canParticipate, setCanParticipate] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [existingPersonId, setExistingPersonId] = useState("");
  const [budget, setBudget] = useState<{ amount?: number; currency: string }>({ currency: "USD" });
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const approved = people.filter((person) => person.status === "APPROVED");
  const pending = people.filter((person) => person.status === "PENDING");
  const rejected = people.filter((person) => person.status === "REJECTED");
  const drawBlockedReason = getDrawBlockReason(approved.length) || (busy ? "Aguarde a operação em andamento terminar para realizar o sorteio." : null);
  const invitation = origin && group.inviteCode ? `${origin}/join?code=${encodeURIComponent(group.inviteCode)}` : "";

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/auth/session").then((response) => response.json()).then(async (session) => {
      if (!session.authenticated || !session.isAdmin) { router.replace("/admin"); return; }
      setGroup({ id: session.adminGroupId, name: session.adminGroupName || "", inviteCode: session.adminInviteCode || "", year: new Date().getFullYear() });
      setAdminPersonId(session.adminPersonId || null);
      setCanParticipate(Boolean(session.isLoggedIn && session.adminPersonId && session.personId === session.adminPersonId));
      const [p, a, g] = await Promise.all([fetch(`/api/people?groupId=${session.adminGroupId}`), fetch(`/api/assignments?groupId=${session.adminGroupId}`), fetch(`/api/groups/${session.adminGroupId}`)]);
      if (!p.ok || !a.ok || !g.ok) throw new Error("load");
      setPeople((await p.json()).people || []);
      setAssignments((await a.json()).assignments || []);
      const data = (await g.json()).group;
      setGroup(current => ({ ...current, year: data.year || current.year }));
      setFinishedAt(data.finishedAt || null);
      setWishlistsEnabled(data.wishlistsEnabled !== false);
      setBudget({ amount: data.budgetAmount, currency: data.budgetCurrency || "USD" });
      setAmount(data.budgetAmount?.toString() || ""); setCurrency(data.budgetCurrency || "USD");
      setLoading(false);
    }).catch(() => { setError("Não foi possível carregar o grupo"); setLoading(false); });
  }, [router]);

  useEffect(() => {
    if (!group.id) return;
    const timer = setInterval(async () => {
      try { const response = await fetch(`/api/people?groupId=${group.id}`); if (response.ok) setPeople((await response.json()).people); } catch { /* Retry on the next refresh. */ }
    }, 5000);
    return () => clearInterval(timer);
  }, [group.id]);

  async function refresh() {
    const [p, a] = await Promise.all([fetch(`/api/people?groupId=${group.id}`), fetch(`/api/assignments?groupId=${group.id}`)]);
    if (p.ok) setPeople((await p.json()).people);
    if (a.ok) { const data = await a.json(); setAssignments(data.assignments); setFinishedAt(data.finishedAt || null); }
  }

  async function action(key: string, path: string, method: string, body?: object, message?: string) {
    setBusy(key); setError(""); setSuccess("");
    try {
      const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Não foi possível concluir a ação"); return null; }
      if (message) setSuccess(message);
      await refresh();
      return data;
    } catch { setError("Não foi possível concluir a ação. Tente novamente."); return null; }
    finally { setBusy(""); }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    const data = await action("join", "/api/admin/participation", "POST", { name: participantName, personId: existingPersonId || undefined }, "Sua participação foi cadastrada.");
    if (data) { setAdminPersonId(data.person.id); setCanParticipate(true); }
  }

  async function copyInvite() {
    try { await navigator.clipboard.writeText(invitation); setSuccess("Link do grupo copiado. Compartilhe com os convidados."); }
    catch { setError("Selecione e copie o link do grupo no campo abaixo."); }
  }

  async function saveBudget(e: React.FormEvent) {
    e.preventDefault();
    const value = amount.trim() ? Number(amount) : null;
    if (value !== null && (!Number.isFinite(value) || value <= 0)) { setError("Informe um valor válido para o presente"); return; }
    if (await action("budget", `/api/groups/${group.id}`, "PATCH", { budgetAmount: value, budgetCurrency: currency }, "Valor do presente atualizado.")) setBudget({ amount: value ?? undefined, currency });
  }

  async function toggleWishlists(enabled: boolean) {
    const previous = wishlistsEnabled;
    setWishlistsEnabled(enabled);
    const data = await action("wishlists", `/api/groups/${group.id}`, "PATCH", { wishlistsEnabled: enabled }, enabled ? "Listas de desejos visíveis para o grupo." : "Listas de desejos ocultas. A escolha dos presentes é livre.");
    setWishlistsEnabled(data ? data.group.wishlistsEnabled : previous);
  }

  async function finish() {
    if (!confirm("Finalizar o amigo secreto e liberar para todos os participantes a lista de quem tirou quem? Depois disso, os resultados não poderão ser excluídos.")) return;
    const data = await action("finish", `/api/groups/${group.id}/finish`, "POST", undefined, "Amigo secreto finalizado. O resultado completo está disponível para o grupo.");
    if (data) { setFinishedAt(data.finishedAt); setSection("results"); }
  }

  const finishButton = !finishedAt && assignments.length > 0 && <button type="button" disabled={Boolean(busy)} aria-busy={busy === "finish"} onClick={() => void finish()} className="ui-btn ui-btn-secondary"><Icon name="check" />{busy === "finish" ? "Finalizando..." : "Finalizar amigo secreto"}</button>;

  const requestsPanel = <section className="ui-panel" aria-labelledby="requests-heading">
    <div className="panel-heading"><h2 id="requests-heading">Solicitações pendentes ({pending.length})</h2><Icon name="clock" /></div>
    {!pending.length ? <p className="panel-copy">Tudo em dia. Nenhuma solicitação aguardando aprovação.</p> : <ul className="request-list">{pending.map(person => <li key={person.id} className="request-row"><div className="request-person"><span className="avatar">{person.name.slice(0, 1)}</span><div><strong>{person.name}</strong><small>Quer participar do amigo secreto</small></div></div><div className="request-actions"><button disabled={Boolean(busy) || assignments.length > 0} onClick={() => void action(person.id, `/api/people/${person.id}`, "PATCH", { status: "APPROVED" }, `${person.name} foi aprovado para participar.`)} className="ui-btn ui-btn-primary ui-btn-small">Aprovar</button><button disabled={Boolean(busy)} onClick={() => void action(person.id, `/api/people/${person.id}`, "PATCH", { status: "REJECTED" }, "Solicitação não aprovada.")} className="ui-btn ui-btn-ghost ui-btn-small">Não aprovar</button></div></li>)}</ul>}
    {assignments.length > 0 && pending.length > 0 && <p className="ui-hint">Para aprovar novas pessoas, exclua os resultados e realize um novo sorteio.</p>}
  </section>;
  const participationPanel = !adminPersonId && <section className="ui-panel" aria-labelledby="participation-heading"><div className="panel-heading"><h2 id="participation-heading">Sua participação no sorteio</h2><Icon name="gift" /></div><p className="panel-copy">Você está apenas organizando. Quer entrar na brincadeira também?</p><form onSubmit={join} className="join-admin-form">
    {approved.length > 0 && <div className="ui-field"><label htmlFor="existingParticipant">Já está na lista de participantes?</label><select id="existingParticipant" value={existingPersonId} onChange={e => setExistingPersonId(e.target.value)} className="ui-input"><option value="">Criar meu cadastro</option>{approved.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></div>}
    <div className="join-admin-row">{!existingPersonId && <div className="ui-field"><label htmlFor="participantName">Seu nome como participante</label><input id="participantName" value={participantName} onChange={e => setParticipantName(e.target.value)} required className="ui-input" /></div>}<button disabled={Boolean(busy)} className="ui-btn ui-btn-primary">{busy === "join" ? "Cadastrando..." : "Participar do sorteio"}</button></div>
  </form></section>;
  const drawPanel = <section className="ui-panel" aria-labelledby="draw-heading">
    <div className="panel-heading"><h2 id="draw-heading">Sorteio</h2><Icon name="sparkles" /></div>
    <p className="draw-count"><strong>{approved.length}</strong>{approved.length === 1 ? "participante aprovado" : "participantes aprovados"}</p>
    <p className="panel-copy">Somente as pessoas aprovadas entram no sorteio. Solicitações pendentes não contam para o mínimo de 2 participantes.</p>
    {approved.length === 2 && <p className="ui-hint">Com 2 participantes, um necessariamente tira o outro. Convide mais uma pessoa para haver surpresa.</p>}
    {!assignments.length ? <>
      {drawBlockedReason && <p id="draw-block-reason" role="status" className="draw-note">{drawBlockedReason}</p>}
      <div className="draw-actions"><button disabled={Boolean(drawBlockedReason)} aria-busy={busy === "draw"} aria-describedby={drawBlockedReason ? "draw-block-reason" : undefined} onClick={() => {
        const confirmation = approved.length === 2 ? "Com 2 participantes, um tirará o outro. Realizar o sorteio?" : "Realizar o sorteio com os participantes aprovados?";
        if (confirm(confirmation)) void action("draw", "/api/assignments/generate", "POST", { groupId: group.id, year: group.year }, "Sorteio realizado com sucesso.");
      }} className="ui-btn ui-btn-primary"><Icon name="gift" />{busy === "draw" ? "Realizando sorteio..." : "Realizar sorteio"}</button></div>
    </> : <><p className="ui-hint">{finishedAt ? "Amigo secreto finalizado. A lista completa está liberada para os participantes." : "O sorteio já foi realizado. Depois da troca de presentes, finalize o amigo secreto para revelar ao grupo quem tirou quem."}</p><div className="draw-actions"><button onClick={() => setSection("results")} className="ui-btn ui-btn-primary">Ver resultado <Icon name="arrow" /></button>{finishButton}{!finishedAt && <button disabled={Boolean(busy)} onClick={() => { if (confirm("Excluir os resultados atuais do sorteio?")) void action("draw", `/api/assignments?groupId=${group.id}`, "DELETE", undefined, "Resultados excluídos. Você pode avaliar novas solicitações e sortear novamente."); }} className="ui-btn ui-btn-danger ui-btn-small">Excluir resultados do sorteio</button>}</div></>}
  </section>;

  return <AppShell active="admin" admin participant={canParticipate} onLogout={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); }}>
    <header className="page-header"><div><span className="eyebrow">SEU GRUPO, DO SEU JEITO</span><h1>Painel do administrador</h1><p>{group.name || "Organize os detalhes e deixe a surpresa acontecer."}</p></div><span className="ui-pill"><Icon name="settings" />Organizador</span></header>
    {loading ? <div className="ui-loading">Carregando...</div> : <>
      <div className="stats-grid">
        <div className="stat-card"><span className="stat-icon"><Icon name="groups" /></span><div><strong>{approved.length}</strong><p>Participantes aprovados</p></div></div>
        <div className="stat-card"><span className="stat-icon"><Icon name="clock" /></span><div><strong>{pending.length}</strong><p>Solicitações pendentes</p></div></div>
        <div className="stat-card"><span className="stat-icon"><Icon name="gift" /></span><div><strong>{finishedAt ? "Finalizado" : assignments.length ? "Realizado" : "Em preparo"}</strong><p>Status do sorteio</p></div></div>
      </div>
      <div className="admin-tabs" role="tablist" aria-label="Seções do painel">{([{ key: "overview", label: "Visão geral" }, { key: "people", label: "Participantes" }, { key: "settings", label: "Configurações" }, { key: "results", label: "Resultado" }] as const).map(tab => <button key={tab.key} role="tab" id={`tab-${tab.key}`} aria-selected={section === tab.key} aria-controls="admin-tab-panel" onClick={() => setSection(tab.key)}>{tab.label}{tab.key === "people" && pending.length > 0 && <span className="tab-count">{pending.length}</span>}</button>)}</div>
      {error && <p role="alert" className="ui-alert">{error}</p>}
      {success && <p role="status" className="ui-alert ui-alert-success">{success}</p>}
      <div key={section} id="admin-tab-panel" role="tabpanel" aria-labelledby={`tab-${section}`} className="admin-stack motion-content">
        {section === "overview" && <>
          <div className="admin-grid"><section className="ui-panel" aria-labelledby="invite-heading"><div className="panel-heading"><h2 id="invite-heading">Link de convite do grupo</h2><Icon name="link" /></div><p className="panel-copy">Compartilhe com seus convidados. Eles criam uma conta e você aprova a participação por aqui.</p><div className="copy-row"><input aria-label="Link de convite do grupo" readOnly value={invitation} onFocus={e => e.target.select()} className="ui-input" /><button aria-label="Copiar link do grupo" onClick={copyInvite} disabled={!invitation} className="ui-btn ui-btn-secondary"><Icon name="copy" /><span className="copy-label">Copiar link</span></button></div><p className="ui-hint">Um único link para reunir todo mundo.</p></section>{drawPanel}</div>
          {(pending.length > 0 || !adminPersonId) && <div className="admin-grid">{pending.length > 0 && requestsPanel}{participationPanel}</div>}
          {pending.length === 0 && adminPersonId && <div className="welcome-banner"><div><h2>Tudo pronto para o próximo passo.</h2><p>{assignments.length ? "O sorteio foi realizado. Cada pessoa já pode conferir seu amigo secreto." : "Convidados aprovados? Quando todos estiverem prontos, é só realizar o sorteio."}</p></div><Icon name="heart" /></div>}
        </>}
        {section === "people" && <>
          {requestsPanel}
          <section className="ui-panel"><div className="panel-heading"><h2>Participantes aprovados ({approved.length})</h2><Icon name="groups" /></div>{!approved.length ? <p className="panel-copy">Nenhum participante aprovado. Compartilhe o link do grupo e avalie as solicitações.</p> : <div className="table-wrap"><table className="ui-table"><thead><tr><th>Nome completo</th>{wishlistsEnabled && <th>Lista de desejos</th>}<th>Ações</th></tr></thead><tbody>{approved.map(person => <tr key={person.id}><td><div className="table-person"><span className="avatar">{person.name.slice(0, 1)}</span><span>{person.name}{person.id === adminPersonId && <small>Administrador</small>}</span></div></td>{wishlistsEnabled && <td>{person._count.wishlistItems}/5 itens</td>}<td><button disabled={Boolean(busy) || person.id === adminPersonId || assignments.length > 0} onClick={() => { if (confirm(`Remover ${person.name} do grupo?`)) void action(person.id, `/api/people/${person.id}`, "DELETE", undefined, "Participante removido."); }} className="ui-btn ui-btn-danger ui-btn-small">Remover</button></td></tr>)}</tbody></table></div>}</section>
          {rejected.length > 0 && <details className="ui-panel"><summary className="ui-link">Solicitações não aprovadas ({rejected.length})</summary><ul className="request-list">{rejected.map(person => <li key={person.id} className="request-row"><strong>{person.name}</strong><button disabled={Boolean(busy) || assignments.length > 0} onClick={() => void action(person.id, `/api/people/${person.id}`, "PATCH", { status: "APPROVED" }, "Participação aprovada.")} className="ui-btn ui-btn-primary ui-btn-small">Aprovar</button></li>)}</ul></details>}
        </>}
        {section === "settings" && <>
          <section className="ui-panel" aria-labelledby="wishlists-heading"><div className="settings-row"><div><div className="panel-heading"><h2 id="wishlists-heading">Listas de desejos do grupo</h2></div><p id="wishlists-description" className="panel-copy">Dê liberdade para escolher os presentes. Ao ocultar as listas, os participantes veem apenas quem tiraram. As sugestões já salvas são preservadas caso você ative novamente.</p></div><label className="setting-toggle"><input type="checkbox" role="switch" checked={wishlistsEnabled} disabled={Boolean(busy)} onChange={e => void toggleWishlists(e.target.checked)} aria-describedby="wishlists-description" />Exibir listas de desejos</label></div><p className="settings-status">{busy === "wishlists" ? "Salvando configuração..." : wishlistsEnabled ? "Ativadas: os participantes podem adicionar sugestões de presentes." : "Ocultas: o grupo participa sem listas de desejos."}</p></section>
          <section className="ui-panel"><div className="panel-heading"><h2>Valor do presente</h2><Icon name="gift" /></div><p className="panel-copy">Uma referência para deixar todo mundo à vontade. O valor é opcional.</p><form onSubmit={saveBudget} className="budget-form"><div className="ui-field"><label htmlFor="budgetAmount">Valor (opcional)</label><input id="budgetAmount" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50,00" className="ui-input" /></div><div className="ui-field"><label htmlFor="budgetCurrency">Moeda</label><select id="budgetCurrency" value={currency} onChange={e => setCurrency(e.target.value)} className="ui-input">{Object.entries(currencies).map(([key, label]) => <option key={key} value={key}>{key} - {label}</option>)}</select></div><button disabled={Boolean(busy)} className="ui-btn ui-btn-primary">Atualizar valor</button></form><p className="budget-current">{budget.amount ? `Valor atual: ${formatCurrency(budget.amount, budget.currency)}` : "Nenhum valor definido"}</p></section>
          {participationPanel}
        </>}
        {section === "results" && <DrawResults assignments={assignments} wishlistsEnabled={wishlistsEnabled} finished={Boolean(finishedAt)}>{finishButton && <div className="draw-actions">{finishButton}</div>}</DrawResults>}
      </div>
    </>}
  </AppShell>;
}
