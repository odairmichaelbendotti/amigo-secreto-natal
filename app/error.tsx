"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-santa-dark p-4">
      <div className="bg-[#151528] p-8 rounded-2xl border border-white/10 text-center max-w-md">
        <h1 className="text-2xl font-bold text-santa-red mb-4">Ocorreu um erro</h1>
        <p className="text-gray-300 mb-6">Não foi possível carregar esta página. Tente novamente.</p>
        <button onClick={reset} className="bg-santa-green text-white py-3 px-6 rounded-xl font-semibold">
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
