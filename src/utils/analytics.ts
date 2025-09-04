export class Analytics {
  static trackEvent(eventName: string, parameters?: Record<string, unknown>) {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, parameters);
    }
  }

  static trackPageView(url: string, title?: string) {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", "GA_MEASUREMENT_ID", {
        page_path: url,
        page_title: title,
      });
    }
  }

  static trackPurchase(
    transactionId: string,
    value: number,
    currency = "BRL",
    items?: Array<{ id: string; name: string; quantity?: number; price?: number; [key: string]: unknown }>
  ) {
    if (typeof window !== "undefined") {
      // Google Analytics
      if (window.gtag) {
        window.gtag("event", "purchase", {
          transaction_id: transactionId,
          value: value,
          currency: currency,
          items: items,
        });
      }

      // Facebook Pixel
      if (window.fbq) {
        window.fbq("track", "Purchase", {
          value: value,
          currency: currency,
        });
      }
    }
  }

  static trackConsentUpdate(preferences: Record<string, boolean>) {
    this.trackEvent("consent_update", {
      analytics_consent: preferences.analytics,
      marketing_consent: preferences.marketing,
      functionality_consent: preferences.functionality,
    });
  }
}
