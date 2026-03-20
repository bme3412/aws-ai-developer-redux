import Link from 'next/link';
import { FlaskConical, Play, Clock, Cpu, Database, Shield, MessageSquare, Bot, Calculator, BarChart3, Radio } from 'lucide-react';

const labs = [
  {
    id: 'bedrock-playground',
    title: 'Bedrock Playground',
    description: 'Compare multiple foundation models side-by-side. See latency, token usage, and cost differences in real time.',
    icon: Cpu,
    domain: 1,
    tasks: ['1.2'],
    difficulty: 'beginner',
    estimatedMinutes: 20,
    services: ['Amazon Bedrock', 'Claude', 'Nova', 'Llama'],
    color: 'blue',
  },
  {
    id: 'prompt-lab',
    title: 'Prompt Engineering Lab',
    description: 'Experiment with prompting techniques: zero-shot, few-shot, chain-of-thought, and structured outputs.',
    icon: MessageSquare,
    domain: 1,
    tasks: ['1.6'],
    difficulty: 'beginner',
    estimatedMinutes: 25,
    services: ['Amazon Bedrock', 'Prompt Management'],
    color: 'purple',
  },
  {
    id: 'rag-builder',
    title: 'RAG Builder',
    description: 'Build a Retrieval-Augmented Generation pipeline. Query knowledge bases, see retrieved chunks, and understand semantic search.',
    icon: Database,
    domain: 1,
    tasks: ['1.4', '1.5'],
    difficulty: 'intermediate',
    estimatedMinutes: 30,
    services: ['Bedrock Knowledge Bases', 'OpenSearch', 'Titan Embeddings'],
    color: 'amber',
  },
  {
    id: 'streaming-demo',
    title: 'Streaming Demo',
    description: 'Compare streaming vs batch responses. Understand time-to-first-token and when to use each approach.',
    icon: Radio,
    domain: 2,
    tasks: ['2.3', '4.2'],
    difficulty: 'beginner',
    estimatedMinutes: 15,
    services: ['Amazon Bedrock', 'InvokeModelWithResponseStream'],
    color: 'green',
  },
  {
    id: 'agent-workshop',
    title: 'Agent Workshop',
    description: 'Build and test Bedrock Agents with action groups. View reasoning traces and understand agentic AI patterns.',
    icon: Bot,
    domain: 2,
    tasks: ['2.1'],
    difficulty: 'advanced',
    estimatedMinutes: 40,
    services: ['Bedrock Agents', 'Lambda', 'Step Functions'],
    color: 'red',
  },
  {
    id: 'guardrails-demo',
    title: 'Guardrails Demo',
    description: 'Test Bedrock Guardrails for content filtering, PII detection, and topic restrictions. See how safety controls work.',
    icon: Shield,
    domain: 3,
    tasks: ['3.1', '3.2'],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    services: ['Bedrock Guardrails', 'Amazon Comprehend'],
    color: 'teal',
  },
  {
    id: 'cost-calculator',
    title: 'Cost Calculator',
    description: 'Estimate Bedrock costs across models. Explore optimization strategies like prompt caching and model tiering.',
    icon: Calculator,
    domain: 4,
    tasks: ['4.1'],
    difficulty: 'beginner',
    estimatedMinutes: 15,
    services: ['Bedrock Pricing', 'Cost Optimization'],
    color: 'orange',
  },
  {
    id: 'evaluation-lab',
    title: 'Evaluation Lab',
    description: 'Understand model evaluation metrics, LLM-as-Judge, and RAG quality assessment with interactive examples.',
    icon: BarChart3,
    domain: 5,
    tasks: ['5.1'],
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    services: ['Bedrock Model Evaluations', 'RAGAS Metrics'],
    color: 'pink',
  },
];

const colorStyles: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  blue: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
  },
  amber: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
  purple: {
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
  },
  green: {
    bg: 'bg-green-500/5',
    border: 'border-green-500/20',
    text: 'text-green-400',
    iconBg: 'bg-green-500/10',
  },
  red: {
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    text: 'text-red-400',
    iconBg: 'bg-red-500/10',
  },
  teal: {
    bg: 'bg-teal-500/5',
    border: 'border-teal-500/20',
    text: 'text-teal-400',
    iconBg: 'bg-teal-500/10',
  },
  orange: {
    bg: 'bg-orange-500/5',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
  },
  pink: {
    bg: 'bg-pink-500/5',
    border: 'border-pink-500/20',
    text: 'text-pink-400',
    iconBg: 'bg-pink-500/10',
  },
};

export default function LabsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-amber-500" />
          Interactive Labs
        </h1>
        <p className="text-gray-600 mt-2 max-w-2xl">
          Hands-on experience with AWS Bedrock APIs. These labs connect to real AWS services
          to demonstrate the concepts you&apos;re studying for the exam.
        </p>
      </div>

      {/* Prerequisites Notice */}
      <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
        <h3 className="font-semibold text-amber-600 mb-2">AWS Configuration Required</h3>
        <p className="text-sm text-gray-700">
          These labs require AWS credentials with Bedrock access. Configure your environment variables
          in <code className="px-1.5 py-0.5 bg-white rounded text-amber-600">.env.local</code> to enable live API calls.
        </p>
      </div>

      {/* Labs Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {labs.map(lab => {
          const Icon = lab.icon;
          const styles = colorStyles[lab.color];

          return (
            <Link
              key={lab.id}
              href={`/labs/${lab.id}`}
              className={`group p-6 rounded-lg border ${styles.bg} ${styles.border} hover:border-opacity-50 transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg ${styles.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${styles.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500">Domain {lab.domain}</span>
                    <span className="text-gray-700">•</span>
                    <span className={`text-xs ${
                      lab.difficulty === 'beginner' ? 'text-green-400' :
                      lab.difficulty === 'intermediate' ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {lab.difficulty}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                    {lab.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {lab.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {lab.services.slice(0, 3).map(service => (
                      <span
                        key={service}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {service}
                      </span>
                    ))}
                    {lab.services.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                        +{lab.services.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      ~{lab.estimatedMinutes} min
                    </span>
                    <span className={`flex items-center gap-1 text-sm font-medium ${styles.text} group-hover:translate-x-1 transition-transform`}>
                      <Play className="w-4 h-4" />
                      Start Lab
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
