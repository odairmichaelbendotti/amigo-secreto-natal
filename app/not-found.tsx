import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
export default function NotFound() {
  return <AuthLayout title="Página não encontrada" eyebrow="ESSA SURPRESA NÃO ESTÁ AQUI" description="A página que você procura não existe ou foi movida."><Link href="/" className="ui-btn ui-btn-primary ui-btn-wide">Voltar ao início</Link></AuthLayout>;
}
