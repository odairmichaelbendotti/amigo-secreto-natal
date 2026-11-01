import Link from "next/link";
import AccountForm from "@/components/AccountForm";
export default function Register() {
  return <main className="min-h-screen flex items-center justify-center bg-santa-dark p-4"><div className="bg-[#151528] p-8 rounded-2xl border border-white/10 w-full max-w-md">
    <h1 className="text-3xl font-bold text-santa-gold mb-3">Crie sua conta</h1>
    <p className="text-gray-400 mb-6">Cadastre-se para participar do amigo secreto. Depois, seus grupos ficam disponíveis em Meus grupos.</p>
    <AccountForm /><Link href="/" className="block text-center text-gray-400 text-sm mt-6">← Voltar ao início</Link>
  </div></main>;
}
