"use client";

import React, { useEffect } from "react";
import { useLegalConsent } from "@/hooks/useLegalConsent";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const ConsentManager: React.FC = () => {
  const { hasConsent, preferences, loading } = useLegalConsent();

  useEffect(() => {
    if (loading || !hasConsent || !preferences) return;

    // Load Google Analytics
    if (preferences.analytics) {
      loadGoogleAnalytics();
    }

    // Load Facebook Pixel
    if (preferences.marketing) {
      loadFacebookPixel();
    }

    // Load other marketing tools
    if (preferences.marketing) {
      loadMarketingTools();
    }
  }, [hasConsent, preferences, loading]);

  const loadGoogleAnalytics = () => {
    if (typeof window !== "undefined" && !window.gtag) {
      // Load GA4
      const script = document.createElement("script");
      script.async = true;
      script.src =
        "https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID";
      document.head.appendChild(script);

      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag(...args: unknown[]) {
          window.dataLayer?.push(args);
        };
        window.gtag("js", new Date());
        window.gtag("config", "GA_MEASUREMENT_ID", {
          anonymize_ip: true,
          cookie_flags: "SameSite=None;Secure",
        });
      };
    }
  };

  const loadFacebookPixel = () => {
    if (typeof window !== "undefined" && !window.fbq) {
      // Load Facebook Pixel
      const script = document.createElement("script");
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', 'FB_PIXEL_ID');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }
  };

  const loadMarketingTools = () => {
    // Load other marketing tools like Hotjar, etc.
    console.log("Loading marketing tools...");
  };

  // Listen for consent updates
  useEffect(() => {
    const handleConsentUpdate = (event: CustomEvent) => {
      const { consent, preferences: newPrefs } = event.detail;

      if (!consent || !newPrefs.analytics) {
        // Disable Google Analytics
        if (window.gtag) {
          window.gtag("consent", "update", {
            analytics_storage: "denied",
          });
        }
      }

      if (!consent || !newPrefs.marketing) {
        // Disable Facebook Pixel and other marketing tools
        if (window.fbq) {
          window.fbq("consent", "revoke");
        }
      }
    };

    const handleConsentRevoked = () => {
      // Clear all tracking cookies and local storage
      document.cookie.split(";").forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (
          name.startsWith("_ga") ||
          name.startsWith("_fb") ||
          name.startsWith("_hjid")
        ) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      });
    };

    window.addEventListener(
      "consentUpdate",
      handleConsentUpdate as EventListener
    );
    window.addEventListener("consentRevoked", handleConsentRevoked);

    return () => {
      window.removeEventListener(
        "consentUpdate",
        handleConsentUpdate as EventListener
      );
      window.removeEventListener("consentRevoked", handleConsentRevoked);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ConsentManager;
