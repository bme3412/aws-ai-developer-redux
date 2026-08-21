#!/usr/bin/env node
/**
 * Convert trilogy/extra-questions.js (window.TRILOGY_DRILL) into the
 * Next app question shape at src/data/questions/notes-drill.json.
 *
 * Re-run after editing the trilogy drill bank.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const srcPath = path.join(root, 'trilogy', 'extra-questions.js');
const outPath = path.join(root, 'src', 'data', 'questions', 'notes-drill.json');

const TASK_TO_ARTICLE = {
  '1.1': 'architectural-design',
  '1.2': 'model-selection',
  '1.3': 'data-pipelines',
  '1.4': 'vector-stores',
  '1.5': 'retrieval-mechanisms',
  '1.6': 'prompt-engineering',
  '1.7': 'bedrock-deep-dive',
  '1.8': 'rag-patterns',
  '1.aws': 'architectural-design',
  '2.1': 'agentic-ai',
  '2.2': 'model-deployment',
  '2.3': 'enterprise-integration',
  '2.4': 'fm-api-integrations',
  '2.5': 'app-integration-patterns',
  '2.6': 'agent-patterns',
  '2.7': 'production-patterns',
  '3.1': 'input-output-safety',
  '3.2': 'data-security-privacy',
  '3.3': 'governance-compliance',
  '3.4': 'responsible-ai',
  '4.1': 'cost-optimization',
  '4.2': 'performance-optimization',
  '4.3': 'monitoring-systems',
  '5.1': 'evaluation-systems',
  '5.2': 'troubleshooting',
};

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(srcPath, 'utf8'), ctx);
const drills = ctx.window.TRILOGY_DRILL;
if (!Array.isArray(drills) || drills.length === 0) {
  console.error('No TRILOGY_DRILL array found in', srcPath);
  process.exit(1);
}

function skillsFor(task) {
  if (task === '1.aws') return ['1.1'];
  return [String(task)];
}

const questions = drills.map((q) => {
  const task = String(q.task || '');
  const domain = Number(q.domain);
  const type = q.type === 'multiple-response' || q.type === 'ordering'
    ? q.type
    : 'multiple-choice';

  return {
    id: q.id,
    domain: Number.isFinite(domain) ? domain : Number(String(task).split('.')[0]) || 1,
    task,
    skills: skillsFor(task),
    type,
    difficulty: task === '1.aws' ? 'easy' : 'medium',
    scenario: q.scenario || undefined,
    question: q.question,
    options: (q.options || []).map((opt) => ({ id: opt.id, text: opt.text })),
    correctAnswers: q.correctAnswers || [],
    explanation: q.explanation || '',
    incorrectExplanations: q.incorrectExplanations || undefined,
    services: [],
    source: 'notes-drill',
    articleReference: TASK_TO_ARTICLE[task] || undefined,
  };
});

const counts = {};
for (const q of questions) {
  const key = `${q.domain}:${q.task}`;
  counts[key] = (counts[key] || 0) + 1;
}

fs.writeFileSync(outPath, JSON.stringify({ questions }, null, 2) + '\n');
console.log(`Wrote ${questions.length} drill items → ${path.relative(root, outPath)}`);
for (const key of Object.keys(counts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
  console.log(`  ${key}  ${counts[key]}`);
}
