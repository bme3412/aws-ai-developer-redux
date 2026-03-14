import { AlertTriangle, CheckCircle, Clock, Target, Brain, Zap, BookOpen, HelpCircle } from 'lucide-react';

export default function ExamTipsPage() {
  return (
    <div className="flex">
      <div className="flex-1 max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Exam Tips & Strategies</h1>
          <p className="text-gray-600 mt-1">
            Practical strategies for the AWS Certified AI Practitioner (AIP-C01) exam.
          </p>
        </div>

        {/* Exam Overview */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Exam Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600 font-medium">Questions</span>
              <p className="text-blue-900 font-bold text-lg">65</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Time</span>
              <p className="text-blue-900 font-bold text-lg">90 minutes</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Passing Score</span>
              <p className="text-blue-900 font-bold text-lg">~70%</p>
            </div>
            <div>
              <span className="text-blue-600 font-medium">Format</span>
              <p className="text-blue-900 font-bold text-lg">Multiple Choice</p>
            </div>
          </div>
        </div>

        {/* Question Types */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-gray-500" />
            Question Types
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Scenario-Based (Most Common)</h3>
              <p className="text-sm text-gray-600 mb-2">
                A company needs to... Which service/approach is MOST appropriate?
              </p>
              <p className="text-sm text-gray-500 italic">
                Focus on understanding the requirement and eliminating wrong answers.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Service Selection</h3>
              <p className="text-sm text-gray-600 mb-2">
                Which AWS service enables X capability?
              </p>
              <p className="text-sm text-gray-500 italic">
                Know the primary use case and keywords for each service.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Best Practice</h3>
              <p className="text-sm text-gray-600 mb-2">
                What is the recommended approach for...?
              </p>
              <p className="text-sm text-gray-500 italic">
                AWS best practices prioritize managed services and security.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Troubleshooting</h3>
              <p className="text-sm text-gray-600 mb-2">
                A GenAI application is experiencing X issue. How should the team diagnose...?
              </p>
              <p className="text-sm text-gray-500 italic">
                Think systematically: X-Ray for tracing, CloudWatch for metrics, invocation logs for FM details.
              </p>
            </div>
          </div>
        </div>

        {/* Time Management */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Time Management
          </h2>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">1</span>
                <div>
                  <strong className="text-gray-900">~80 seconds per question</strong>
                  <p className="text-gray-600">With 65 questions in 90 minutes, budget about 1:20 per question. This leaves buffer time for review.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">2</span>
                <div>
                  <strong className="text-gray-900">Flag and move on</strong>
                  <p className="text-gray-600">If you&apos;re stuck after 90 seconds, make your best guess, flag it, and move on. Return during review time.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">3</span>
                <div>
                  <strong className="text-gray-900">First pass, then review</strong>
                  <p className="text-gray-600">Answer all questions in order, then use remaining time to review flagged questions.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer Strategies */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-gray-500" />
            Answer Strategies
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle className="w-5 h-5" />
                <h3 className="font-semibold">Elimination First</h3>
              </div>
              <p className="text-sm text-green-800">
                Before selecting the &quot;right&quot; answer, eliminate obviously wrong options. AWS exams often include 1-2 clearly incorrect choices. This improves your odds significantly.
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-semibold">Watch for Qualifiers</h3>
              </div>
              <p className="text-sm text-amber-800 mb-2">
                Pay close attention to words that change the meaning:
              </p>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• <strong>MOST</strong> appropriate - there may be multiple valid options, pick the best</li>
                <li>• <strong>LEAST</strong> amount of effort - prioritize managed/serverless solutions</li>
                <li>• <strong>FIRST</strong> step - identify the initial action in a sequence</li>
                <li>• <strong>cost-effective</strong> - don&apos;t over-engineer, consider managed services</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Brain className="w-5 h-5" />
                <h3 className="font-semibold">Match Keywords to Services</h3>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                Many questions contain keywords that point directly to specific services:
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                <div>• &quot;content filtering&quot; → Guardrails</div>
                <div>• &quot;distributed tracing&quot; → X-Ray</div>
                <div>• &quot;agentic&quot; or &quot;autonomous&quot; → Bedrock Agents</div>
                <div>• &quot;RAG&quot; or &quot;knowledge retrieval&quot; → Knowledge Bases</div>
                <div>• &quot;private connectivity&quot; → VPC Endpoints</div>
                <div>• &quot;PII detection&quot; → Guardrails or Comprehend</div>
              </div>
            </div>
          </div>
        </div>

        {/* Common Traps */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-gray-500" />
            Common Traps to Avoid
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Over-engineering:</strong> If a question asks for &quot;simplest&quot; or &quot;least effort,&quot; don&apos;t choose complex custom solutions when a managed service exists.
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Security in prompts:</strong> Never choose options that rely on FM prompts for security decisions. Security must be enforced in code (Lambda, Guardrails).
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Wrong service category:</strong> Don&apos;t confuse similar services - Kendra is search (not GenAI), Textract is document extraction (not conversation), Comprehend is NLP (not generation).
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Ignoring requirements:</strong> Read all constraints carefully. &quot;Real-time&quot; eliminates batch options. &quot;Cost-effective&quot; might eliminate Provisioned Throughput for low-usage scenarios.
              </p>
            </div>
          </div>
        </div>

        {/* Exam Day */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-gray-500" />
            Exam Day Checklist
          </h2>
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Get good sleep the night before
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Arrive 15-30 minutes early (or test your setup for online proctoring)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Bring valid ID (two forms for testing centers)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Use the provided scratch paper for notes and elimination
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Take a deep breath - you&apos;ve prepared for this
              </li>
            </ul>
          </div>
        </div>

        {/* Final Advice */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 text-purple-700 mb-2">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-semibold">Final Advice</h3>
          </div>
          <p className="text-sm text-purple-800">
            Trust your preparation. If you&apos;ve studied the domains, practiced questions, and understand the core services, you&apos;re ready.
            On uncertain questions, go with your first instinct unless you find a clear reason to change your answer.
            Remember: you don&apos;t need a perfect score - you need to pass. Focus on the questions you know and make educated guesses on the rest.
          </p>
        </div>
      </div>
    </div>
  );
}
