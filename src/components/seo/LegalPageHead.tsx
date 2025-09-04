import Head from "next/head";
import { LEGAL_SEO_DATA } from "@/data/seo-legal";

interface LegalPageHeadProps {
  page: keyof typeof LEGAL_SEO_DATA;
}

const LegalPageHead: React.FC<LegalPageHeadProps> = ({ page }) => {
  const seoData = LEGAL_SEO_DATA[page];

  if (!seoData) return null;

  return (
    <Head>
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      <meta name="keywords" content={seoData.keywords} />
      <link rel="canonical" href={seoData.canonicalUrl} />

      {"lastModified" in seoData && seoData.lastModified && (
        <meta name="last-modified" content={seoData.lastModified} />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={seoData.title} />
      <meta property="og:description" content={seoData.description} />
      <meta property="og:url" content={seoData.canonicalUrl} />
      <meta property="og:type" content="website" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={seoData.title} />
      <meta name="twitter:description" content={seoData.description} />

      {/* Structured Data */}
      {"structuredData" in seoData && seoData.structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(seoData.structuredData),
          }}
        />
      )}
    </Head>
  );
};

export default LegalPageHead;
