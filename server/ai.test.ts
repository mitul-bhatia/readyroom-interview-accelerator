import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, groqJSON, interviewTurn, reportInterview, startInterview, transcribe } from './ai';
import type { Turn } from '../shared/types';

test('the live AI flow carries document and answer context through all three levels', async () => {
  const originalFetch = globalThis.fetch;
  const calls: { url: string; body: unknown }[] = [];
  let chatCount = 0;
  const outputs = [
    { role: { title: 'Product Engineer Intern', summary: 'Build AI tools.', responsibilities: ['Build UI'], requiredSkills: ['React', 'Node.js', 'Evaluation'], preferredSkills: ['Speech'], technicalCompetencies: ['APIs'], behaviouralCompetencies: ['Communication'], experience: 'Projects accepted', qualifications: ['Student'], keywords: ['React'], concepts: ['Evaluation'] }, candidate: { name: 'Aarav', summary: 'Frontend projects.', skills: ['React'], experience: ['Internship'], projects: ['CampusPath app'], achievements: ['Pilot'], strengths: ['Built UI'], weakAreas: ['Evaluation'], claimsToProbe: ['18% improvement'], preparation: ['Metrics'] }, fitItems: [{ skill: 'React', status: 'strong', evidence: 'CampusPath app' }, { skill: 'Node.js', status: 'partial', evidence: 'Listed on resume' }, { skill: 'Evaluation', status: 'missing', evidence: 'No method described' }], fitExplanation: 'Evidence for one required skill.' },
    { question: { text: 'What did you build in CampusPath?', focus: 'Ownership' } },
    ...Array.from({ length: 6 }, (_, index) => ({ feedback: { score: 70 + index, assessment: 'Relevant but needs detail.', good: 'Named the project.', improve: 'Explain the metric.', idealDirection: 'State baseline and result.', competencies: ['Communication'] }, nextQuestion: index < 5 ? { text: `Follow up ${index + 2}: how did you verify that?`, focus: 'Evidence' } : undefined })),
    { summary: 'Clear ownership; improve evaluation detail.', competencies: { 'Technical Knowledge': 76, 'Problem Solving': 74, Communication: 80, Confidence: 70, 'Depth of Understanding': 69, 'Behavioural Fit': 78 }, strengths: ['Explained CampusPath ownership.'], weaknesses: ['Could not explain the 18% metric.'], gaps: [{ topic: 'Evaluation', why: 'The JD asks for output quality.', review: ['Baseline', 'Test set'] }] },
  ];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const body = init?.body && typeof init.body === 'string' ? JSON.parse(init.body) : init?.body;
    calls.push({ url, body });
    if (url.includes('/audio/transcriptions')) return new Response(JSON.stringify({ text: 'I built the interface and measured the pilot.' }), { status: 200 });
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(outputs[chatCount++]) } }] }), { status: 200 });
  };
  try {
    const jd = 'Build React and Node.js interfaces and evaluate LLM quality for students. '.repeat(3);
    const resume = 'Aarav built CampusPath using React. He claims an 18% improvement. '.repeat(3);
    const analysis = await analyze('test-key', jd, resume);
    assert.equal(analysis.fit.score, 50);
    let question = await startInterview('test-key', analysis);
    const turns: Turn[] = [];
    for (let index = 0; index < 6; index++) {
      const answer = `Answer ${index + 1}: I built the interface and tested it with students.`;
      const result = await interviewTurn('test-key', analysis, turns, question, answer);
      turns.push({ question, answer, feedback: result.feedback, answerSource: 'typed' });
      if (result.nextQuestion) question = result.nextQuestion;
      else assert.equal(index, 5);
    }
    assert.deepEqual(turns.map(turn => turn.question.level), ['screening', 'screening', 'competency', 'competency', 'deep-dive', 'deep-dive']);
    const thirdTurnPrompt = (calls[4].body as { messages: { content: string }[] }).messages[1].content;
    assert.match(thirdTurnPrompt, /Answer 2:/);
    assert.match(thirdTurnPrompt, /CampusPath/);
    const report = await reportInterview('test-key', analysis, turns);
    assert.equal(report.turns.length, 6);
    assert.equal(report.fitScore, 50);
    assert.equal(report.gaps[0].topic, 'Evaluation');
    const transcript = await transcribe('test-key', { buffer: Buffer.from('audio'), mimetype: 'audio/webm', originalname: 'answer.webm' } as Express.Multer.File);
    assert.match(transcript, /interface/);
    assert.equal(calls.filter(call => call.url.includes('/chat/completions')).length, 9);
  } finally { globalThis.fetch = originalFetch; }
});

test('a short Groq rate limit is retried without losing the live response', async () => {
  const originalFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts++;
    if (attempts === 1) return new Response('{"error":{"message":"Rate limit reached"}}', { status: 429, headers: { 'retry-after': '0' } });
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), { status: 200 });
  };
  try {
    const result = await groqJSON<{ ok: boolean }>('test-key', 'Answer in JSON.', 'Say ok.');
    assert.deepEqual(result, { ok: true });
    assert.equal(attempts, 2);
  } finally { globalThis.fetch = originalFetch; }
});

test('multi-key failover switches to the backup key if the primary key fails or rate-limits', async () => {
  const originalFetch = globalThis.fetch;
  const usedKeys: string[] = [];
  globalThis.fetch = async (_url, init) => {
    const auth = (init?.headers as Record<string, string>)?.Authorization || '';
    usedKeys.push(auth);
    if (auth.includes('key1')) return new Response('{"error":{"message":"Key 1 quota exceeded"}}', { status: 429 });
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"status":"success"}' } }] }), { status: 200 });
  };
  try {
    const result = await groqJSON<{ status: string }>('key1, key2', 'Prompt', 'Message');
    assert.deepEqual(result, { status: 'success' });
    assert.deepEqual(usedKeys, ['Bearer key1', 'Bearer key2']);
  } finally { globalThis.fetch = originalFetch; }
});

