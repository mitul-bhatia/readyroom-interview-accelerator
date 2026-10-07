import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';
import { analyze, interviewTurn, reportInterview, startInterview, transcribe } from './ai.js';
import type { Analysis, Question, Turn } from '../shared/types.js';
import { MAX_TURNS } from './engine.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 4 * 1024 * 1024 } });
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

function keyFrom(req: express.Request) {
  return req.header('x-groq-api-key')?.trim() || process.env.GROQ_API_KEY || '';
}

function requireKey(req: express.Request) {
  const key = keyFrom(req);
  if (!key) throw new Error('Add a Groq API key in Settings or configure GROQ_API_KEY on the server.');
  return key;
}

function requireDocuments(body: Record<string, unknown>) {
  const jd = typeof body.jd === 'string' ? body.jd.trim() : '';
  const resume = typeof body.resume === 'string' ? body.resume.trim() : '';
  if (jd.length < 120 || resume.length < 120) throw new Error('Add at least 120 characters of both the job description and resume.');
  if (jd.length > 22_000 || resume.length > 22_000) throw new Error('Each document must be under 22,000 characters.');
  return { jd, resume };
}

app.get('/api/index', (req, res) => {
  if (req.query.action === 'config') res.json({ serverKeyConfigured: !!process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b' });
  else res.status(404).json({ error: 'Unknown action.' });
});

app.post('/api/index', upload.single('file'), async (req, res) => {
  try {
    const action = String(req.query.action || '');
    if (action === 'parse') {
      if (!req.file) throw new Error('Choose a PDF, DOCX, or text file.');
      const name = req.file.originalname.toLowerCase();
      let value = '';
      if (name.endsWith('.pdf')) {
        const parser = new PDFParse({ data: new Uint8Array(req.file.buffer) });
        try { value = (await parser.getText()).text; }
        finally { await parser.destroy(); }
      }
      else if (name.endsWith('.docx')) value = (await mammoth.extractRawText({ buffer: req.file.buffer })).value;
      else if (name.endsWith('.txt') || name.endsWith('.md')) value = req.file.buffer.toString('utf8');
      else throw new Error('Use a PDF, DOCX, TXT, or MD file.');
      value = value.replace(/\s{3,}/g, '\n\n').trim();
      if (value.length < 120) throw new Error('This file has too little readable text. Try pasting its content.');
      res.json({ text: value.slice(0, 22_000) });
      return;
    }
    if (action === 'transcribe') {
      if (!req.file) throw new Error('Record an answer first.');
      const text = await transcribe(requireKey(req), req.file);
      if (!text) throw new Error('No speech was detected. Try recording again or type your answer.');
      res.json({ text });
      return;
    }
    const body = req.body as Record<string, unknown>;
    if (action === 'analyze') {
      const { jd, resume } = requireDocuments(body);
      res.json(await analyze(requireKey(req), jd, resume));
      return;
    }
    const analysis = body.analysis as Analysis | undefined;
    if (!analysis?.role?.title || !analysis?.candidate?.name || !analysis.fit) throw new Error('Run document analysis first.');
    if (action === 'start') {
      res.json({ question: await startInterview(requireKey(req), analysis) });
      return;
    }
    const turns = Array.isArray(body.turns) ? body.turns as Turn[] : [];
    if (action === 'turn') {
      const question = body.question as Question;
      const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
      if (!question?.text || answer.length < 12) throw new Error('Add a fuller answer before continuing.');
      if (turns.length >= MAX_TURNS) throw new Error('The interview is complete. Generate the report.');
      res.json(await interviewTurn(requireKey(req), analysis, turns, question, answer));
      return;
    }
    if (action === 'report') {
      if (turns.length !== MAX_TURNS) throw new Error('Complete all six answers before generating the report.');
      res.json(await reportInterview(requireKey(req), analysis, turns));
      return;
    }
    res.status(404).json({ error: 'Unknown action.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Something went wrong.';
    res.status(message.includes('Groq') || message.includes('Transcription') ? 502 : 400).json({ error: message });
  }
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(400).json({ error: error instanceof multer.MulterError ? 'File is too large. Use a file under 4 MB.' : error.message });
});

export default app;
