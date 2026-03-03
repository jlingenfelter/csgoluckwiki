/**
 * Tools Data Layer — reads from CMS-editable JSON files in src/data/tools/
 */

export interface ToolFaq {
  question: string;
  answer: string;
}

export interface ToolMeta {
  slug: string;
  title: string;
  description: string;
  heading: string;
  intro: string;
  faqs: ToolFaq[];
}

// Load all tool JSON files at build time
const toolModules = import.meta.glob<ToolMeta>('../data/tools/*.json', { eager: true });

export const TOOLS: ToolMeta[] = Object.values(toolModules)
  .map((mod: any) => mod.default || mod)
  .sort((a, b) => a.slug.localeCompare(b.slug));

export function getToolMeta(slug: string): ToolMeta | undefined {
  return TOOLS.find(t => t.slug === slug);
}
