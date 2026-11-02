"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AccountForm from "@/components/AccountForm";
import AuthLayout from "@/components/AuthLayout";
function LoginContent() {
  const params = useSearchParams();
  const next = params.get("next") === "/create" ? "/create" : "/groups";
  return <AuthLayout title="Entre no seu amigo secreto" description="Faça login para acessar seus grupos e descobrir quem você vai surpreender."><AccountForm initialMode="login" next={next} /></AuthLayout>;
}
export default function Login() { return <Suspense fallback={<div className="ui-loading">Carregando...</div>}><LoginContent /></Suspense>; }
