import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/legal/CookieBanner";
import ConsentManager from "@/components/legal/ConsentManager";
import ConditionalCustomerAuth from "@/components/auth/ConditionalCustomerAuth";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HP Marcas Perfumes - Perfumes e Cosméticos Importados",
  description:
    "Sua loja online de perfumes e cosméticos importados originais. Entrega rápida e segura para todo o Brasil.",
  keywords: ["perfumes", "cosméticos", "importados", "originais", "brasil"],
  authors: [{ name: "HP Marcas Perfumes" }],
  creator: "HP Marcas Perfumes",
  publisher: "HP Marcas Perfumes",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://hpmarcas.com.br"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "HP Marcas Perfumes - Perfumes e Cosméticos Importados",
    description:
      "Sua loja online de perfumes e cosméticos importados originais.",
    url: "https://hpmarcas.com.br",
    siteName: "HP Marcas Perfumes",
    locale: "pt_BR",
    type: "website",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* LGPD and Privacy Meta Tags */}
        <meta name="privacy-policy" content="/politica-privacidade" />
        <meta name="terms-of-service" content="/termos-de-uso" />
        <meta name="cookie-policy" content="/cookies" />
        <meta name="data-controller" content="HP Marcas Perfumes Ltda" />
        <meta
          name="data-protection-officer"
          content="privacidade@hpmarcas.com.br"
        />

        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ConditionalCustomerAuth>
          {/* Consent Manager - loads tracking scripts based on consent */}
          <ConsentManager />

          {/* Main content */}
          {children}

          <CookieBanner />

          {/* Accessibility announcement for screen readers */}
          <div
            className="sr-only"
            role="status"
            aria-live="polite"
            id="status-announcement"
          ></div>
        </ConditionalCustomerAuth>

        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
