import type { Analysis, Feedback, FitItem, Level, Question, Report, RoleAnalysis, Turn } from '../shared/types.js';

export const LEVELS: Level[] = ['screening', 'competency', 'deep-dive'];
export const MAX_TURNS = 6;

export function levelForTurn(index: number): Level | null {
  return LEVELS[Math.floor(index / 2)] ?? null;
}

export function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function asList(value: unknown, limit = 8): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && !!item.trim()).map(item => item.trim()).slice(0, limit)
    : [];
}

export function clampScore(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 0;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9+#]+/g, ' ').trim();

export function scoreFit(role: RoleAnalysis, supplied: FitItem[]) {
  const items = role.requiredSkills.map(skill => {
    const matched = supplied.find(item => normalize(item.skill) === normalize(skill));
    return {
      skill,
      status: matched?.status === 'strong' || matched?.status === 'partial' ? matched.status : 'missing' as const,
      evidence: asText(matched?.evidence, 'No clear evidence in the resume.'),
    };
  });
  const points = items.reduce((sum, item) => sum + (item.status === 'strong' ? 1 : item.status === 'partial' ? 0.5 : 0), 0);
  const score = items.length ? Math.round((points / items.length) * 100) : 0;
  return { score, items, verdict: score >= 80 ? 'Strong match' : score >= 60 ? 'Promising match' : score >= 40 ? 'Developing match' : 'Early match' };
}

export function normalizeQuestion(raw: unknown, level: Level): Question {
  const data = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    text: asText(data.text, 'Tell me about a project relevant to this role and the decisions you made.'),
    level,
    focus: asText(data.focus, 'Role evidence'),
  };
}

export function normalizeFeedback(raw: unknown): Feedback {
  const data = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    score: clampScore(data.score),
    assessment: asText(data.assessment, 'The answer needs clearer evidence.'),
    good: asText(data.good, 'You responded to the question.'),
    improve: asText(data.improve, 'Add a concrete example and explain your own contribution.'),
    idealDirection: asText(data.idealDirection, 'Describe the context, your action, the reason, and the result.'),
    competencies: asList(data.competencies, 3),
  };
}

type Narrative = {
  summary?: unknown;
  competencies?: unknown;
  strengths?: unknown;
  weaknesses?: unknown;
  gaps?: unknown;
};

const COMPETENCY_NAMES = ['Role Fit', 'Technical Knowledge', 'Problem Solving', 'Communication', 'Confidence', 'Depth of Understanding', 'Behavioural Fit'] as const;

export function buildReport(analysis: Analysis, turns: Turn[], raw: Narrative): Report {
  const provided = raw.competencies && typeof raw.competencies === 'object' ? raw.competencies as Record<string, unknown> : {};
  const average = turns.length ? Math.round(turns.reduce((sum, turn) => sum + turn.feedback.score, 0) / turns.length) : 0;
  const competencies = Object.fromEntries(COMPETENCY_NAMES.map(name => {
    if (name === 'Role Fit') return [name, analysis.fit.score];
    const modelRating = clampScore(provided[name] ?? average);
    return [name, Math.round(modelRating * 0.35 + average * 0.65)];
  })) as Report['competencies'];
  const interviewAverage = Math.round(COMPETENCY_NAMES.slice(1).reduce((sum, name) => sum + competencies[name], 0) / 6);
  const overallScore = Math.round(interviewAverage * 0.8 + analysis.fit.score * 0.2);
  const readiness = overallScore >= 85 && analysis.fit.score >= 75 ? 'Strong Candidate' : overallScore >= 70 ? 'Interview Ready' : overallScore >= 50 ? 'Needs Preparation' : 'Not Ready';
  const rawGaps = Array.isArray(raw.gaps) ? raw.gaps : [];
  const gaps = rawGaps.slice(0, 3).map((gap, index) => {
    const item = gap && typeof gap === 'object' ? gap as Record<string, unknown> : {};
    return { priority: index + 1, topic: asText(item.topic, `Preparation area ${index + 1}`), why: asText(item.why, 'This area needs stronger evidence.'), review: asList(item.review, 5) };
  });
  return {
    overallScore,
    readiness,
    summary: asText(raw.summary, 'Review the feedback below and practise the highest priority gaps.'),
    competencies,
    strengths: asList(raw.strengths, 6),
    weaknesses: asList(raw.weaknesses, 6),
    gaps,
    turns,
    fitScore: analysis.fit.score,
    mode: 'live',
    roleTitle: analysis.role.title,
    candidateName: analysis.candidate.name,
    createdAt: new Date().toISOString(),
  };
}
