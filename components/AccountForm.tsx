"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";

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
  return <div>
    <div className="auth-tabs" aria-label="Escolha como acessar">
      <button type="button" aria-pressed={mode === "login"} onClick={() => { setMode("login"); setError(""); }} aria-label={next === "/create" ? "Fazer login para criar meu grupo" : "Fazer login para entrar no grupo"}>Já tenho conta</button>
      <button type="button" aria-pressed={mode === "register"} onClick={() => { setMode("register"); setError(""); }} aria-label="Criar uma conta">Criar minha conta</button>
    </div>
    <p className="auth-context">{mode === "register" ? "Seu primeiro amigo secreto por aqui? Crie seu cadastro." : "Faça login com o e-mail e a senha do seu cadastro."}</p>
    <form key={mode} onSubmit={submit} className="ui-form motion-content">
      {mode === "register" && <div className="ui-field"><label htmlFor="fullName">Nome completo</label><input id="fullName" autoComplete="name" placeholder="Como você se chama?" value={name} onChange={e => setName(e.target.value)} maxLength={120} required className="ui-input" /></div>}
      <div className="ui-field"><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required className="ui-input" /></div>
      <div className="ui-field"><label htmlFor="password">Senha</label><PasswordInput key={mode} id="password" autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "Crie sua senha" : "Sua senha de acesso"} value={password} onChange={e => setPassword(e.target.value)} minLength={mode === "register" ? 4 : undefined} required className="ui-input" />{mode === "register" && <p className="ui-hint">Use qualquer combinação com pelo menos 4 caracteres.</p>}</div>
      {error && <p role="alert" className="ui-alert">{error}</p>}
      <button disabled={loading} aria-busy={loading} className="ui-btn ui-btn-primary ui-btn-wide">{loading ? "Aguarde..." : inviteCode ? (mode === "register" ? "Criar conta e solicitar entrada" : "Fazer login e solicitar entrada") : mode === "register" ? "Criar conta" : next === "/create" ? "Fazer login e criar meu grupo" : "Fazer login e acessar meus grupos"}<span aria-hidden="true">→</span></button>
    </form>
  </div>;
}
