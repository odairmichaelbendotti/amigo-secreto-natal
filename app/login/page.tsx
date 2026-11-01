"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AccountForm from "@/components/AccountForm";
function LoginContent() {
  const params = useSearchParams();
  const next = params.get("next") === "/create" ? "/create" : "/groups";
  return <main className="min-h-screen flex items-center justify-center bg-santa-dark p-4"><div className="bg-[#151528] p-8 rounded-2xl border border-white/10 w-full max-w-md">
    <h1 className="text-3xl font-bold text-santa-gold mb-3">Entre no seu amigo secreto</h1>
    <p className="text-gray-400 mb-6">Acesse sua conta para abrir seu grupo, montar sua lista de desejos e descobrir quem você tirou após o sorteio.</p>
    <AccountForm initialMode="login" next={next} />
    <Link href="/" className="block text-center text-gray-400 text-sm mt-6">← Voltar ao início</Link>
  </div></main>;
}
export default function Login() { return <Suspense fallback={<p>Carregando...</p>}><LoginContent /></Suspense>; }
