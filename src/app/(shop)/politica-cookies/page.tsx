"use client";

import React from "react";
import { Cookie } from "lucide-react";
import LegalPageLayout from "@/components/layout/LegalPageLayout";
import PolicySectionComponent from "@/components/policy/PolicySection";
import CookiePreferences from "@/components/legal/CookiePreferences";
import { COOKIE_POLICY_DATA } from "@/data/cookie-policy";

export default function CookiePolicyPage() {
  const tableOfContents = COOKIE_POLICY_DATA.map((section) => ({
    id: section.id,
    title: section.title,
  }));

  return (
    <LegalPageLayout
      title="Política de Cookies"
      subtitle="Como utilizamos cookies para melhorar sua experiência"
      icon={Cookie}
      lastUpdate="Dezembro de 2024"
      version="1.0"
      tableOfContents={tableOfContents}
      footerText="Gerencie suas preferências de cookies a qualquer momento."
    >
      {/* Cookie Preferences Component */}
      <div className="mb-8">
        <CookiePreferences />
      </div>

      {/* Policy Sections */}
      {COOKIE_POLICY_DATA.map((section) => (
        <div key={section.id} id={section.id}>
          <PolicySectionComponent section={section} />
        </div>
      ))}
    </LegalPageLayout>
  );
}
