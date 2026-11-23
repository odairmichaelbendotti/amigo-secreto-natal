"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AccountForm from "@/components/AccountForm";
import AuthLayout from "@/components/AuthLayout";
function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const next = params.get("next") === "/create" ? "/create" : "/groups";
  useEffect(() => {
    const controller = new AbortController();
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
        if (!response.ok) throw new Error("session");
        const session = await response.json();
        if (controller.signal.aborted) return;
        if (session.user) { router.replace(next); return; }
      } catch {
        if (controller.signal.aborted) return;
      }
      setChecking(false);
    }
    void checkSession();
    return () => controller.abort();
  }, [next, router]);
  if (checking) return <div role="status" className="ui-loading">Verificando acesso...</div>;
  return <AuthLayout title="Entre no seu amigo secreto" description="Faça login para acessar seus grupos e descobrir quem você vai surpreender."><AccountForm initialMode="login" next={next} /></AuthLayout>;
}
export default function Login() { return <Suspense fallback={<div className="ui-loading">Carregando...</div>}><LoginContent /></Suspense>; }
