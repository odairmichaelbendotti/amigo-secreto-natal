"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AccountForm from "@/components/AccountForm";
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
  return <main className="min-h-screen flex items-center justify-center bg-santa-dark p-4"><div className="bg-[#151528] p-8 rounded-2xl border border-white/10 card-glow w-full max-w-md">
    <h1 className="text-3xl font-bold text-santa-gold mb-2">{group?.name || "Entrar em um grupo"}</h1>
    {group && <p className="text-gray-400 mb-6">Amigo secreto {group.year}</p>}
    {error && <p role="alert" className="text-santa-red mb-4">{error}</p>}
    {loading ? <p className="text-gray-300">Carregando convite...</p> : !group ? <form onSubmit={e => { e.preventDefault(); void load(code); }} className="space-y-4">
      <p className="text-gray-400">Abra o link do organizador ou informe o código do grupo.</p>
      <label htmlFor="inviteCode" className="block text-gray-300">Código do grupo</label>
      <input id="inviteCode" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} required className="w-full bg-santa-dark text-santa-snow border border-white/10 p-3 rounded-lg" />
      <button className="w-full bg-santa-green text-white p-3 rounded-xl">Abrir grupo</button>
    </form> : user ? <div className="space-y-5">
      <p className="text-gray-300">Olá, {user.name}. Solicite sua entrada e acompanhe a aprovação em Meus grupos.</p>
      <button onClick={request} disabled={busy} className="w-full bg-santa-green text-white py-3 rounded-xl font-semibold disabled:opacity-50">{busy ? "Solicitando..." : "Solicitar participação"}</button>
      <Link href="/groups" className="block text-center text-santa-gold">Meus grupos</Link>
    </div> : <><p className="text-gray-400 text-sm mb-6">Para participar deste amigo secreto, faça login ou crie sua conta. Depois da aprovação, clique em Entrar no grupo na tela Meus grupos.</p><AccountForm inviteCode={group.inviteCode} /></>}
    <Link href="/" className="block text-center text-gray-400 text-sm mt-6">← Voltar ao início</Link>
  </div></main>;
}
export default function JoinGroup() { return <Suspense fallback={<p>Carregando convite...</p>}><JoinContent /></Suspense>; }
