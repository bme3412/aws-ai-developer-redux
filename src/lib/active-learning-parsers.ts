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

export function parseQuickCheck(raw: string): {
  question: string;
  options: { label: string; text: string }[];
  correctLabel: string;
  feedback?: string;
} {
  const lines = raw.trim().split('\n');
  const question = lines.find(l => l.startsWith('Q:'))?.slice(2).trim() || '';
  const options = lines
    .filter(l => /^[A-D]:/.test(l))
    .map(l => ({ label: l[0], text: l.slice(2).trim() }));
  const correctLabel = lines.find(l => l.startsWith('correct:'))?.slice(8).trim() || 'A';
  const feedback = lines.find(l => l.startsWith('feedback:'))?.slice(9).trim();
  return { question, options, correctLabel, feedback };
}
