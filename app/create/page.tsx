"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { Icon } from "@/components/Ui";
import AccountForm from "@/components/AccountForm";
export default function CreateGroup() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false); const [checking, setChecking] = useState(true);
  const [groupName, setGroupName] = useState(""); const [year, setYear] = useState(2026);
  const [adminParticipates, setAdminParticipates] = useState(true);
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  useEffect(() => { setYear(new Date().getFullYear()); fetch("/api/auth/session", { cache: "no-store" }).then(r => r.json()).then(data => setAuthenticated(Boolean(data.user))).catch(() => setError("Não foi possível verificar sua conta.")).finally(() => setChecking(false)); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/groups/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupName, year, adminParticipates }) });
      const data = await response.json(); if (!response.ok) { setError(data.error); return; }
      router.push("/admin/dashboard");
    } catch { setError("Não foi possível criar o grupo. Tente novamente."); } finally { setLoading(false); }
  }
  return <AuthLayout title="Crie seu grupo" eyebrow="COMECE UMA NOVA TRADIÇÃO" description={authenticated ? "Dê um nome ao encontro. Depois, é só compartilhar o convite." : "Primeiro, crie sua conta ou faça login. Essa senha dá acesso aos seus grupos."}>
    {error && <p role="alert" className="ui-alert">{error}</p>}
    {checking ? <div className="ui-loading">Carregando...</div> : !authenticated ? <AccountForm next="/create" onSuccess={() => setAuthenticated(true)} /> : <form onSubmit={submit} className="ui-form">
      <div className="form-row">
        <div className="ui-field"><label htmlFor="groupName">Nome do grupo</label><input id="groupName" placeholder="Ex.: Natal da família" value={groupName} onChange={e => setGroupName(e.target.value)} maxLength={120} required className="ui-input" /></div>
        <div className="ui-field"><label htmlFor="year">Ano</label><input id="year" type="number" min={2024} max={2100} value={year} onChange={e => setYear(Number(e.target.value))} required className="ui-input" /></div>
      </div>
      <label className="ui-check"><input type="checkbox" checked={adminParticipates} onChange={e => setAdminParticipates(e.target.checked)} /><span><strong>Quero participar do amigo secreto</strong><small>Seu nome também entra no sorteio. Desmarque se quiser apenas organizar.</small></span></label>
      <button disabled={loading} aria-busy={loading} className="ui-btn ui-btn-primary ui-btn-wide">{loading ? "Criando..." : "Criar grupo"}<Icon name="arrow" /></button>
    </form>}
    <Link href="/groups" className="auth-bottom-link">Acessar Meus grupos</Link>
  </AuthLayout>;
}
