import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, levelForTurn, scoreFit } from './engine';
import type { Analysis, Turn } from '../shared/types';

const role = {
  title: 'Engineer', summary: '', responsibilities: [], requiredSkills: ['React', 'Node.js', 'LLM evaluation', 'Communication'],
  preferredSkills: [], technicalCompetencies: [], behaviouralCompetencies: [], experience: '', qualifications: [], keywords: [], concepts: [],
};

test('the interview enters each level for exactly two questions', () => {
  assert.deepEqual(Array.from({ length: 7 }, (_, index) => levelForTurn(index)), ['screening', 'screening', 'competency', 'competency', 'deep-dive', 'deep-dive', null]);
});

test('job fit uses resume evidence classifications, not an arbitrary model score', () => {
  const fit = scoreFit(role, [
    { skill: 'React', status: 'strong', evidence: 'Built a React app.' },
    { skill: 'Node.js', status: 'strong', evidence: 'Built a Node API.' },
    { skill: 'LLM evaluation', status: 'partial', evidence: 'Listed one small test.' },
  ]);
  assert.equal(fit.score, 63);
  assert.equal(fit.items[3].status, 'missing');
  assert.match(fit.items[3].evidence, /No clear evidence/);
});

test('readiness and overall score combine interview performance with job fit', () => {
  const analysis: Analysis = {
    role, candidate: { name: 'Aarav', summary: '', skills: [], experience: [], projects: [], achievements: [], strengths: [], weakAreas: [], claimsToProbe: [], preparation: [] },
    fit: { score: 50, verdict: 'Developing match', items: [], explanation: '' }, mode: 'live',
  };
  const turn = { question: { text: 'Why?', level: 'screening', focus: '' }, answer: 'A specific answer.', feedback: { score: 85, assessment: '', good: '', improve: '', idealDirection: '', competencies: [] }, answerSource: 'typed' } satisfies Turn;
  const report = buildReport(analysis, Array(6).fill(turn), { summary: 'Specific performance.', competencies: { 'Technical Knowledge': 90, 'Problem Solving': 85, Communication: 80, Confidence: 80, 'Depth of Understanding': 90, 'Behavioural Fit': 85 }, strengths: ['Clear project detail'], weaknesses: ['Limited deployment evidence'], gaps: [{ topic: 'Deployment', why: 'The role asks for it.', review: ['Release process'] }] });
  assert.equal(report.overallScore, 78);
  assert.equal(report.readiness, 'Interview Ready');
  assert.equal(report.competencies['Role Fit'], 50);
  assert.equal(report.gaps[0].priority, 1);
});
