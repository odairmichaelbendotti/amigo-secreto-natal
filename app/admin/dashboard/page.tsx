"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import { getDrawBlockReason } from "@/lib/draw-rules";
import type { ParticipantStatus } from "@/lib/participants";

interface Person { id: string; name: string; status: ParticipantStatus; _count: { wishlistItems: number } }
interface Assignment { id: string; giver: { name: string }; receiver: { name: string; wishlistItems: { title: string; link: string }[] } }
const currencies: Record<string, string> = { BRL: "Real brasileiro", USD: "Dólar americano", EUR: "Euro", GBP: "Libra esterlina", CAD: "Dólar canadense", AUD: "Dólar australiano", ZAR: "Rand sul-africano", JPY: "Iene japonês", CHF: "Franco suíço", SEK: "Coroa sueca", NOK: "Coroa norueguesa", DKK: "Coroa dinamarquesa", NZD: "Dólar neozelandês", MXN: "Peso mexicano", INR: "Rupia indiana", CNY: "Yuan chinês", KRW: "Won sul-coreano", SGD: "Dólar de Singapura" };
const panel = "bg-[#151528] p-6 rounded-2xl border border-white/10 card-glow";
const input = "w-full px-4 py-2 bg-santa-dark border border-white/10 rounded-lg text-santa-snow";
const button = "px-4 py-2 rounded-lg font-semibold min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed";

export default function AdminDashboard() {
  const router = useRouter();
  const [group, setGroup] = useState({ id: "", name: "", inviteCode: "" });
  const [origin, setOrigin] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
      setGroup({ id: session.adminGroupId, name: session.adminGroupName || "", inviteCode: session.adminInviteCode || "" });
      setAdminPersonId(session.adminPersonId || null);
      setCanParticipate(Boolean(session.isLoggedIn && session.adminPersonId && session.personId === session.adminPersonId));
      const [p, a, g] = await Promise.all([fetch(`/api/people?groupId=${session.adminGroupId}`), fetch(`/api/assignments?groupId=${session.adminGroupId}`), fetch(`/api/groups/${session.adminGroupId}`)]);
      if (!p.ok || !a.ok || !g.ok) throw new Error("load");
      setPeople((await p.json()).people || []);
      setAssignments((await a.json()).assignments || []);
      const data = (await g.json()).group;
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
    if (a.ok) setAssignments((await a.json()).assignments);
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

  if (loading) return <main className="min-h-screen flex items-center justify-center text-santa-gold">Carregando...</main>;
  return <main className="min-h-screen bg-santa-dark p-4 md:p-8"><div className="max-w-7xl mx-auto">
    <header className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-8">
      <div><h1 className="text-2xl sm:text-4xl font-bold text-santa-red font-display">Painel do administrador</h1><p className="text-gray-300 mt-2">{group.name}</p></div>
      <div className="flex gap-3 flex-wrap items-start"><Link href="/groups" className="text-santa-gold px-4 py-2">Meus grupos</Link>{canParticipate && <Link href="/wishlist" className={`${button} bg-santa-green text-white`}>Minha participação</Link>}<button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); }} className={`${button} bg-white/10 text-santa-snow`}>Sair</button></div>
    </header>
    {error && <p role="alert" className="bg-santa-red/10 text-santa-red border border-santa-red/30 p-4 rounded-lg mb-5">{error}</p>}
    {success && <p role="status" className="bg-santa-green/10 text-santa-green border border-santa-green/30 p-4 rounded-lg mb-5">{success}</p>}

    <section className={`${panel} mb-8`} aria-labelledby="invite-heading"><h2 id="invite-heading" className="text-xl font-bold text-santa-gold mb-2">Link de convite do grupo</h2><p className="text-gray-300 text-sm mb-4">Compartilhe este link. Cada convidado cria sua conta com nome completo, e-mail e senha e solicita sua aprovação.</p><div className="flex flex-col sm:flex-row gap-3"><input aria-label="Link de convite do grupo" readOnly value={invitation} onFocus={(e) => e.target.select()} className={`${input} flex-1 min-w-0`} /><button onClick={copyInvite} disabled={!invitation} className={`${button} bg-santa-green text-white`}>Copiar link do grupo</button></div></section>

    {!adminPersonId && <section className={`${panel} mb-8`} aria-labelledby="participation-heading"><h2 id="participation-heading" className="text-xl font-bold text-santa-snow mb-2">Sua participação no sorteio</h2><p className="text-gray-300 text-sm mb-4">Você está apenas organizando o grupo. Se quiser, também pode participar do sorteio.</p><form onSubmit={join} className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
      {approved.length > 0 && <div className="w-full sm:w-auto"><label htmlFor="existingParticipant" className="block text-sm text-gray-300 mb-2">Já está na lista de participantes?</label><select id="existingParticipant" value={existingPersonId} onChange={(e) => setExistingPersonId(e.target.value)} className={input}><option value="">Criar meu cadastro</option>{approved.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></div>}
      {!existingPersonId && <div className="w-full sm:w-auto"><label htmlFor="participantName" className="block text-sm text-gray-300 mb-2">Seu nome como participante</label><input id="participantName" value={participantName} onChange={(e) => setParticipantName(e.target.value)} required className={input} /></div>}
      <button disabled={Boolean(busy)} className={`${button} bg-santa-green text-white`}>{busy === "join" ? "Cadastrando..." : "Participar do sorteio"}</button>
    </form></section>}

    <section className={`${panel} mb-8`} aria-labelledby="requests-heading"><h2 id="requests-heading" className="text-2xl font-bold text-santa-gold mb-4">Solicitações pendentes ({pending.length})</h2>
      {!pending.length ? <p className="text-gray-400">Nenhuma solicitação aguardando aprovação.</p> : <ul className="space-y-3">{pending.map((person) => <li key={person.id} className="bg-santa-dark/50 border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><span className="font-semibold text-santa-snow">{person.name}</span><div className="flex gap-3"><button disabled={Boolean(busy) || assignments.length > 0} onClick={() => void action(person.id, `/api/people/${person.id}`, "PATCH", { status: "APPROVED" }, `${person.name} foi aprovado para participar.`)} className={`${button} bg-santa-green text-white`}>Aprovar</button><button disabled={Boolean(busy)} onClick={() => void action(person.id, `/api/people/${person.id}`, "PATCH", { status: "REJECTED" }, "Solicitação não aprovada.")} className={`${button} bg-santa-red/20 text-santa-red`}>Não aprovar</button></div></li>)}</ul>}
      {assignments.length > 0 && pending.length > 0 && <p className="text-sm text-gray-400 mt-3">Para aprovar novas pessoas, exclua os resultados e realize um novo sorteio.</p>}
    </section>

    <section className={`${panel} mb-8`} aria-labelledby="wishlists-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 id="wishlists-heading" className="text-xl font-bold text-santa-snow mb-2">Listas de desejos do grupo</h2>
          <p id="wishlists-description" className="text-gray-400 text-sm max-w-2xl">Você decide se o grupo usa sugestões de presentes. Ao ocultar, os participantes veem apenas quem tiraram no sorteio e escolhem o presente livremente. As listas já salvas são preservadas caso você ative novamente.</p>
        </div>
        <label className="flex items-center gap-3 text-santa-snow font-semibold cursor-pointer shrink-0">
          <input type="checkbox" role="switch" checked={wishlistsEnabled} disabled={Boolean(busy)} onChange={e => void toggleWishlists(e.target.checked)} aria-describedby="wishlists-description" className="h-6 w-6 accent-santa-green disabled:cursor-wait" />
          Exibir listas de desejos
        </label>
      </div>
      <p className="text-sm text-santa-gold mt-4">{busy === "wishlists" ? "Salvando configuração..." : wishlistsEnabled ? "Ativadas: os participantes podem adicionar sugestões de presentes." : "Ocultas: o grupo participa sem listas de desejos."}</p>
    </section>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <section className={panel}><h2 className="text-xl font-bold text-santa-snow mb-4">Valor do presente</h2><form onSubmit={saveBudget} className="space-y-4"><div><label htmlFor="budgetAmount" className="block text-sm text-gray-300 mb-2">Valor (opcional)</label><input id="budgetAmount" type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50,00" className={input} /></div><div><label htmlFor="budgetCurrency" className="block text-sm text-gray-300 mb-2">Moeda</label><select id="budgetCurrency" value={currency} onChange={(e) => setCurrency(e.target.value)} className={input}>{Object.entries(currencies).map(([key, label]) => <option key={key} value={key}>{key} - {label}</option>)}</select></div><p className="text-sm text-gray-400">{budget.amount ? `Valor atual: ${formatCurrency(budget.amount, budget.currency)}` : "Nenhum valor definido"}</p><button disabled={Boolean(busy)} className={`${button} bg-santa-gold text-santa-dark`}>Atualizar valor</button></form></section>
      <section className={panel} aria-labelledby="draw-heading">
        <h2 id="draw-heading" className="text-xl font-bold text-santa-snow mb-4">Sorteio</h2>
        <p className="text-gray-300 mb-4">{approved.length} {approved.length === 1 ? "participante aprovado" : "participantes aprovados"}</p>
        <p className="text-sm text-gray-400 mb-4">Somente as pessoas aprovadas entram no sorteio. Solicitações pendentes não contam para o mínimo de 2 participantes.</p>
        {approved.length === 2 && <p className="text-sm text-santa-gold mb-4">Com 2 participantes, um necessariamente tira o outro. Para haver surpresa sobre quem cada pessoa vai tirar, convide pelo menos mais uma pessoa.</p>}
        {!assignments.length ? <>
          {drawBlockedReason && <p id="draw-block-reason" role="status" className="text-sm text-santa-gold mb-4">{drawBlockedReason}</p>}
          <button disabled={Boolean(drawBlockedReason)} aria-describedby={drawBlockedReason ? "draw-block-reason" : undefined} onClick={() => {
            const confirmation = approved.length === 2 ? "Com 2 participantes, um tirará o outro. Realizar o sorteio?" : "Realizar o sorteio com os participantes aprovados?";
            if (confirm(confirmation)) void action("draw", "/api/assignments/generate", "POST", { groupId: group.id, year: new Date().getFullYear() }, "Sorteio realizado com sucesso.");
          }} className={`${button} bg-santa-red text-white`}>{busy === "draw" ? "Realizando sorteio..." : "Realizar sorteio"}</button>
        </> : <>
          <p className="text-sm text-gray-400 mb-4">O sorteio já foi realizado. Para sortear novamente, exclua os resultados atuais.</p>
          <button disabled={Boolean(busy)} onClick={() => { if (confirm("Excluir os resultados atuais do sorteio?")) void action("draw", `/api/assignments?groupId=${group.id}`, "DELETE", undefined, "Resultados excluídos. Você pode avaliar novas solicitações e sortear novamente."); }} className={`${button} bg-santa-gold text-santa-dark`}>Excluir resultados do sorteio</button>
        </>}
      </section>
    </div>

    <section className={`${panel} mb-8`}><h2 className="text-2xl font-bold text-santa-snow mb-4">Participantes aprovados ({approved.length})</h2>{!approved.length ? <p className="text-gray-400">Nenhum participante aprovado. Compartilhe o link do grupo e avalie as solicitações.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-santa-gold"><tr><th className="p-3">Nome completo</th>{wishlistsEnabled && <th className="p-3">Lista de desejos</th>}<th className="p-3">Ações</th></tr></thead><tbody>{approved.map((person) => <tr key={person.id} className="border-t border-white/10"><td className="p-3 text-santa-snow">{person.name}{person.id === adminPersonId && " (administrador)"}</td>{wishlistsEnabled && <td className="p-3 text-gray-300">{person._count.wishlistItems}/5 itens</td>}<td className="p-3"><button disabled={Boolean(busy) || person.id === adminPersonId || assignments.length > 0} onClick={() => { if (confirm(`Remover ${person.name} do grupo?`)) void action(person.id, `/api/people/${person.id}`, "DELETE", undefined, "Participante removido."); }} className={`${button} text-santa-red`}>Remover</button></td></tr>)}</tbody></table></div>}</section>

    {rejected.length > 0 && <details className={`${panel} mb-8`}><summary className="font-semibold text-gray-300 cursor-pointer">Solicitações não aprovadas ({rejected.length})</summary><ul className="mt-4 space-y-3">{rejected.map((person) => <li key={person.id} className="flex flex-wrap justify-between items-center gap-3 text-gray-300"><span>{person.name}</span><button disabled={Boolean(busy) || assignments.length > 0} onClick={() => void action(person.id, `/api/people/${person.id}`, "PATCH", { status: "APPROVED" }, "Participação aprovada.")} className={`${button} bg-santa-green text-white`}>Aprovar</button></li>)}</ul></details>}

    {assignments.length > 0 && <section className={panel}><h2 className="text-2xl font-bold text-santa-snow mb-4">Resultado do sorteio ({assignments.length})</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-santa-gold"><tr><th className="p-3">Quem presenteia</th><th className="p-3">Quem recebe</th>{wishlistsEnabled && <th className="p-3">Lista de desejos</th>}</tr></thead><tbody>{assignments.map((assignment) => <tr key={assignment.id} className="border-t border-white/10 text-gray-300"><td className="p-3">{assignment.giver.name}</td><td className="p-3">{assignment.receiver.name}</td>{wishlistsEnabled && <td className="p-3">{assignment.receiver.wishlistItems.length} itens</td>}</tr>)}</tbody></table></div></section>}
  </div></main>;
}
