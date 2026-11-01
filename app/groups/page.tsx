"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  return <main className="min-h-screen bg-santa-dark px-4 py-10"><div className="max-w-3xl mx-auto">
    <header className="flex flex-wrap items-center justify-between gap-4 mb-8"><div className="min-w-0"><h1 className="text-3xl text-santa-gold font-bold">Meus grupos</h1>{user && <p className="text-gray-400 mt-2 break-words">{user.name} · {user.email}</p>}</div><button onClick={logout} className="text-gray-300">Sair</button></header>
    {user && <p className="text-gray-300 leading-relaxed mb-6">Você está conectado. Escolha seu amigo secreto abaixo e clique em <strong className="text-santa-snow">Entrar no grupo</strong> para acessar sua participação.</p>}
    {error && <p role="alert" className="text-santa-red mb-4">{error}</p>}
    {loading ? <p className="text-gray-300">Carregando seus grupos...</p> : <div className="space-y-4" aria-live="polite">
      {groups.length === 0 && <p className="text-gray-300 bg-[#151528] border border-white/10 p-6 rounded-xl">Você ainda não tem grupos. Abra o convite de um organizador ou crie seu grupo.</p>}
      {groups.map(group => <article key={group.id} className={`bg-[#151528] border p-6 sm:p-8 rounded-2xl ${group.status === "APPROVED" ? "border-santa-gold/50 shadow-lg shadow-santa-gold/10" : "border-white/10"}`}>
        {group.status === "APPROVED" && <p className="inline-flex items-center gap-2 rounded-full bg-santa-green/15 px-3 py-1 text-sm text-emerald-300 font-semibold mb-4"><span aria-hidden="true">✓</span> Sua participação está aprovada</p>}
        <h2 className="text-2xl font-bold text-santa-snow break-words">{group.name}</h2><p className="text-gray-400 text-sm mt-2">Amigo secreto {group.year}{group.isAdmin ? " · Administrador" : ""}</p>
        {group.status === "PENDING" && <div className="mt-4"><p className="text-santa-gold">Aguardando aprovação do administrador</p><p className="text-sm text-gray-400 mt-2">Assim que sua participação for aprovada, o botão Entrar no grupo será liberado aqui. Nas próximas visitas, faça login com seu e-mail e senha.</p></div>}
        {group.status === "REJECTED" && <p className="text-gray-400 mt-4">Solicitação não aprovada. Fale com o organizador.</p>}
        <div className="flex flex-col gap-3 mt-6">
          {group.status === "APPROVED" && <>
            <button onClick={() => enter(group, false)} disabled={Boolean(busy)} className="w-full min-h-[64px] inline-flex items-center justify-center gap-3 bg-santa-gold text-santa-dark px-6 py-4 text-lg sm:text-xl font-bold rounded-xl shadow-lg shadow-santa-gold/20 hover:bg-santa-gold-dark transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-santa-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-santa-dark disabled:opacity-50 disabled:cursor-not-allowed">{busy === group.id ? "Abrindo..." : "Entrar no grupo"}<span aria-hidden="true">→</span></button>
            <p className="text-sm text-gray-400 text-center">{group.wishlistsEnabled === false ? "Veja quem você tirou após o sorteio e escolha o presente livremente." : "Monte sua lista de desejos e veja quem você tirou após o sorteio."}</p>
          </>}
          {group.isAdmin && <button onClick={() => enter(group, true)} disabled={Boolean(busy)} className="self-start text-sm text-santa-gold px-1 py-2 font-semibold hover:underline disabled:opacity-50">Administrar</button>}
        </div>
      </article>)}
    </div>}
    <nav className="flex flex-wrap gap-6 mt-8 text-sm"><Link href="/create" className="text-santa-gold">Criar grupo</Link><Link href="/join" className="text-gray-300">Abrir convite</Link><Link href="/" className="text-gray-400">Início</Link></nav>
  </div></main>;
}
