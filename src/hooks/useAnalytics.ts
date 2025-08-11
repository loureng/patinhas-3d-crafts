import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: any
    ) => void;
    dataLayer: any[];
  }
}

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

interface EcommerceEvent {
  currency: string;
  value: number;
  items: Array<{
    item_id: string;
    item_name: string;
    item_category?: string;
    quantity: number;
    price: number;
  }>;
}

export const useAnalytics = () => {
  let location;
  try {
    location = useLocation();
  } catch (error) {
    // Handle case where hook is used outside router context
    location = { pathname: window.location.pathname, search: window.location.search };
  }

  // Track page views automatically
  useEffect(() => {
    if (typeof window.gtag !== 'undefined' && location) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  // Track custom events
  const trackEvent = (event: AnalyticsEvent) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom_parameters,
      });
    }
  };

  // Track e-commerce events
  const trackPurchase = (data: EcommerceEvent & { transaction_id: string }) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'purchase', {
        transaction_id: data.transaction_id,
        value: data.value,
        currency: data.currency,
        items: data.items,
      });
    }
  };

  const trackAddToCart = (data: EcommerceEvent) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'add_to_cart', {
        currency: data.currency,
        value: data.value,
        items: data.items,
      });
    }
  };

  const trackRemoveFromCart = (data: EcommerceEvent) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'remove_from_cart', {
        currency: data.currency,
        value: data.value,
        items: data.items,
      });
    }
  };

  const trackViewItem = (data: EcommerceEvent) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'view_item', {
        currency: data.currency,
        value: data.value,
        items: data.items,
      });
    }
  };

  const trackBeginCheckout = (data: EcommerceEvent) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'begin_checkout', {
        currency: data.currency,
        value: data.value,
        items: data.items,
      });
    }
  };

  // Predefined event helpers
  const trackSearchEvent = (searchTerm: string) => {
    trackEvent({
      action: 'search',
      category: 'Site Search',
      label: searchTerm,
    });
  };

  const trackNewsletterSignup = (location: string) => {
    trackEvent({
      action: 'newsletter_signup',
      category: 'Engagement',
      label: location,
    });
  };

  const trackWhatsAppClick = () => {
    trackEvent({
      action: 'whatsapp_click',
      category: 'Contact',
      label: 'WhatsApp Support',
    });
  };

  const trackBlogRead = (articleTitle: string, category: string) => {
    trackEvent({
      action: 'blog_read',
      category: 'Content',
      label: articleTitle,
      custom_parameters: {
        blog_category: category,
      },
    });
  };

  const trackProductCustomization = (productId: string, productName: string) => {
    trackEvent({
      action: 'product_customization',
      category: 'Product',
      label: productName,
      custom_parameters: {
        product_id: productId,
      },
    });
  };

  return {
    trackEvent,
    trackPurchase,
    trackAddToCart,
    trackRemoveFromCart,
    trackViewItem,
    trackBeginCheckout,
    trackSearchEvent,
    trackNewsletterSignup,
    trackWhatsAppClick,
    trackBlogRead,
    trackProductCustomization,
  };
};

export default useAnalytics;