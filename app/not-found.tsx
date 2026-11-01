import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-santa-dark p-4">
      <div className="bg-[#151528] p-8 rounded-2xl border border-white/10 text-center max-w-md">
        <p className="text-6xl mb-4" aria-hidden="true">🎁</p>
        <h1 className="text-2xl font-bold text-santa-gold mb-4">Página não encontrada</h1>
        <p className="text-gray-300 mb-6">A página que você procura não existe ou foi movida.</p>
        <Link href="/" className="inline-block bg-santa-green text-white py-3 px-6 rounded-xl font-semibold">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
