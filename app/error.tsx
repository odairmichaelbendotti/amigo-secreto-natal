"use client";
import AuthLayout from "@/components/AuthLayout";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AuthLayout title="Ocorreu um erro" eyebrow="VAMOS TENTAR NOVAMENTE" description="Não foi possível carregar esta página. Tente novamente."><button onClick={reset} className="ui-btn ui-btn-primary ui-btn-wide">Tentar novamente</button></AuthLayout>;
}
