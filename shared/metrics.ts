export interface SpeechMetrics {
  durationSeconds: number;
  wordCount: number;
  wpm: number;
  paceRating: 'Too Slow' | 'Ideal Pace' | 'A Bit Fast' | 'Rushed';
  paceAdvice: string;
  fillerWords: { word: string; count: number }[];
  totalFillers: number;
  deliveryTip: string;
}

export interface StarAnalysis {
  hasSituation: boolean;
  hasTask: boolean;
  hasAction: boolean;
  hasResult: boolean;
  starScore: number; // 0 - 100
  feedback: string;
}

export interface StudyResource {
  title: string;
  type: 'Article' | 'Documentation' | 'Practice' | 'Video Guide';
  query: string;
}

const COMMON_FILLERS = [
  'um', 'uh', 'like', 'you know', 'basically', 'literally', 'actually', 'sort of', 'kind of', 'i mean', 'right'
];

export function analyzeSpeech(text: string, durationSeconds?: number): SpeechMetrics {
  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Detect filler words with word-boundary check
  const lower = clean.toLowerCase();
  const detectedFillers: { word: string; count: number }[] = [];
  let totalFillers = 0;

  for (const filler of COMMON_FILLERS) {
    const escaped = filler.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      detectedFillers.push({ word: filler, count: matches.length });
      totalFillers += matches.length;
    }
  }

  // Duration: use measured seconds if voice, otherwise estimate typical speaking duration (~135 wpm)
  const duration = durationSeconds && durationSeconds > 1
    ? durationSeconds
    : Math.max(6, Math.round((wordCount / 135) * 60));

  const wpm = Math.round((wordCount / Math.max(duration, 3)) * 60);

  let paceRating: SpeechMetrics['paceRating'] = 'Ideal Pace';
  let paceAdvice = 'Optimal conversational speaking pace.';

  if (wpm < 110) {
    paceRating = 'Too Slow';
    paceAdvice = 'Slightly slow delivery. Aim for 120–150 WPM to maintain interviewer momentum.';
  } else if (wpm <= 160) {
    paceRating = 'Ideal Pace';
    paceAdvice = 'Natural conversational cadence (120–150 WPM). Clear and easy to follow.';
  } else if (wpm <= 190) {
    paceRating = 'A Bit Fast';
    paceAdvice = 'Brisk speaking tempo. Pausing between points improves retention.';
  } else {
    paceRating = 'Rushed';
    paceAdvice = 'Rushed delivery (>190 WPM). Slow down slightly to emphasize key technical metrics.';
  }

  let deliveryTip = '';
  if (totalFillers === 0) {
    deliveryTip = 'Crisp, filler-free communication. Shows strong composure.';
  } else if (totalFillers <= 2) {
    const names = detectedFillers.map(f => `"${f.word}"`).join(', ');
    deliveryTip = `Low filler usage (${totalFillers} total: ${names}). Replacing filler sounds with brief silences will project even higher confidence.`;
  } else {
    const names = detectedFillers.slice(0, 3).map(f => `"${f.word}"`).join(', ');
    deliveryTip = `${totalFillers} filler words noticed (${names}). Practice silent pauses when formulating thoughts.`;
  }

  return {
    durationSeconds: duration,
    wordCount,
    wpm,
    paceRating,
    paceAdvice,
    fillerWords: detectedFillers,
    totalFillers,
    deliveryTip,
  };
}

export function analyzeStarStructure(text: string): StarAnalysis {
  const lower = text.toLowerCase();

  const hasSituation = /\b(when|at|during|project|context|company|team|pilot|scenario|in my)\b/i.test(lower);
  const hasTask = /\b(needed to|goal|task|objective|responsible for|challenge|requirement|problem)\b/i.test(lower);
  const hasAction = /\b(i built|i designed|i implemented|i created|i decided|i led|i developed|i fixed|my approach)\b/i.test(lower);
  const hasResult = /\b(result|improved|reduced|increased|boosted|%|metric|outcome|feedback|impact|survey|users)\b/i.test(lower);

  const elements = [hasSituation, hasTask, hasAction, hasResult].filter(Boolean).length;
  const starScore = elements === 4 ? 100 : elements === 3 ? 80 : elements === 2 ? 60 : 40;

  let feedback = '';
  if (elements === 4) {
    feedback = 'Complete STAR structure demonstrated (Situation, Task, Action, and Quantified Result).';
  } else if (!hasResult) {
    feedback = 'Good breakdown of Context and Action, but lacks a quantified Result or Metric (e.g. latency, user impact, % gain).';
  } else if (!hasAction) {
    feedback = 'Context is described well, but emphasize your individual Action and technical decisions more directly.';
  } else {
    feedback = 'Frame this using the STAR method: 1) Context, 2) Specific Task, 3) Your Exact Action, 4) Measurable Result.';
  }

  return { hasSituation, hasTask, hasAction, hasResult, starScore, feedback };
}

export function getStudyResources(topic: string): StudyResource[] {
  const clean = topic.toLowerCase();

  if (clean.includes('rag') || clean.includes('retrieval') || clean.includes('vector') || clean.includes('embedding')) {
    return [
      { title: 'Pinecone / LangChain RAG Architecture Guide', type: 'Documentation', query: 'RAG retrieval architecture chunking vector database' },
      { title: 'RAG Evaluation Metrics (Ragas & Context Precision)', type: 'Article', query: 'RAG evaluation context precision recall faithfulness' },
      { title: 'Designing Production Vector Search Pipelines', type: 'Practice', query: 'production vector search reranking best practices' },
    ];
  }

  if (clean.includes('evaluation') || clean.includes('metric') || clean.includes('benchmark')) {
    return [
      { title: 'LLM Evaluation Methodologies & Benchmarks', type: 'Article', query: 'LLM evaluation test dataset ground truth metrics' },
      { title: 'A/B Testing and Offline Model Evaluation', type: 'Documentation', query: 'offline model evaluation baseline measurement' },
      { title: 'Designing LLM Test Sets for Edge Cases', type: 'Practice', query: 'designing test sets for AI application reliability' },
    ];
  }

  if (clean.includes('system design') || clean.includes('architecture') || clean.includes('scale')) {
    return [
      { title: 'System Design Primer (Scalability & Caching)', type: 'Documentation', query: 'system design primer caching queues microservices' },
      { title: 'API Rate Limiting and Resilience Patterns', type: 'Article', query: 'API rate limiting retry backoff circuit breaker' },
      { title: 'Mock System Design Interview Exercises', type: 'Practice', query: 'interactive system design interview mock problems' },
    ];
  }

  if (clean.includes('react') || clean.includes('frontend') || clean.includes('ui')) {
    return [
      { title: 'React 19 Hooks & Concurrency Patterns', type: 'Documentation', query: 'react 19 official documentation hooks state management' },
      { title: 'Web Audio API & MediaStream Implementation', type: 'Article', query: 'MDN Web Audio API MediaRecorder userMedia' },
      { title: 'Frontend Accessibility (a11y) & Performance Audits', type: 'Practice', query: 'web accessibility WCAG performance optimization' },
    ];
  }

  if (clean.includes('node') || clean.includes('backend') || clean.includes('api')) {
    return [
      { title: 'Production Express & Node.js Error Handling', type: 'Documentation', query: 'nodejs production error handling streaming best practices' },
      { title: 'RESTful API Design & Contract Testing', type: 'Article', query: 'REST API design idempotency status codes' },
      { title: 'Handling File Uploads and Streaming Buffers Safely', type: 'Practice', query: 'multer streaming memory storage nodejs security' },
    ];
  }

  // Default fallback resources
  return [
    { title: `${topic} Technical Deep Dive & Core Concepts`, type: 'Documentation', query: `${topic} core concepts interview guide` },
    { title: 'Common Interview Questions & Failure Modes', type: 'Article', query: `${topic} common interview pitfalls trade-offs` },
    { title: 'Hands-on Practice Problems & Scenarios', type: 'Practice', query: `${topic} real world scenario interview practice` },
  ];
}
