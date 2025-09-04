"use client";

import { useState, useEffect } from "react";

interface ConsentPreferences {
  cookies: boolean;
  marketing: boolean;
  analytics: boolean;
  timestamp: number;
}

export const useLegalConsent = () => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<ConsentPreferences | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedConsent = localStorage.getItem("legalConsent");
      const savedPrefs = localStorage.getItem("consentPreferences");

      if (savedConsent && savedPrefs) {
        setHasConsent(JSON.parse(savedConsent));
        setPreferences(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.error("Error loading consent data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConsent = (
    consent: boolean,
    prefs?: Partial<ConsentPreferences>
  ) => {
    const newPreferences: ConsentPreferences = {
      cookies: prefs?.cookies ?? true,
      marketing: prefs?.marketing ?? false,
      analytics: prefs?.analytics ?? false,
      timestamp: Date.now(),
      ...prefs,
    };

    setHasConsent(consent);
    setPreferences(newPreferences);

    localStorage.setItem("legalConsent", JSON.stringify(consent));
    localStorage.setItem("consentPreferences", JSON.stringify(newPreferences));

    // Trigger consent update events
    window.dispatchEvent(
      new CustomEvent("consentUpdate", {
        detail: { consent, preferences: newPreferences },
      })
    );
  };

  const revokeConsent = () => {
    setHasConsent(false);
    setPreferences(null);

    localStorage.removeItem("legalConsent");
    localStorage.removeItem("consentPreferences");
    localStorage.removeItem("cookiePreferences");

    window.dispatchEvent(new CustomEvent("consentRevoked"));
  };

  const needsConsentUpdate = () => {
    if (!preferences) return true;

    // Check if consent is older than 1 year
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    return Date.now() - preferences.timestamp > oneYear;
  };

  return {
    hasConsent,
    preferences,
    loading,
    updateConsent,
    revokeConsent,
    needsConsentUpdate,
  };
};
