import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServiceWorkerScript } from "@/lib/service-worker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Gerador de Amigo Secreto - Organize sua troca de presentes grátis",
    template: "%s | Gerador de Amigo Secreto",
  },
  description: "Organize seu amigo secreto com a família, os amigos ou o trabalho. Crie grupos, monte listas de desejos e faça o sorteio automaticamente. Grátis e fácil de organizar!",
  keywords: "amigo secreto, sorteio de amigo secreto, amigo secreto grátis, amigo secreto online, troca de presentes, amigo secreto em família, amigo secreto no trabalho, lista de desejos",
  authors: [{ name: "Gerador de Amigo Secreto" }],
  creator: "Gerador de Amigo Secreto",
  metadataBase: new URL("https://santa.wagnerway.co.za"),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://santa.wagnerway.co.za",
    siteName: "Gerador de Amigo Secreto",
    title: "Gerador de Amigo Secreto - Sorteio online grátis",
    description: "Organize o amigo secreto da família, dos amigos ou do trabalho. Grátis, com convites por link e aprovação de participantes!",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "Gerador de Amigo Secreto - Sorteio online grátis",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gerador de Amigo Secreto - Sorteio online grátis",
    description: "Crie e organize seu amigo secreto de graça!",
    images: ["/og-image.png"],
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
    canonical: "https://santa.wagnerway.co.za",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#234f3e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Amigo Secreto" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: getServiceWorkerScript(process.env.NODE_ENV === "production"),
          }}
        />
      </body>
    </html>
  );
}
