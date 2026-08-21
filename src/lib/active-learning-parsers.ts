export interface GlossaryEntry {
  name: string;
  category: string;
  what: string;
  problem: string;
  sits: string;
  use: string;
  pricing: string;
  cue: string;
  confuse: string;
}

const GLOSSARY_FIELDS: Record<string, keyof Omit<GlossaryEntry, 'name' | 'category'>> = {
  'What it is': 'what',
  'Problem it solves': 'problem',
  'Where it sits': 'sits',
  'Typical use': 'use',
  Pricing: 'pricing',
  'Exam cue': 'cue',
  'Do not confuse with': 'confuse',
};

export function parseGlossaryCard(raw: string): GlossaryEntry {
  const entry: GlossaryEntry = {
    name: '',
    category: '',
    what: '',
    problem: '',
    sits: '',
    use: '',
    pricing: '',
    cue: '',
    confuse: '',
  };

  for (const line of raw.trim().split('\n')) {
    const match = line.match(/^([a-z]+):\s*(.*)$/);
    if (!match) continue;
    const key = match[1] as keyof GlossaryEntry;
    if (key in entry) entry[key] = match[2];
  }

  return entry;
}

/**
 * Turn #### service entries with labeled fields into ```glossary fences
 * so MarkdownArticle can render them as cards instead of a wall of H4s.
 */
export function liftGlossaryEntries(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];
  let i = 0;
  let category = '';

  while (i < lines.length) {
    const h3 = lines[i].match(/^### (.+)$/);
    if (h3) {
      const title = h3[1].trim();
      let look = i + 1;
      while (look < lines.length && lines[look].trim() === '') look++;
      const nextIsGlossary =
        look < lines.length &&
        lines[look].startsWith('#### ') &&
        lines.slice(look + 1, look + 4).some((line) => line.startsWith('**What it is.**'));

      if (nextIsGlossary) {
        category = title;
        out.push('```glossarygroup');
        out.push(title);
        out.push('```');
        out.push('');
        i += 1;
        continue;
      }
    }

    const h4 = lines[i].match(/^#### (.+)$/);
    if (h4) {
      let look = i + 1;
      while (look < lines.length && lines[look].trim() === '') look++;
      if (look < lines.length && lines[look].startsWith('**What it is.**')) {
        const fields = [`name: ${h4[1].trim()}`, `category: ${category}`];
        i = look;
        while (i < lines.length) {
          if (lines[i].trim() === '') {
            i += 1;
            continue;
          }
          const field = lines[i].match(/^\*\*(.+?)\.\*\*\s*(.*)$/);
          if (field && GLOSSARY_FIELDS[field[1]]) {
            fields.push(`${GLOSSARY_FIELDS[field[1]]}: ${field[2]}`);
            i += 1;
            continue;
          }
          break;
        }
        out.push('```glossary');
        out.push(fields.join('\n'));
        out.push('```');
        out.push('');
        continue;
      }
    }

    out.push(lines[i]);
    i += 1;
  }

  return out.join('\n');
}

export function parseRecallCard(raw: string): { question: string; answer: string } {
  const lines = raw.trim().split('\n');
  const qLine = lines.find(l => l.startsWith('Q:'))?.slice(2).trim() || '';
  const aLine = lines.find(l => l.startsWith('A:'))?.slice(2).trim() || '';
  return { question: qLine, answer: aLine };
}

export function parseFillIn(raw: string): { textBefore: string; answer: string; textAfter: string } {
  const match = raw.trim().match(/^([\s\S]*?)\{\{(.+?)\}\}([\s\S]*)$/);
  if (!match) return { textBefore: raw.trim(), answer: '', textAfter: '' };
  return { textBefore: match[1].trim(), answer: match[2].trim(), textAfter: match[3].trim() };
}

export interface PracticeItem {
  question: string;
  options: { label: string; text: string }[];
  correctLabel: string;
  feedback?: string;
}

export function parseQuickCheck(raw: string): PracticeItem {
  const lines = raw.trim().split('\n');
  const question = lines.find(l => l.startsWith('Q:'))?.slice(2).trim() || '';
  const options = lines
    .filter(l => /^[A-D]:/.test(l))
    .map(l => ({ label: l[0], text: l.slice(2).trim() }));
  const correctLabel = lines.find(l => l.startsWith('correct:'))?.slice(8).trim() || 'A';
  const feedback = lines.find(l => l.startsWith('feedback:'))?.slice(9).trim();
  return { question, options, correctLabel, feedback };
}

export function parsePracticeQuiz(raw: string): PracticeItem[] {
  return raw
    .trim()
    .split(/\n(?=Q:)/)
    .map((chunk) => parseQuickCheck(chunk))
    .filter((item) => item.question && item.options.length > 0);
}
