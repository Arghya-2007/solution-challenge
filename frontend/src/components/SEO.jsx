import { useEffect } from 'react';

export default function SEO({ title, description, keywords }) {
  useEffect(() => {
    if (title) {
      document.title = title;
      
      let ogTitle = document.querySelector(`meta[property="og:title"]`);
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', title);
    }
    
    const setMetaTag = (name, content, isProperty = false) => {
      if (!content) return;
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    const defaultDesc = "EquiLens detects, explains, and fixes bias in your HR data — powered by Vertex AI and built for HR compliance teams.";
    const defaultKeywords = "EquiLens, hiring bias, HR data audit, EEOC compliance, Adverse Impact Ratio, Vertex AI, AI hiring";

    setMetaTag('description', description || defaultDesc);
    setMetaTag('keywords', keywords || defaultKeywords);
    setMetaTag('og:description', description || defaultDesc, true);
    setMetaTag('og:type', 'website', true);
  }, [title, description, keywords]);

  return null;
}
