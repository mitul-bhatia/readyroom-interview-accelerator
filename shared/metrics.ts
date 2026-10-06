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
  type: 'Search';
  query: string;
}

const COMMON_FILLERS = [
  'um', 'uh', 'erm', 'you know', 'sort of', 'kind of', 'i mean'
];

export function analyzeSpeech(text: string, durationSeconds: number): SpeechMetrics {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 3) throw new Error('A measured voice recording of at least three seconds is required for speaking metrics.');
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

  const duration = durationSeconds;
  const wpm = Math.round((wordCount / Math.max(duration, 3)) * 60);

  let paceRating: SpeechMetrics['paceRating'] = 'Ideal Pace';
  let paceAdvice = 'A conversational speaking pace based on the recorded answer.';

  if (wpm < 110) {
    paceRating = 'Too Slow';
    paceAdvice = 'This transcript suggests a slower pace. Try shorter pauses between points.';
  } else if (wpm <= 160) {
    paceRating = 'Ideal Pace';
    paceAdvice = 'This transcript suggests a conversational pace.';
  } else if (wpm <= 190) {
    paceRating = 'A Bit Fast';
    paceAdvice = 'Brisk speaking tempo. Pausing between points improves retention.';
  } else {
    paceRating = 'Rushed';
    paceAdvice = 'Rushed delivery (>190 WPM). Slow down slightly to emphasize key technical metrics.';
  }

  let deliveryTip = '';
  if (totalFillers === 0) {
    deliveryTip = 'No common fillers were found in this transcript. Transcription may omit spoken fillers.';
  } else if (totalFillers <= 2) {
    const names = detectedFillers.map(f => `"${f.word}"`).join(', ');
    deliveryTip = `${totalFillers} possible filler${totalFillers === 1 ? '' : 's'} in the transcript (${names}). A brief pause can help when choosing your next point.`;
  } else {
    const names = detectedFillers.slice(0, 3).map(f => `"${f.word}"`).join(', ');
    deliveryTip = `${totalFillers} possible fillers in the transcript (${names}). Practice silent pauses when forming thoughts.`;
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
  const hasResult = /\b(result|improved|reduced|increased|boosted|metric|outcome|impact)\b|\d+\s*%/i.test(lower);

  const elements = [hasSituation, hasTask, hasAction, hasResult].filter(Boolean).length;
  const starScore = elements * 25;

  let feedback = '';
  if (elements === 4) {
    feedback = 'The wording contains cues for all four STAR elements. Check that the result has clear evidence; this is a keyword-based writing aid.';
  } else if (!hasResult) {
    feedback = 'Add a concrete result, ideally with a metric and how you measured it.';
  } else if (!hasAction) {
    feedback = 'Explain your own action and the decision you made.';
  } else {
    feedback = 'Frame this using the STAR method: 1) Context, 2) Specific Task, 3) Your Exact Action, 4) Measurable Result.';
  }

  return { hasSituation, hasTask, hasAction, hasResult, starScore, feedback };
}

export function getStudyResources(topic: string): StudyResource[] {
  const clean = topic.toLowerCase();

  if (clean.includes('rag') || clean.includes('retrieval') || clean.includes('vector') || clean.includes('embedding')) {
    return [
      { title: 'RAG architecture and chunking', type: 'Search', query: 'RAG retrieval architecture chunking vector database' },
      { title: 'RAG evaluation and faithfulness', type: 'Search', query: 'RAG evaluation context precision recall faithfulness' },
      { title: 'Vector search and reranking', type: 'Search', query: 'production vector search reranking best practices' },
    ];
  }

  if (clean.includes('evaluation') || clean.includes('metric') || clean.includes('benchmark')) {
    return [
      { title: 'LLM evaluation datasets and metrics', type: 'Search', query: 'LLM evaluation test dataset ground truth metrics' },
      { title: 'Baselines and offline evaluation', type: 'Search', query: 'offline model evaluation baseline measurement' },
      { title: 'Edge-case test sets', type: 'Search', query: 'designing test sets for AI application reliability' },
    ];
  }

  if (clean.includes('system design') || clean.includes('architecture') || clean.includes('scale')) {
    return [
      { title: 'Caching, queues, and scaling', type: 'Search', query: 'system design primer caching queues microservices' },
      { title: 'Rate limits and resilient APIs', type: 'Search', query: 'API rate limiting retry backoff circuit breaker' },
      { title: 'System design practice prompts', type: 'Search', query: 'interactive system design interview mock problems' },
    ];
  }

  if (clean.includes('react') || clean.includes('frontend') || clean.includes('ui')) {
    return [
      { title: 'React state and hooks', type: 'Search', query: 'site:react.dev learn state hooks' },
      { title: 'Browser recording APIs', type: 'Search', query: 'site:developer.mozilla.org MediaRecorder getUserMedia' },
      { title: 'Accessibility and performance', type: 'Search', query: 'site:web.dev learn accessibility performance' },
    ];
  }

  if (clean.includes('node') || clean.includes('backend') || clean.includes('api')) {
    return [
      { title: 'Node.js error handling', type: 'Search', query: 'site:nodejs.org/api/errors.html error handling' },
      { title: 'API contracts and status codes', type: 'Search', query: 'REST API design idempotency status codes' },
      { title: 'Safe file upload handling', type: 'Search', query: 'multer streaming memory storage nodejs security' },
    ];
  }

  return [
    { title: `${topic}: core concepts`, type: 'Search', query: `${topic} core concepts interview guide` },
    { title: `${topic}: common tradeoffs`, type: 'Search', query: `${topic} common interview pitfalls trade-offs` },
    { title: `${topic}: practice scenarios`, type: 'Search', query: `${topic} real world scenario interview practice` },
  ];
}
