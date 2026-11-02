import Link from "next/link";
import { Brand, GiftScene, Icon } from "@/components/Ui";
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

  return <div className="landing">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppStructuredData) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToStructuredData) }} />
    <header className="public-header"><Brand /><nav className="public-nav" aria-label="Navegação principal"><Link href="/groups" className="ui-link">Meus grupos</Link><Link href="/login" className="ui-btn ui-btn-primary">Fazer login <Icon name="arrow" /></Link></nav></header>
    <main>
      <section className="landing-hero">
        <div className="hero-copy"><span className="eyebrow">PARA QUEM GOSTA DE SURPREENDER</span><h1 aria-label="Gerador de Amigo Secreto">Gerador de<br /><span>Amigo Secreto.</span></h1><p>Menos organização, mais boas surpresas. Reúna seus amigos, faça o sorteio e deixe a troca de presentes por nossa conta.</p><div className="hero-buttons"><Link href="/login" className="ui-btn ui-btn-primary">Fazer login para entrar no grupo <Icon name="arrow" /></Link><Link href="/create" className="ui-btn ui-btn-secondary">Criar novo grupo <Icon name="plus" /></Link></div><span className="hero-footnote"><Icon name="check" />Grátis para grupos de até 10 pessoas. Feito para celebrar juntos.</span></div>
        <div className="hero-visual"><div className="hero-visual-label"><span>PEQUENOS GESTOS</span><span>GRANDES CONEXÕES</span></div><GiftScene /><div className="hero-ticket"><span className="stat-icon"><Icon name="heart" /></span><div><strong>O melhor presente é estar perto.</strong><p>A surpresa começa com um convite.</p></div><Icon name="sparkles" /></div></div>
      </section>
      <div className="landing-actions">
        <Link href="/join" className="landing-action"><span className="stat-icon"><Icon name="link" /></span><div><h2>Recebi um convite</h2><p>Abra o link do seu grupo e participe da celebração.</p></div><Icon name="arrow" /></Link>
        <Link href="/groups" className="landing-action"><span className="stat-icon"><Icon name="groups" /></span><div><h2>Meus grupos</h2><p>Seus encontros, listas e sorteios em um só lugar.</p></div><Icon name="arrow" /></Link>
        <a href="#como-funciona" className="landing-action"><span className="stat-icon"><Icon name="sparkles" /></span><div><h2>Simples de organizar</h2><p>Convide, aprove os participantes e faça o sorteio.</p></div><Icon name="arrow" /></a>
      </div>
      <section id="como-funciona" className="landing-section"><div className="landing-section-header"><div><span className="eyebrow">DO CONVITE À SURPRESA</span><h2>Três passos. Um encontro especial.</h2></div><p>Para reunir a família, os amigos ou aquela turma do trabalho, de perto ou de longe.</p></div><div className="steps-grid">
        <div><span className="step-number">01 /</span><h3>Reúna sua turma</h3><p>Crie um grupo, escolha se também quer participar e compartilhe o link de convite.</p></div>
        <div><span className="step-number">02 /</span><h3>Deixe tudo do seu jeito</h3><p>Aprove as participações, combine o valor dos presentes e escolha se o grupo usa listas de desejos.</p></div>
        <div><span className="step-number">03 /</span><h3>Deixe a surpresa acontecer</h3><p>Faça o sorteio. Cada pessoa entra na própria conta para descobrir quem vai presentear.</p></div>
      </div></section>
      <section className="landing-section"><div className="landing-plan"><div><h2>Uma celebração que cabe no seu grupo.</h2><p>Até 10 participantes, grátis. Para grupos maiores, participantes ilimitados por US$ 10, em pagamento único.</p></div><Link href="/create" className="ui-btn ui-btn-primary">Começar meu grupo <Icon name="arrow" /></Link></div></section>
      <section className="landing-section"><div className="landing-section-header"><div><span className="eyebrow">PODE PERGUNTAR</span><h2>Antes de começar</h2></div></div><div className="faq-grid">{faqs.map((faq, index) => <details key={index}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}</div></section>
    </main>
    <footer className="public-footer"><Brand /><p>Boas surpresas aproximam pessoas.</p><nav aria-label="Links do rodapé"><Link href="/login">Entrar na conta</Link><Link href="/join">Abrir convite</Link></nav></footer>
  </div>;
}
