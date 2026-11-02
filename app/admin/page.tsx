"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import { Icon } from "@/components/Ui";
import PasswordInput from "@/components/PasswordInput";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const router = useRouter();

  useEffect(() => {
    void fetch("/api/auth/session", { cache: "no-store" }).then(r => r.json()).then(session => {
      if (session.isAdmin) { router.replace("/admin/dashboard"); return; }
      if (session.user) { router.replace("/groups"); return; }
      const id = sessionStorage.getItem("groupId");
      if (id) { setGroupId(id); setGroupName(sessionStorage.getItem("groupName") || "Seu grupo"); }
      else router.replace("/login");
    }).catch(() => setError("Não foi possível verificar sua conta"));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!groupId) {
      setError("Nenhum grupo selecionado. Volte ao início e selecione um grupo.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, groupId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Não foi possível autenticar seu acesso");
        setLoading(false);
        return;
      }

      // Session cookie set by server. Clear sessionStorage group info.
      sessionStorage.removeItem("groupId");
      sessionStorage.removeItem("groupName");
      sessionStorage.removeItem("inviteCode");
      sessionStorage.removeItem("adminAuth");
      router.push("/admin/dashboard");
    } catch (err) {
      setError("Ocorreu um erro. Tente novamente.");
      setLoading(false);
    }
  };

  return <AuthLayout title="Área do administrador" eyebrow="ACESSO DO ORGANIZADOR" description={groupName || "Entre para cuidar dos detalhes do seu amigo secreto."}>
    <form onSubmit={handleSubmit} className="ui-form">
      <div className="ui-field"><label htmlFor="password">Senha do administrador</label><PasswordInput id="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha de acesso" required className="ui-input" /></div>
      {error && <p role="alert" className="ui-alert">{error}</p>}
      <button type="submit" disabled={loading} aria-busy={loading} className="ui-btn ui-btn-primary ui-btn-wide">{loading ? "Autenticando..." : "Entrar"}<Icon name="arrow" /></button>
    </form>
  </AuthLayout>;
}
