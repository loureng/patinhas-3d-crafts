import { useEffect } from "react";
import { SEOMetaData } from "@/types/blog";

interface SEOMetaTagsProps extends SEOMetaData {
  siteName?: string;
  siteUrl?: string;
}

const SEOMetaTags = ({
  title,
  description,
  keywords = [],
  canonical_url,
  og_title,
  og_description,
  og_image,
  og_type = "website",
  twitter_title,
  twitter_description,
  twitter_image,
  twitter_card = "summary_large_image",
  siteName = "Jardim das Patinhas",
  siteUrl = "https://jardimdas patinhas.com"
}: SEOMetaTagsProps) => {
  
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title.includes(siteName) ? title : `${title} - ${siteName}`;
    }

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: string = "name") => {
      let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Update or create link tags
    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Basic meta tags
    if (description) {
      updateMetaTag("description", description);
    }

    if (keywords.length > 0) {
      updateMetaTag("keywords", keywords.join(", "));
    }

    // Canonical URL
    if (canonical_url) {
      updateLinkTag("canonical", canonical_url);
    }

    // Open Graph tags
    updateMetaTag("og:site_name", siteName, "property");
    updateMetaTag("og:type", og_type, "property");
    updateMetaTag("og:url", canonical_url || window.location.href, "property");
    
    if (og_title || title) {
      updateMetaTag("og:title", og_title || title!, "property");
    }
    
    if (og_description || description) {
      updateMetaTag("og:description", og_description || description!, "property");
    }
    
    if (og_image) {
      updateMetaTag("og:image", og_image.startsWith('http') ? og_image : `${siteUrl}${og_image}`, "property");
      updateMetaTag("og:image:alt", og_title || title || siteName, "property");
    }

    // Twitter Card tags
    updateMetaTag("twitter:card", twitter_card);
    updateMetaTag("twitter:site", "@jardimdas patinhas"); // Update with actual Twitter handle
    
    if (twitter_title || og_title || title) {
      updateMetaTag("twitter:title", twitter_title || og_title || title!);
    }
    
    if (twitter_description || og_description || description) {
      updateMetaTag("twitter:description", twitter_description || og_description || description!);
    }
    
    if (twitter_image || og_image) {
      const imageUrl = twitter_image || og_image!;
      updateMetaTag("twitter:image", imageUrl.startsWith('http') ? imageUrl : `${siteUrl}${imageUrl}`);
    }

    // Additional SEO meta tags
    updateMetaTag("robots", "index,follow");
    updateMetaTag("author", siteName);
    updateMetaTag("viewport", "width=device-width, initial-scale=1.0");

    // Cleanup function to avoid memory leaks
    return () => {
      // Note: In a real application, you might want to restore previous meta tags
      // For now, we'll leave them as they are since they'll be updated on page changes
    };
  }, [
    title,
    description,
    keywords,
    canonical_url,
    og_title,
    og_description,
    og_image,
    og_type,
    twitter_title,
    twitter_description,
    twitter_image,
    twitter_card,
    siteName,
    siteUrl
  ]);

  // This component doesn't render anything visible
  return null;
};

export default SEOMetaTags;