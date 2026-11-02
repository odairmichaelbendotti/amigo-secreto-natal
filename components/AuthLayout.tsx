import Link from "next/link";
import type { ReactNode } from "react";
import { Brand, GiftScene, Icon } from "@/components/Ui";

export default function AuthLayout({ children, title, description, eyebrow = "BEM-VINDO À CELEBRAÇÃO" }: { children: ReactNode; title: string; description: string; eyebrow?: string }) {
  return <div className="auth-page">
    <header className="public-header"><Brand /><Link href="/" className="ui-link">Voltar ao início <Icon name="arrow" /></Link></header>
    <main className="auth-layout">
      <aside className="auth-aside">
        <span className="eyebrow">UM PRESENTE. MUITAS CONEXÕES.</span>
        <h2>Uma boa surpresa<br />começa com você.</h2>
        <p>Reúna quem faz parte da sua vida.<br />A gente cuida do sorteio.</p>
        <GiftScene />
        <div className="auth-assurance"><Icon name="heart" /><span>Feito para celebrar com quem importa.</span></div>
      </aside>
      <section className="auth-content">
        <div className="auth-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
        {children}
      </section>
    </main>
    <footer className="auth-footer">Menos organização. Mais tempo para celebrar.</footer>
  </div>;
}
