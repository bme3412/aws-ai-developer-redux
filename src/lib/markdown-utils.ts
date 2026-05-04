export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface Section {
  id: string;
  title: string;
  content: string;
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function deduplicateSlug(slug: string, seen: Map<string, number>): string {
  const count = seen.get(slug) || 0;
  seen.set(slug, count + 1);
  return count === 0 ? slug : `${slug}-${count}`;
}

export function extractHeadings(markdown: string): TocHeading[] {
  const seen = new Map<string, number>();
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: TocHeading[] = [];
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const id = deduplicateSlug(generateSlug(text), seen);
    headings.push({ id, text, level });
  }

  return headings;
}

export function estimateReadingTime(markdown: string): number {
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function splitIntoSections(markdown: string): Section[] {
  const seen = new Map<string, number>();
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)$/);
    if (h2Match) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        id: deduplicateSlug(generateSlug(h2Match[1].trim()), seen),
        title: h2Match[1].trim(),
        content: '',
      };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    } else {
      // Content before the first H2
      if (!sections.length || sections[sections.length - 1].id !== '__intro') {
        sections.push({ id: '__intro', title: '', content: '' });
      }
      sections[sections.length - 1].content += line + '\n';
    }
  }
  if (currentSection) sections.push(currentSection);

  return sections;
}
