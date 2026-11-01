"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountForm({ initialMode = "register", inviteCode, next = "/groups", onSuccess }: { initialMode?: "register" | "login"; inviteCode?: string; next?: "/groups" | "/create"; onSuccess?: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, inviteCode }) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Não foi possível entrar"); return; }
      if (onSuccess) onSuccess(); else router.replace(next);
    } catch { setError("Não foi possível conectar. Tente novamente."); }
    finally { setLoading(false); }
  }
  const input = "w-full bg-santa-dark text-santa-snow border border-white/10 p-3 rounded-lg";
  return <div>
    {mode === "register" ? <div className="mb-6 rounded-xl border border-santa-gold/40 bg-santa-gold/10 p-4">
      <p className="text-sm font-semibold text-santa-snow mb-3">Já tenho conta</p>
      <button type="button" onClick={() => { setMode("login"); setError(""); }} className="w-full min-h-[52px] rounded-xl border-2 border-santa-gold px-4 py-3 font-bold text-santa-gold hover:bg-santa-gold hover:text-santa-dark transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-santa-gold/40">
        {next === "/create" ? "Fazer login para criar meu grupo" : "Fazer login para entrar no grupo"}
      </button>
    </div> : <p className="mb-5 text-sm leading-relaxed text-gray-300">
      {next === "/create" ? "Faça login com seu e-mail e senha para criar seu grupo." : inviteCode ? "Faça login com o e-mail e a senha do seu cadastro para solicitar entrada neste grupo." : "Faça login com o e-mail e a senha do seu cadastro. Depois, escolha seu amigo secreto em Meus grupos."}
    </p>}
    <form onSubmit={submit} className="space-y-4">
      {mode === "register" && <div><label htmlFor="fullName" className="block text-sm text-gray-300 mb-2">Nome completo</label><input id="fullName" autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={120} required className={input} /></div>}
      <div><label htmlFor="email" className="block text-sm text-gray-300 mb-2">E-mail</label><input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required className={input} /></div>
      <div><label htmlFor="password" className="block text-sm text-gray-300 mb-2">Senha</label><input id="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} minLength={mode === "register" ? 4 : undefined} required className={input} />{mode === "register" && <p className="text-xs text-gray-400 mt-2">Use qualquer combinação com pelo menos 4 caracteres.</p>}</div>
      {error && <p role="alert" className="text-santa-red">{error}</p>}
      <button disabled={loading} className="w-full min-h-[56px] bg-santa-green text-white px-4 py-4 rounded-xl font-bold hover:bg-santa-green-dark transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-santa-green/40 disabled:opacity-50">{loading ? "Aguarde..." : inviteCode ? (mode === "register" ? "Criar conta e solicitar entrada" : "Fazer login e solicitar entrada") : mode === "register" ? "Criar conta" : next === "/create" ? "Fazer login e criar meu grupo" : "Fazer login e acessar meus grupos"}</button>
    </form>
    {mode === "login" && <div className="mt-6 border-t border-white/10 pt-5 text-center">
      <p className="text-sm text-gray-400 mb-2">Ainda não tem cadastro?</p>
      <button type="button" onClick={() => { setMode("register"); setError(""); }} className="text-sm font-semibold text-santa-gold hover:underline">Criar uma conta</button>
    </div>}
  </div>;
}
