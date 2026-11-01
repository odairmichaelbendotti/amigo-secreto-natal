"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const input = "w-full bg-santa-dark text-santa-snow border border-white/10 p-3 rounded-lg";
  return <main className="min-h-screen flex items-center justify-center bg-santa-dark p-4"><div className="bg-[#151528] p-8 rounded-2xl border border-white/10 w-full max-w-md">
    <h1 className="text-3xl font-bold text-santa-green mb-3">Crie seu grupo</h1>
    {error && <p role="alert" className="text-santa-red mb-4">{error}</p>}
    {checking ? <p className="text-gray-400">Carregando...</p> : !authenticated ? <><p className="text-gray-400 mb-6">Primeiro, crie sua conta ou faça login. Essa senha dá acesso aos seus grupos.</p><AccountForm next="/create" onSuccess={() => setAuthenticated(true)} /></> : <form onSubmit={submit} className="space-y-5">
      <div><label htmlFor="groupName" className="block text-sm text-gray-300 mb-2">Nome do grupo</label><input id="groupName" value={groupName} onChange={e => setGroupName(e.target.value)} maxLength={120} required className={input} /></div>
      <div><label htmlFor="year" className="block text-sm text-gray-300 mb-2">Ano</label><input id="year" type="number" min={2024} max={2100} value={year} onChange={e => setYear(Number(e.target.value))} required className={input} /></div>
      <div className="bg-santa-green/10 border border-santa-green/30 rounded-lg p-4"><label className="flex items-start gap-3 text-sm text-gray-300"><input type="checkbox" checked={adminParticipates} onChange={e => setAdminParticipates(e.target.checked)} className="mt-1 accent-santa-green" />Quero participar do amigo secreto</label><p className="text-xs text-gray-400 mt-2">Seu nome da conta aparecerá na lista de participantes. Você também pode apenas organizar.</p></div>
      <button disabled={loading} className="w-full bg-santa-green text-white py-3 rounded-xl font-semibold disabled:opacity-50">{loading ? "Criando..." : "Criar grupo"}</button>
    </form>}
    <Link href="/groups" className="block text-center text-santa-gold text-sm mt-6">Meus grupos</Link>
    <Link href="/" className="block text-center text-gray-400 text-sm mt-4">← Voltar ao início</Link>
  </div></main>;
}
