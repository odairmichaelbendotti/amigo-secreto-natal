"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AccountForm from "@/components/AccountForm";
import AuthLayout from "@/components/AuthLayout";
import { Icon } from "@/components/Ui";
interface Group { id: string; name: string; year: number; inviteCode: string }
function JoinContent() {
  const params = useSearchParams(); const router = useRouter();
  const invitation = params.get("code") || "";
  const [code, setCode] = useState(invitation);
  const [group, setGroup] = useState<Group | null>(null);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const load = useCallback(async (value: string) => {
    setLoading(true); setError("");
    try {
      const [response, sessionResponse] = await Promise.all([
        fetch("/api/groups/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inviteCode: value }) }),
        fetch("/api/auth/session", { cache: "no-store" }),
      ]);
      const data = await response.json(); const session = await sessionResponse.json();
      setUser(session.user || null);
      if (!response.ok) { setError(data.error || "Convite inválido"); return; }
      setGroup(data.group);
    } catch { setError("Não foi possível abrir o convite. Tente novamente."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (invitation) void load(invitation); else setLoading(false); }, [invitation, load]);
  async function request() {
    if (!group) return; setBusy(true); setError("");
    try {
      const response = await fetch("/api/join/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inviteCode: group.inviteCode }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error); return; }
      router.replace("/groups");
    } catch { setError("Não foi possível solicitar sua participação."); } finally { setBusy(false); }
  }
  return <AuthLayout title={group?.name || "Tem uma surpresa esperando"} eyebrow={group ? `CONVITE · AMIGO SECRETO ${group.year}` : "VOCÊ FOI CONVIDADO?"} description={group ? "Faça parte deste encontro. Sua entrada será liberada pelo organizador." : "Abra o link que recebeu ou informe o código do grupo para começar."}>
    {error && <p role="alert" className="ui-alert">{error}</p>}
    {loading ? <div className="ui-loading">Carregando convite...</div> : !group ? <form onSubmit={e => { e.preventDefault(); void load(code); }} className="ui-form">
      <div className="ui-field"><label htmlFor="inviteCode">Código do grupo</label><input id="inviteCode" placeholder="Ex.: ABC123" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} required className="ui-input" /></div>
      <button className="ui-btn ui-btn-primary ui-btn-wide">Abrir grupo <Icon name="arrow" /></button>
      <Link href="/login" className="auth-bottom-link">Já participa de um grupo? Fazer login</Link>
    </form> : user ? <div className="ui-form">
      <div className="invite-summary"><span className="avatar">{user.name.slice(0, 1)}</span><div><strong>Olá, {user.name}</strong><p>Sua conta está pronta para participar.</p></div></div>
      <p className="panel-copy">Solicite sua participação. Você acompanha a aprovação em Meus grupos.</p>
      <button onClick={request} disabled={busy} className="ui-btn ui-btn-primary ui-btn-wide">{busy ? "Solicitando..." : "Solicitar participação"}<Icon name="arrow" /></button>
      <Link href="/groups" className="auth-bottom-link">Ir para Meus grupos</Link>
    </div> : <AccountForm inviteCode={group.inviteCode} />}
  </AuthLayout>;
}
export default function JoinGroup() { return <Suspense fallback={<div className="ui-loading">Carregando convite...</div>}><JoinContent /></Suspense>; }
