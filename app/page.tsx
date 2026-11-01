import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gerador de Amigo Secreto grátis - Organize sua troca de presentes online",
  description: "Sorteio de amigo secreto online e grátis para famílias, amigos e colegas de trabalho. Crie grupos, monte listas de desejos e faça o sorteio automaticamente. Entrada por convite!",
  keywords: "amigo secreto, sorteio de amigo secreto, amigo secreto grátis, amigo secreto online, troca de presentes, amigo secreto em família, amigo secreto no trabalho, lista de desejos, presentes de Natal",
  openGraph: {
    locale: "pt_BR",
    title: "Gerador de Amigo Secreto grátis - Sorteio online",
    description: "Organize o amigo secreto da família, dos amigos ou do trabalho. Grátis, com convites por link e aprovação de participantes!",
    url: "https://santa.wagnerway.co.za",
    siteName: "Gerador de Amigo Secreto",
    type: "website",
    images: [
      {
        url: "https://santa.wagnerway.co.za/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gerador de Amigo Secreto - Sorteio online grátis"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Gerador de Amigo Secreto grátis - Sorteio online",
    description: "Organize o amigo secreto da família, dos amigos ou do trabalho. Grátis, com convites por link e aprovação de participantes!",
    images: ["https://santa.wagnerway.co.za/og-image.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://santa.wagnerway.co.za"
  }
};

export default function Home() {
  const faqs = [
    {
      q: "O que é um gerador de amigo secreto?",
      a: "É uma ferramenta online grátis que sorteia quem cada participante vai presentear. Cada pessoa tira alguém em segredo, deixando a troca de presentes divertida e cheia de surpresas. O aplicativo cuida de tudo: da criação do grupo às listas de desejos e ao sorteio."
    },
    {
      q: "Como funciona o sorteio de amigo secreto?",
      a: "Crie sua conta com e-mail e senha e organize um grupo. Compartilhe o link do grupo. Cada convidado cria uma conta ou entra com e-mail e senha e solicita participação. O administrador aprova ou não cada solicitação. As pessoas aprovadas podem montar suas listas de desejos. Quando todos estiverem prontos, o administrador realiza o sorteio com um clique. Cada participante vê quem tirou e a lista de desejos dessa pessoa."
    },
    {
      q: "O aplicativo de amigo secreto é grátis?",
      a: "Sim! Grupos de até 10 participantes podem usar o aplicativo de graça, com grupos ilimitados, listas de desejos e sorteio automático. Para grupos maiores, você pode liberar participantes ilimitados com um pagamento único de US$ 10."
    },
    {
      q: "Preciso criar uma conta ou fazer cadastro?",
      a: "Sim. Use seu nome completo, e-mail e uma senha com pelo menos 4 caracteres. Após a aprovação, o grupo fica vinculado à sua conta e aparece em Meus grupos em qualquer dispositivo."
    },
    {
      q: "Quantas pessoas podem participar do amigo secreto?",
      a: "São necessárias pelo menos 2 pessoas aprovadas. Com apenas 2, um necessariamente tira o outro; com 3 ou mais, há surpresa sobre quem cada pessoa vai tirar. O plano grátis permite até 10 participantes por grupo. Para grupos maiores, como os do trabalho, você pode liberar participantes ilimitados com um pagamento único de US$ 10."
    },
    {
      q: "Posso definir o valor do presente para o grupo?",
      a: "Sim! O administrador pode definir o valor do presente em reais, dólares, euros e várias outras moedas. O valor fica visível para todos os participantes, para que o grupo saiba quanto gastar."
    },
    {
      q: "Como funcionam as listas de desejos?",
      a: "Cada participante pode adicionar até 5 itens à sua lista de desejos, com nomes e links dos produtos. Depois do sorteio, quem tirou você pode ver sua lista e escolher um presente com mais facilidade."
    },
    {
      q: "Posso usar o aplicativo para o amigo secreto do trabalho?",
      a: "Sim! O organizador cria um grupo e compartilha o link de convite com os colegas. Cada pessoa cria sua conta com nome completo, e-mail e senha e solicita aprovação. Depois de aprovada, monta sua lista de desejos e descobre quem tirou. Como tudo acontece online, quem trabalha a distância também pode participar."
    },
    {
      q: "O sorteio é aleatório e justo?",
      a: "Sim. O sorteio distribui os participantes aleatoriamente, garantindo que ninguém tire a si mesmo. Cada pessoa presenteia exatamente uma pessoa e também recebe exatamente um presente."
    },
    {
      q: "É possível refazer o sorteio?",
      a: "Sim! O administrador pode excluir os resultados pelo painel e realizar um novo sorteio. Isso é útil quando os participantes mudam ou quando alguém descobre por engano o resultado de outra pessoa."
    },
    {
      q: "O resultado do meu sorteio fica em segredo?",
      a: "Sim. Cada participante só vê quem tirou ao entrar na sua conta. Os demais participantes não conseguem ver quem presenteia quem. O administrador pode consultar todos os resultados para organizar o grupo."
    },
    {
      q: "O aplicativo funciona em celulares e tablets?",
      a: "Sim! O aplicativo se adapta a celulares, tablets e computadores. Você pode montar sua lista de desejos e consultar quem tirou de qualquer dispositivo com navegador."
    }
  ];

  const webAppStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Gerador de Amigo Secreto",
    description: "Organize seu amigo secreto online e de graça. Crie grupos, monte listas de desejos e faça o sorteio com sua família, seus amigos ou colegas de trabalho.",
    inLanguage: "pt-BR",
    url: "https://santa.wagnerway.co.za",
    applicationCategory: "Lifestyle",
    operatingSystem: "All",
    offers: [
      { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Plano grátis: até 10 participantes por grupo" },
      { "@type": "Offer", price: "10", priceCurrency: "USD", description: "Plano ilimitado: participantes ilimitados, com pagamento único" }
    ],
    featureList: [
      "Crie grupos ilimitados de amigo secreto",
      "Sorteio automático e aleatório",
      "Listas de desejos com links dos produtos",
      "Convites por link com aprovação",
      "Acesso com e-mail e senha",
      "Interface adaptada para celular",
      "Valor do presente em várias moedas",
      "Entrada por convite"
    ],
    provider: { "@type": "Organization", name: "Gerador de Amigo Secreto", url: "https://santa.wagnerway.co.za" },
    screenshot: "https://santa.wagnerway.co.za/og-image.png",
    softwareVersion: "2.0",
    aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "1250", bestRating: "5", worstRating: "1" }
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: "pt-BR",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a }
    }))
  };

  const howToStructuredData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Como organizar um amigo secreto online",
    description: "Passo a passo para criar e organizar um amigo secreto com nosso sorteador online grátis.",
    inLanguage: "pt-BR",
    totalTime: "PT5M",
    estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "0" },
    step: [
      {
        "@type": "HowToStep",
        name: "Crie seu grupo de amigo secreto",
        text: "Clique em Criar novo grupo. Entre ou crie sua conta com nome completo, e-mail e senha. Informe o nome do grupo e o ano. Você receberá um link de convite para compartilhar com os participantes.",
        url: "https://santa.wagnerway.co.za/create",
        position: 1
      },
      {
        "@type": "HowToStep",
        name: "Compartilhe o link e aprove as solicitações",
        text: "Copie o link do grupo no painel e compartilhe com os convidados. Cada pessoa informa seu nome completo. Aprove ou não as solicitações recebidas.",
        url: "https://santa.wagnerway.co.za/admin/dashboard",
        position: 2
      },
      {
        "@type": "HowToStep",
        name: "Realize o sorteio do amigo secreto",
        text: "Quando todos estiverem no grupo e tiverem montado suas listas de desejos, clique em Realizar sorteio no painel do administrador. Depois, cada participante pode entrar para descobrir quem tirou e conferir a lista de desejos dessa pessoa.",
        url: "https://santa.wagnerway.co.za/admin/dashboard",
        position: 3
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToStructuredData) }}
      />

      <div className="min-h-screen bg-santa-dark text-santa-snow overflow-x-hidden">
        {/* Hero Section */}
        <header className="relative overflow-hidden">
          <nav className="relative z-10 max-w-6xl mx-auto px-6 pt-5 flex items-center justify-end gap-5">
            <Link href="/groups" className="text-sm text-gray-300 hover:text-santa-gold">Meus grupos</Link>
            <Link href="/login" className="rounded-xl bg-santa-gold px-5 py-3 font-bold text-santa-dark hover:bg-santa-gold-dark transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-santa-gold/40">Fazer login</Link>
          </nav>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-[10%] text-4xl animate-twinkle">*</div>
            <div className="absolute top-20 left-[30%] text-2xl animate-twinkle" style={{ animationDelay: '0.5s' }}>*</div>
            <div className="absolute top-8 left-[50%] text-3xl animate-twinkle" style={{ animationDelay: '1s' }}>*</div>
            <div className="absolute top-16 left-[70%] text-2xl animate-twinkle" style={{ animationDelay: '1.5s' }}>*</div>
            <div className="absolute top-12 left-[90%] text-4xl animate-twinkle" style={{ animationDelay: '0.3s' }}>*</div>
          </div>

          <div className="container mx-auto px-4 py-10 md:py-20 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <div className="text-7xl mb-6">🎅</div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6 font-display">
                <span className="text-santa-gold">Gerador</span> de{" "}
                <span className="text-santa-red">Amigo</span>{" "}
                <span className="text-santa-green">Secreto</span>
              </h1>
              <p className="text-lg sm:text-2xl md:text-3xl text-santa-gold mb-4 font-semibold">
                Organize sua troca de presentes online e de graça
              </p>
              <div className="max-w-2xl mx-auto mt-8 mb-8 rounded-2xl border border-santa-gold/50 bg-santa-gold/10 p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-santa-snow mb-2">Quer acessar seu amigo secreto?</h2>
                <p className="text-gray-300 mb-5">Faça login com o e-mail e a senha do seu cadastro. Depois, escolha seu grupo em Meus grupos.</p>
                <Link href="/login" className="inline-flex w-full min-h-[60px] items-center justify-center gap-3 rounded-xl bg-santa-gold px-5 py-4 text-lg font-bold text-santa-dark shadow-lg shadow-santa-gold/20 hover:bg-santa-gold-dark transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-santa-gold/40">
                  Fazer login para entrar no grupo <span aria-hidden="true">→</span>
                </Link>
              </div>

              <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                Organize um amigo secreto especial com sua família, seus amigos ou colegas de trabalho. Compartilhe o convite, aprove os participantes e prepare os presentes!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
                <Link
                  href="/create"
                  className="group bg-gradient-to-br from-santa-green to-santa-green-dark p-8 rounded-2xl card-glow transition-all duration-300 hover:scale-105"
                >
                  <div className="text-5xl mb-4">🎄</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Criar novo grupo</h2>
                  <p className="text-green-100 mb-3 text-sm">
                    Crie um amigo secreto com sua família, seus amigos ou colegas de trabalho
                  </p>
                  <span className="text-santa-gold font-semibold group-hover:underline">
                    Começar &rarr;
                  </span>
                </Link>

                <Link
                  href="/join"
                  className="group bg-gradient-to-br from-santa-red to-santa-red-dark p-8 rounded-2xl card-glow transition-all duration-300 hover:scale-105"
                >
                  <div className="text-5xl mb-4">🎁</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Recebi um convite</h2>
                  <p className="text-red-100 mb-3 text-sm">
                    Use o convite do organizador para solicitar entrada em um novo grupo
                  </p>
                  <span className="text-santa-gold font-semibold group-hover:underline">
                    Abrir convite &rarr;
                  </span>
                </Link>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-santa-gold/30 to-transparent"></div>
        </header>

        {/* How It Works Section */}
        <section className="py-20 bg-[#151528]" aria-labelledby="how-it-works-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 id="how-it-works-heading" className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 font-display">
                Como funciona &mdash; <span className="text-santa-gold">Em 3 passos simples!</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Organize seu amigo secreto online em poucos minutos, de graça
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-center p-8 bg-santa-dark rounded-2xl border border-santa-green/20 card-glow">
                <div className="w-16 h-16 bg-santa-green/20 rounded-full flex items-center justify-center text-2xl font-bold text-santa-green mx-auto mb-5 border-2 border-santa-green/40">1</div>
                <h3 className="text-xl font-bold text-santa-green mb-3">Crie seu grupo</h3>
                <p className="text-gray-400">
                  Entre na sua conta e crie um grupo com nome e ano. Escolha se também quer participar e copie o link de convite.
                </p>
              </div>

              <div className="text-center p-8 bg-santa-dark rounded-2xl border border-santa-red/20 card-glow">
                <div className="w-16 h-16 bg-santa-red/20 rounded-full flex items-center justify-center text-2xl font-bold text-santa-red mx-auto mb-5 border-2 border-santa-red/40">2</div>
                <h3 className="text-xl font-bold text-santa-red mb-3">Convide e aprove os participantes</h3>
                <p className="text-gray-400">
                  Compartilhe o link do grupo. Os convidados criam sua conta com nome completo, e-mail e senha e solicitam aprovação. Depois de aprovados, podem montar suas listas de desejos.
                </p>
              </div>

              <div className="text-center p-8 bg-santa-dark rounded-2xl border border-santa-gold/20 card-glow">
                <div className="w-16 h-16 bg-santa-gold/20 rounded-full flex items-center justify-center text-2xl font-bold text-santa-gold mx-auto mb-5 border-2 border-santa-gold/40">3</div>
                <h3 className="text-xl font-bold text-santa-gold mb-3">Realizar sorteio</h3>
                <p className="text-gray-400">
                  Faça o sorteio com um clique. Cada participante entra para descobrir quem tirou e conferir a lista de desejos dessa pessoa. Simples assim!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-santa-dark" aria-labelledby="features-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 id="features-heading" className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 font-display">
                Por que escolher nosso <span className="text-santa-red">Amigo Secreto</span> online?
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Um jeito fácil de organizar o amigo secreto da família ou do trabalho
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="p-6 bg-[#151528] rounded-2xl border border-white/5 card-glow">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-bold text-santa-gold mb-2">Sorteio automático</h3>
                <p className="text-gray-400 text-sm">
                  O sorteio garante que cada participante tire uma única pessoa, sem repetições e sem tirar a si mesmo. Aleatório e justo para todo o grupo.
                </p>
              </div>

              <div className="p-6 bg-[#151528] rounded-2xl border border-white/5 card-glow">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="text-lg font-bold text-santa-gold mb-2">Listas de desejos</h3>
                <p className="text-gray-400 text-sm">
                  Cada participante monta uma lista com até 5 itens e links dos produtos. Quem tirou você vê exatamente o que você gostaria de ganhar!
                </p>
              </div>

              <div className="p-6 bg-[#151528] rounded-2xl border border-white/5 card-glow">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="text-lg font-bold text-santa-gold mb-2">Privacidade e segurança</h3>
                <p className="text-gray-400 text-sm">
                  Cada grupo tem seu próprio link de convite. O administrador avalia as solicitações e apenas participantes aprovados acessam o sorteio e suas listas de desejos.
                </p>
              </div>

              <div className="p-6 bg-[#151528] rounded-2xl border border-white/5 card-glow">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-lg font-bold text-santa-gold mb-2">Presentes em várias moedas</h3>
                <p className="text-gray-400 text-sm">
                  Defina o valor do presente em reais, dólares, euros e outras moedas. Assim, todo o grupo conhece o limite e pode participar com tranquilidade.
                </p>
              </div>

              <div className="p-6 bg-[#151528] rounded-2xl border border-white/5 card-glow">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-lg font-bold text-santa-gold mb-2">Acesse de qualquer lugar</h3>
                <p className="text-gray-400 text-sm">
                  Use no celular, tablet ou computador. Organize seu amigo secreto onde e quando quiser, inclusive com equipes que trabalham a distância.
                </p>
              </div>

              <div className="p-6 bg-[#151528] rounded-2xl border border-white/5 card-glow">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-lg font-bold text-santa-gold mb-2">Entrada por convite</h3>
                <p className="text-gray-400 text-sm">
                  Entrada simples pelo link do grupo, com nome completo e aprovação. Grátis para grupos de até 10 pessoas. Para grupos maiores, libere participantes ilimitados com um pagamento único de US$ 10.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 bg-[#151528]" aria-labelledby="pricing-heading">
          <div className="container mx-auto px-4 text-center">
            <h2 id="pricing-heading" className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 font-display">
              <span className="text-santa-gold">Planos</span> e preços
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Grátis para grupos de até 10 pessoas. Um pagamento único para grupos maiores.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Free Tier */}
              <div className="bg-santa-dark rounded-2xl border-2 border-white/10 p-8 card-glow">
                <div className="text-4xl mb-3">🎁</div>
                <div className="text-santa-green text-sm font-semibold uppercase tracking-wider mb-2">Grátis</div>
                <div className="text-5xl font-bold text-white mb-2">US$ 0</div>
                <p className="text-gray-400 mb-6">Não precisa de cartão de crédito</p>

                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-start text-gray-300">
                    <span className="text-santa-green mr-3 mt-0.5 flex-shrink-0">&#10003;</span> <span>Até 10 participantes por grupo</span>
                  </li>
                  <li className="flex items-start text-gray-300">
                    <span className="text-santa-green mr-3 mt-0.5 flex-shrink-0">&#10003;</span> <span>Grupos ilimitados</span>
                  </li>
                  <li className="flex items-start text-gray-300">
                    <span className="text-santa-green mr-3 mt-0.5 flex-shrink-0">&#10003;</span> <span>Lista de desejos com até 5 itens</span>
                  </li>
                  <li className="flex items-start text-gray-300">
                    <span className="text-santa-green mr-3 mt-0.5 flex-shrink-0">&#10003;</span> <span>Sorteio automático</span>
                  </li>
                  <li className="flex items-start text-gray-300">
                    <span className="text-santa-green mr-3 mt-0.5 flex-shrink-0">&#10003;</span> <span>Convites por link com aprovação</span>
                  </li>
                  <li className="flex items-start text-gray-300">
                    <span className="text-santa-green mr-3 mt-0.5 flex-shrink-0">&#10003;</span> <span>Valor do presente em várias moedas</span>
                  </li>
                </ul>

                <Link
                  href="/create"
                  className="block w-full bg-santa-green text-white py-3 rounded-xl font-bold text-lg hover:bg-santa-green-dark transition-colors"
                >
                  Começar &rarr;
                </Link>
              </div>

              {/* Unlimited Tier */}
              <div className="bg-santa-dark rounded-2xl border-2 border-santa-gold/30 p-8 card-glow relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-santa-gold text-santa-dark text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Melhor opção</div>
                <div className="text-4xl mb-3">🏆</div>
                <div className="text-santa-gold text-sm font-semibold uppercase tracking-wider mb-2">Ilimitado</div>
                <div className="text-5xl font-bold text-white mb-2">US$ 10</div>
                <p className="text-gray-400 mb-6">Pagamento único</p>

                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-start text-gray-300">
                    <span className="text-santa-gold mr-3 mt-0.5 flex-shrink-0">&#10003;</span> <span>Tudo do plano grátis</span>
                  </li>
                  <li className="flex items-start text-gray-300">
                    <span className="text-santa-gold mr-3 mt-0.5 flex-shrink-0">&#10003;</span> <span>Participantes ilimitados por grupo</span>
                  </li>
                  <li className="flex items-start text-gray-300">
                    <span className="text-santa-gold mr-3 mt-0.5 flex-shrink-0">&#10003;</span> <span>Pague uma vez e use para sempre</span>
                  </li>
                </ul>

                <a
                  href="https://buy.stripe.com/7sY00i9dP2otgDv0RbeAg03"
                  className="block w-full bg-santa-gold text-santa-dark py-3 rounded-xl font-bold text-lg hover:bg-santa-gold-dark transition-colors text-center"
                >
                  Comprar agora &rarr;
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-santa-dark" aria-labelledby="faq-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-14">
              <h2 id="faq-heading" className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 font-display">
                Perguntas <span className="text-santa-red">frequentes</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Tudo o que você precisa saber sobre nosso amigo secreto online grátis
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="group bg-[#151528] rounded-xl border border-white/5 overflow-hidden"
                >
                  <summary className="cursor-pointer p-6 flex items-center justify-between font-semibold text-santa-snow hover:text-santa-gold transition-colors">
                    <span className="pr-4">{faq.q}</span>
                    <span className="text-santa-gold flex-shrink-0 text-xl group-open:rotate-45 transition-transform duration-200">+</span>
                  </summary>
                  <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-santa-red-dark via-santa-red to-santa-green" aria-labelledby="cta-heading">
          <div className="container mx-auto px-4 text-center">
            <h2 id="cta-heading" className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 text-white font-display">
              Vamos organizar seu amigo secreto?
            </h2>
            <p className="text-xl mb-10 text-white/80 max-w-2xl mx-auto">
              Reúna sua família, seus amigos ou colegas de trabalho e organize uma troca de presentes especial
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/create"
                className="bg-white text-santa-red px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-santa-snow transition-colors hover:scale-105 transform duration-300 min-h-[48px]"
              >
                🎄 Criar novo grupo
              </Link>
              <Link
                href="/join"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white hover:text-santa-green transition-all hover:scale-105 transform duration-300 min-h-[48px]"
              >
                🎁 Entrar em um grupo
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#0F0F1E] py-12 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-2xl font-bold mb-3">
                  <span className="text-santa-red">Amigo</span>{" "}
                  <span className="text-santa-green">Secreto</span>{" "}
                  <span className="text-santa-gold">🎅</span>
                </div>
                <p className="text-gray-500 text-sm">
                  O organizador de amigo secreto online e grátis para trocar presentes com quem você gosta.
                </p>
              </div>

              <div>
                <h3 className="text-santa-gold font-semibold mb-3">Links rápidos</h3>
                <nav aria-label="Navegação do rodapé">
                  <ul className="space-y-2">
                    <li><Link href="/create" className="text-gray-400 hover:text-santa-gold transition-colors text-sm">Criar grupo</Link></li>
                    <li><Link href="/groups" className="text-santa-gold hover:underline">Meus grupos</Link></li><li><Link href="/join" className="text-gray-400 hover:text-santa-gold transition-colors text-sm">Entrar em um grupo</Link></li>
                    <li><Link href="/join" className="text-gray-400 hover:text-santa-gold transition-colors text-sm">Acesso do participante</Link></li>
                    <li><a href="#pricing-heading" className="text-gray-400 hover:text-santa-gold transition-colors text-sm">Planos e preços</a></li>
                  </ul>
                </nav>
              </div>

              <div>
                <h3 className="text-santa-gold font-semibold mb-3">Sobre</h3>
                <p className="text-gray-500 text-sm">
                  Feito com carinho para celebrar bons momentos. Nosso aplicativo torna a organização do amigo secreto simples e divertida para famílias, amigos e equipes de trabalho.
                </p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 text-center">
              <p className="text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} Gerador de Amigo Secreto &bull; Sorteio online grátis &bull;{" "}
                <a href="https://santa.wagnerway.co.za" className="text-santa-gold hover:text-santa-gold-dark transition-colors">
                  santa.wagnerway.co.za
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
