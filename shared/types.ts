export type Level = 'screening' | 'competency' | 'deep-dive';
export type Mode = 'live';

export interface RoleAnalysis {
  title: string;
  summary: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  technicalCompetencies: string[];
  behaviouralCompetencies: string[];
  experience: string;
  qualifications: string[];
  keywords: string[];
  concepts: string[];
}

export interface CandidateAnalysis {
  name: string;
  summary: string;
  skills: string[];
  experience: string[];
  projects: string[];
  achievements: string[];
  strengths: string[];
  weakAreas: string[];
  claimsToProbe: string[];
  preparation: string[];
}

export interface FitItem {
  skill: string;
  evidence: string;
  status: 'strong' | 'partial' | 'missing';
}

export interface Analysis {
  role: RoleAnalysis;
  candidate: CandidateAnalysis;
  fit: { score: number; verdict: string; items: FitItem[]; explanation: string };
  mode: Mode;
}

export interface Question {
  text: string;
  level: Level;
  focus: string;
}

import type { SpeechMetrics, StarAnalysis, StudyResource } from './metrics.js';
export type { SpeechMetrics, StarAnalysis, StudyResource };

export interface PrepGap {
  priority: number;
  topic: string;
  why: string;
  review: string[];
  resources?: StudyResource[];
}

export interface DeliverySummary {
  avgWpm: number;
  totalFillers: number;
  voiceAnswersCount: number;
  paceRating: 'Too Slow' | 'Ideal Pace' | 'A Bit Fast' | 'Rushed';
  overallPaceAdvice: string;
}

export interface SessionComparison {
  previousScore: number;
  scoreDelta: number;
  deltaLabel: string;
}

export interface Feedback {
  score: number;
  assessment: string;
  good: string;
  improve: string;
  idealDirection: string;
  competencies: string[];
}

export interface Turn {
  question: Question;
  answer: string;
  feedback: Feedback;
  answerSource: 'voice' | 'typed';
  durationSeconds?: number;
  speechMetrics?: SpeechMetrics;
  starAnalysis?: StarAnalysis;
}

export interface Report {
  overallScore: number;
  readiness: 'Not Ready' | 'Needs Preparation' | 'Interview Ready' | 'Strong Candidate';
  summary: string;
  competencies: Record<'Role Fit' | 'Technical Knowledge' | 'Problem Solving' | 'Communication' | 'Confidence' | 'Depth of Understanding' | 'Behavioural Fit', number>;
  strengths: string[];
  weaknesses: string[];
  gaps: PrepGap[];
  turns: Turn[];
  fitScore: number;
  mode: Mode;
  roleTitle: string;
  candidateName: string;
  createdAt: string;
  deliverySummary?: DeliverySummary;
  comparison?: SessionComparison;
}

export interface SavedSession { id: string; report: Report; }

