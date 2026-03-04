const BASE = 'https://wiki.csgoluck.com';

export function faqSchema(faqs: { question: string; answer: string }[]) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  });
}

export function breadcrumbSchema(crumbs: { name?: string; label?: string; url?: string }[]) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => {
      const entry: Record<string, any> = { '@type': 'ListItem', position: i + 1, name: c.name || (c as any).label || '' };
      if (c.url) entry.item = c.url.startsWith('http') ? c.url : `${BASE}${c.url}`;
      return entry;
    }),
  });
}
