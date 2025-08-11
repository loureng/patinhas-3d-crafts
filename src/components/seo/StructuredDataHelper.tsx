import { StructuredData } from "@/types/blog";

interface StructuredDataProps {
  data: StructuredData | StructuredData[];
}

const StructuredDataHelper = ({ data }: StructuredDataProps) => {
  const jsonLd = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLd.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 2)
          }}
        />
      ))}
    </>
  );
};

// Helper functions to generate common structured data schemas

export const generateWebsiteSchema = (
  siteName: string,
  siteUrl: string,
  description: string
): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": siteName,
  "url": siteUrl,
  "description": description,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${siteUrl}/produtos?search={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
});

export const generateOrganizationSchema = (
  name: string,
  url: string,
  logo: string,
  description: string,
  contactPhone?: string,
  contactEmail?: string
): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": name,
  "url": url,
  "logo": {
    "@type": "ImageObject",
    "url": logo
  },
  "description": description,
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": contactPhone,
    "email": contactEmail,
    "contactType": "customer service",
    "availableLanguage": "Portuguese"
  },
  "sameAs": [
    // Add social media URLs here
    "https://www.instagram.com/jardimdas patinhas",
    "https://www.facebook.com/jardimdas patinhas"
  ]
});

export const generateBlogPostSchema = (
  title: string,
  description: string,
  author: string,
  datePublished: string,
  dateModified: string,
  url: string,
  imageUrl: string,
  organizationName: string,
  organizationUrl: string
): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": title,
  "description": description,
  "author": {
    "@type": "Organization",
    "name": author
  },
  "publisher": {
    "@type": "Organization",
    "name": organizationName,
    "url": organizationUrl
  },
  "datePublished": datePublished,
  "dateModified": dateModified,
  "url": url,
  "image": {
    "@type": "ImageObject",
    "url": imageUrl
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": url
  }
});

export const generateProductSchema = (
  name: string,
  description: string,
  price: number,
  currency: string,
  availability: string,
  imageUrl: string,
  url: string,
  brand: string,
  sku?: string,
  rating?: number,
  reviewCount?: number
): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": name,
  "description": description,
  "image": imageUrl,
  "url": url,
  "brand": {
    "@type": "Brand",
    "name": brand
  },
  "sku": sku,
  "offers": {
    "@type": "Offer",
    "price": price,
    "priceCurrency": currency,
    "availability": `https://schema.org/${availability}`,
    "url": url
  },
  ...(rating && reviewCount && {
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": rating,
      "reviewCount": reviewCount
    }
  })
});

export const generateBreadcrumbSchema = (
  items: Array<{ name: string; url: string }>
): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const generateFAQSchema = (
  faqs: Array<{ question: string; answer: string }>
): StructuredData => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
});

export default StructuredDataHelper;