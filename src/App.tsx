import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, AudioLines, BriefcaseBusiness, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Download, ExternalLink, FileText, Gauge, Lightbulb, Mic, MicOff, Play, Plus, RotateCcw, ShieldCheck, Sparkles, Square, TrendingUp, UploadCloud, Video, VideoOff, Volume2, X, Zap } from 'lucide-react';
import type { Analysis, Question, Report, SavedSession, Turn } from '../shared/types';
import { sampleJD, sampleResume } from '../shared/sample';
import { analyzeSpeech, analyzeStarStructure } from '../shared/metrics';

type View = 'setup' | 'analysis' | 'interview' | 'report';
type DocKind = 'jd' | 'resume';

const LEVEL_LABELS = { screening: 'Screening', competency: 'Competency', 'deep-dive': 'Deep dive' };
const LEVEL_DETAILS = { screening: 'Your story & motivation', competency: 'Applied skills & decisions', 'deep-dive': 'Tradeoffs & real scenarios' };
const scoreColor = (score: number) => score >= 75 ? 'good' : score >= 50 ? 'mid' : 'low';

async function api<T>(action: string, payload: object | FormData | undefined, key: string): Promise<T> {
  const isForm = payload instanceof FormData;
  const response = await fetch(`/api/index?action=${action}`, {
    method: payload ? 'POST' : 'GET',
    headers: { ...(key ? { 'x-groq-api-key': key } : {}), ...(!isForm && payload ? { 'Content-Type': 'application/json' } : {}) },
    body: payload ? isForm ? payload : JSON.stringify(payload) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data as T;
}

function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.94;
  utterance.pitch = 1.02;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find(voice => voice.lang.startsWith('en') && /samantha|aria|jenny|google uk/i.test(voice.name)) || voices.find(voice => voice.lang.startsWith('en')) || null;
  window.speechSynthesis.speak(utterance);
}

function Badge({ children, kind = '' }: { children: React.ReactNode; kind?: string }) { return <span className={`badge ${kind}`}>{children}</span>; }
function TagList({ items, empty = 'Not stated in the document' }: { items: string[]; empty?: string }) { return items.length ? <div className="tags">{items.map((item, i) => <span className="tag" key={`${item}-${i}`}>{item}</span>)}</div> : <p className="muted">{empty}</p>; }
function BulletList({ items }: { items: string[] }) { return items.length ? <ul className="plain-list">{items.map((item, i) => <li key={`${item}-${i}`}>{item}</li>)}</ul> : <p className="muted">Not stated in the document.</p>; }

export default function App() {
  const [view, setView] = useState<View>('setup');
  const [jd, setJd] = useState('');
  const [resume, setResume] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'role' | 'candidate'>('role');
  const [question, setQuestion] = useState<Question | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [answer, setAnswer] = useState('');
  const [answerSource, setAnswerSource] = useState<'voice' | 'typed'>('typed');
  const [answerDuration, setAnswerDuration] = useState<number | undefined>();
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<SavedSession[]>(() => {
    try { return JSON.parse(localStorage.getItem('readyroom-history') || '[]') as SavedSession[]; } catch { return []; }
  });
  const [key, setKey] = useState('');
  const [serverKey, setServerKey] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const micStream = useRef<MediaStream | null>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recordStart = useRef(0);

  useEffect(() => { api<{ serverKeyConfigured: boolean }>('config', undefined, '').then(data => setServerKey(data.serverKeyConfigured)).catch(() => {}); }, []);
  useEffect(() => { localStorage.setItem('readyroom-history', JSON.stringify(history.slice(0, 8))); }, [history]);
  useEffect(() => { if (cameraOn && videoRef.current && cameraStream.current) videoRef.current.srcObject = cameraStream.current; }, [cameraOn]);
  useEffect(() => () => { window.speechSynthesis?.cancel(); micStream.current?.getTracks().forEach(track => track.stop()); cameraStream.current?.getTracks().forEach(track => track.stop()); }, []);

  const connected = serverKey || !!key.trim();
  const clearError = () => setError('');
  const run = async (label: string, action: () => Promise<void>) => {
    setBusy(label); clearError();
    try { await action(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(''); }
  };

  const parseFile = (kind: DocKind, file?: File) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError('Use a file under 4 MB, or paste its text.'); return; }
    void run(`Reading ${kind === 'jd' ? 'job description' : 'resume'}…`, async () => {
      const form = new FormData(); form.append('file', file);
      const data = await api<{ text: string }>('parse', form, key);
      (kind === 'jd' ? setJd : setResume)(data.text);
    });
  };

  const analyzeDocuments = () => void run('Analysing your documents…', async () => {
    if (!connected) { setSettingsOpen(true); throw new Error('Connect Groq to run a live analysis.'); }
    const result = await api<Analysis>('analyze', { jd, resume }, key);
    setAnalysis(result); setTurns([]); setQuestion(null); setReport(null); setActiveAnalysisTab('role'); setView('analysis'); window.scrollTo(0, 0);
  });

  const start = () => void run('Preparing your interviewer…', async () => {
    if (!analysis) return;
    const result = await api<{ question: Question }>('start', { analysis }, key);
    setQuestion(result.question); setTurns([]); setAnswer(''); setShowFeedback(false); setView('interview'); window.scrollTo(0, 0); speak(result.question.text);
  });

  const submitAnswer = () => void run('Evaluating your answer…', async () => {
    if (!analysis || !question || answer.trim().length < 12) throw new Error('Give a fuller answer before continuing.');
    const result = await api<{ feedback: Turn['feedback']; nextQuestion: Question | null }>('turn', { analysis, turns, question, answer: answer.trim() }, key);
    const speechMetrics = answerSource === 'voice' && answerDuration && answerDuration >= 3
      ? analyzeSpeech(answer.trim(), answerDuration) : undefined;
    const starAnalysis = analyzeStarStructure(answer.trim());
    const nextTurns: Turn[] = [...turns, {
      question,
      answer: answer.trim(),
      feedback: result.feedback,
      answerSource,
      durationSeconds: answerDuration,
      speechMetrics,
      starAnalysis,
    }];
    setTurns(nextTurns); setAnswer(''); setAnswerSource('typed'); setAnswerDuration(undefined); setQuestion(result.nextQuestion); setShowFeedback(true);
    window.speechSynthesis?.cancel();
  });

  const nextQuestion = () => { setShowFeedback(false); if (question) speak(question.text); };

  const generateReport = () => void run('Writing your performance report…', async () => {
    if (!analysis) return;
    const result = await api<Report>('report', { analysis, turns }, key);
    const prev = history.find(h => h.report.roleTitle.toLowerCase() === analysis.role.title.toLowerCase()
      && h.report.candidateName.toLowerCase() === analysis.candidate.name.toLowerCase());
    if (prev && prev.report) {
      const delta = result.overallScore - prev.report.overallScore;
      result.comparison = {
        previousScore: prev.report.overallScore,
        scoreDelta: delta,
        deltaLabel: delta > 0 ? `+${delta} points from last session` : delta === 0 ? 'Same score as last session' : `${delta} points from last session`,
      };
    }
    setReport(result); setView('report'); setShowFeedback(false); window.scrollTo(0, 0);
    setHistory(previous => [{ id: crypto.randomUUID(), report: result }, ...previous].slice(0, 8));
  });

  const startRecording = async () => {
    clearError();
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Microphone recording is unavailable in this browser. Use a recent Chrome or Edge browser.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.current = stream;
      const preferred = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(stream, preferred ? { mimeType: preferred } : undefined);
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
        const seconds = Math.max(1, Math.round((Date.now() - recordStart.current) / 1000));
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (blob.size > 4 * 1024 * 1024) { setError('This recording is too large. Try a shorter answer or type it.'); return; }
        void run('Transcribing your answer…', async () => {
          const form = new FormData(); form.append('file', blob, blob.type.includes('mp4') ? 'answer.mp4' : 'answer.webm');
          const data = await api<{ text: string }>('transcribe', form, key);
          setAnswer(data.text); setAnswerSource('voice'); setAnswerDuration(seconds);
        });
      };
      recorder.current = mediaRecorder; recordStart.current = Date.now(); mediaRecorder.start(); setRecording(true); window.speechSynthesis?.cancel();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Microphone access failed.'); }
  };

  const stopRecording = () => { if (recorder.current?.state === 'recording') recorder.current.stop(); };

  const toggleCamera = async () => {
    if (cameraOn) { cameraStream.current?.getTracks().forEach(track => track.stop()); cameraStream.current = null; setCameraOn(false); return; }
    try { cameraStream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }); setCameraOn(true); }
    catch { setError('Camera access was denied. You can continue with voice or text.'); }
  };

  const reset = () => { window.speechSynthesis?.cancel(); cameraStream.current?.getTracks().forEach(track => track.stop()); setCameraOn(false); setAnalysis(null); setQuestion(null); setTurns([]); setReport(null); setAnswer(''); setView('setup'); clearError(); window.scrollTo(0, 0); };

  const latestTurn = turns.at(-1);

  return <div className={`app-shell ${view === 'interview' ? 'interview-shell' : ''}`}>
    <header className="topbar">
      <button className="brand" onClick={reset} aria-label="Readyroom home"><span className="brand-mark"><AudioLines size={19} strokeWidth={2.5} /></span><span>readyroom<span className="brand-dot">.</span></span></button>
      <div className="topbar-right"><span className="header-caption">Practice with purpose.</span><Badge kind={connected ? 'connected' : 'unconnected'}><span className="status-dot" />{connected ? 'Groq connected' : 'Connect Groq'}</Badge><button className="icon-button settings-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><CircleHelp size={19} /></button></div>
    </header>

    {view !== 'interview' && <nav className="step-nav" aria-label="Progress"><div className="step-nav-inner">{(['setup', 'analysis', 'interview', 'report'] as const).map((step, index) => <div key={step} className={`step ${view === step ? 'active' : ''} ${(['setup', 'analysis', 'interview', 'report'] as const).indexOf(view) > index ? 'done' : ''}`}><span className="step-number">{index + 1}</span><span>{step === 'setup' ? 'Your documents' : step === 'analysis' ? 'The opportunity' : step === 'interview' ? 'Practice interview' : 'Your report'}</span></div>)}</div></nav>}

    <main>
      {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={clearError} aria-label="Dismiss error"><X size={18} /></button></div>}
      {busy && <div className="busy-banner" role="status"><span className="spinner" />{busy}</div>}

      {view === 'setup' && <div className="page setup-page">
        <section className="intro-grid"><div className="intro-copy"><h1>Walk in ready<span className="period">.</span></h1><p>Practice the interview for the job you actually want. Add the role and your resume; we’ll find the overlap, ask the right questions, and show you what to work on.</p><div className="intro-points"><span><CheckCircle2 size={17} /> Grounded in your documents</span><span><CheckCircle2 size={17} /> Voice-first practice</span><span><CheckCircle2 size={17} /> Actionable feedback</span></div></div><div className="intro-aside"><div className="aside-top"><span className="aside-icon"><Sparkles size={20} /></span><span>How it works</span></div><div className="aside-flow"><div><span>01</span><p>Understand the role and where you stand.</p></div><div><span>02</span><p>Move through three adaptive interview levels.</p></div><div><span>03</span><p>Leave with a clear preparation plan.</p></div></div></div></section>
        <div className="section-heading-row"><div><h2>Start with the evidence</h2><p>Paste text or upload PDF, DOCX, TXT, or MD files under 4 MB.</p></div><button className="text-button" onClick={() => { setJd(sampleJD); setResume(sampleResume); clearError(); }}><Sparkles size={16} /> Fill example documents</button></div>
        <div className="document-grid"><DocumentPanel kind="jd" title="Job description" subtitle="What the employer is asking for" value={jd} onChange={setJd} onFile={file => parseFile('jd', file)} /><DocumentPanel kind="resume" title="Your resume" subtitle="The experience you bring" value={resume} onChange={setResume} onFile={file => parseFile('resume', file)} /></div>
        <div className="setup-action"><div><ShieldCheck size={19} /><span>Documents are analysed for this session. Reports stay in this browser.</span></div><button className="button primary" disabled={!!busy || jd.trim().length < 120 || resume.trim().length < 120} onClick={analyzeDocuments}>Analyse my fit <ArrowRight size={18} /></button></div>
        {history.length > 0 && <section className="history-section"><div className="section-heading-row"><div><h2>Past practice</h2><p>Your recent reports, saved on this device.</p></div></div><div className="history-list">{history.map(item => <button key={item.id} onClick={() => { setReport(item.report); setView('report'); window.scrollTo(0, 0); }}><div><strong>{item.report.roleTitle}</strong><span>{new Date(item.report.createdAt).toLocaleDateString()}</span></div><div><b>{item.report.overallScore}/100</b><ArrowRight size={18} /></div></button>)}</div></section>}
      </div>}

      {view === 'analysis' && analysis && <div className="page analysis-page"><div className="page-title-row"><div><button className="back-link" onClick={() => setView('setup')}><ArrowLeft size={16} /> Edit documents</button><h1>The opportunity, decoded<span className="period">.</span></h1><p>Here’s what the role calls for and the evidence your resume brings.</p></div><button className="button primary desktop-start" disabled={!!busy} onClick={start}>Start interview <ArrowRight size={18} /></button></div>
        <div className="analysis-hero"><div className="role-identity"><div className="mini-label"><BriefcaseBusiness size={15} /> Target role</div><h2>{analysis.role.title}</h2><p>{analysis.role.summary}</p></div><div className="fit-summary"><div><span className="fit-number">{analysis.fit.score}<small>%</small></span><Badge kind={scoreColor(analysis.fit.score)}>{analysis.fit.verdict}</Badge></div><p>Job fit based on required skills with evidence in your resume.</p><div className="fit-bar"><span style={{ width: `${analysis.fit.score}%` }} /></div></div></div>
        <div className="analysis-tabs" role="tablist"><button role="tab" aria-selected={activeAnalysisTab === 'role'} className={activeAnalysisTab === 'role' ? 'selected' : ''} onClick={() => setActiveAnalysisTab('role')}>Understand the role</button><button role="tab" aria-selected={activeAnalysisTab === 'candidate'} className={activeAnalysisTab === 'candidate' ? 'selected' : ''} onClick={() => setActiveAnalysisTab('candidate')}>Understand your fit</button></div>
        {activeAnalysisTab === 'role' ? <div className="analysis-content"><section className="content-main"><div className="section-block"><h3>What you’d do</h3><BulletList items={analysis.role.responsibilities} /></div><div className="section-block"><h3>Required skills</h3><TagList items={analysis.role.requiredSkills} /></div><div className="section-block"><h3>Preferred skills</h3><TagList items={analysis.role.preferredSkills} /></div><div className="section-block"><h3>Qualifications & experience</h3><p>{analysis.role.experience}</p><BulletList items={analysis.role.qualifications} /></div></section><aside className="content-side"><div className="side-section"><h3>Technical competencies</h3><TagList items={analysis.role.technicalCompetencies} /></div><div className="side-section"><h3>Behavioural competencies</h3><TagList items={analysis.role.behaviouralCompetencies} /></div><div className="side-section"><h3>Concepts to know</h3><TagList items={analysis.role.concepts} /></div><div className="side-section"><h3>Keywords</h3><TagList items={analysis.role.keywords} /></div></aside></div> : <div className="analysis-content"><section className="content-main"><div className="section-block"><h3>Skill-by-skill match</h3><p className="section-intro">Strong means your resume shows applied evidence. Partial means the evidence is limited or only listed.</p><div className="fit-items">{analysis.fit.items.map((item, index) => <div key={`${item.skill}-${index}`} className="fit-item"><span className={`match-icon ${item.status}`}>{item.status === 'strong' ? <Check size={15} /> : item.status === 'partial' ? '½' : '—'}</span><div><strong>{item.skill}</strong><p>{item.evidence}</p></div><Badge kind={item.status}>{item.status}</Badge></div>)}</div></div><div className="section-block"><h3>Relevant experience</h3><BulletList items={analysis.candidate.experience} /></div><div className="section-block"><h3>Projects & achievements</h3><BulletList items={[...analysis.candidate.projects, ...analysis.candidate.achievements]} /></div></section><aside className="content-side"><div className="side-section"><h3>Your strengths</h3><BulletList items={analysis.candidate.strengths} /></div><div className="side-section"><h3>Areas to prepare</h3><BulletList items={[...analysis.candidate.weakAreas, ...analysis.candidate.preparation]} /></div><div className="side-section"><h3>Claims an interviewer may probe</h3><BulletList items={analysis.candidate.claimsToProbe} /></div><div className="side-section"><h3>Skills on your resume</h3><TagList items={analysis.candidate.skills} /></div></aside></div>}
        <div className="analysis-footer"><div><Lightbulb size={18} /><span>{analysis.fit.explanation}</span></div><button className="button primary" disabled={!!busy} onClick={start}>Start your interview <ArrowRight size={18} /></button></div>
      </div>}

      {view === 'interview' && analysis && <div className="interview-page"><div className="interview-topline"><button className="back-link" onClick={() => { window.speechSynthesis?.cancel(); setView('analysis'); }}><ArrowLeft size={16} /> Back to analysis</button><span><span className="live-dot" /> Live practice · {analysis.role.title}</span><span>{Math.min(turns.length + 1, 6)} of 6 questions</span></div>
        <div className="interview-layout"><section className="interview-stage"><div className="stage-progress">{[0, 1, 2].map(index => <div key={index} className={(turns.length / 2 >= index + 1 ? 'complete' : Math.floor(turns.length / 2) === index ? 'current' : '')}><span>{index + 1}</span><div><strong>{LEVEL_LABELS[(['screening', 'competency', 'deep-dive'] as const)[index]]}</strong><small>{LEVEL_DETAILS[(['screening', 'competency', 'deep-dive'] as const)[index]]}</small></div></div>)}</div>
          <div className="interviewer-panel"><div className="interviewer-visual"><div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" /><div className="interviewer-core"><AudioLines size={44} strokeWidth={1.5} /></div></div><div className="interviewer-label"><span className="live-dot" /> AI interviewer</div>{question && !showFeedback ? <><h1>{question.text}</h1><div className="question-meta"><Badge kind="dark">{LEVEL_LABELS[question.level]}</Badge><span>Focus: {question.focus}</span></div><button className="listen-button" onClick={() => speak(question.text)}><Volume2 size={17} /> Hear question again</button></> : <><h1>{latestTurn ? 'Good work. Take a breath.' : 'Interview complete.'}</h1><p className="stage-caption">Review your response before moving on.</p></>}</div>
          <div className="camera-area">{cameraOn ? <video ref={videoRef} autoPlay muted playsInline /> : <div className="camera-placeholder"><VideoOff size={22} /><span>Camera off</span></div>}<button className="camera-toggle" onClick={toggleCamera}>{cameraOn ? <><VideoOff size={16} /> Turn camera off</> : <><Video size={16} /> Turn camera on</>}</button><span>Camera preview is optional and never scored.</span></div>
        </section><aside className="answer-panel">{showFeedback && latestTurn ? <><div className="panel-header"><div><span className="panel-overline">Your answer</span><h2>Quick feedback</h2></div><span className={`feedback-score ${scoreColor(latestTurn.feedback.score)}`}>{latestTurn.feedback.score}<small>/100</small></span></div><div className="feedback-body"><p className="feedback-assessment">{latestTurn.feedback.assessment}</p>
          {latestTurn.speechMetrics && <div className="delivery-badge-row">
            <span className={`metric-pill ${latestTurn.speechMetrics.paceRating === 'Ideal Pace' ? 'ideal' : 'warn'}`}>
              <Gauge size={13} /> {latestTurn.speechMetrics.wpm} WPM ({latestTurn.speechMetrics.paceRating})
            </span>
            <span className={`metric-pill ${latestTurn.speechMetrics.totalFillers === 0 ? 'ideal' : 'warn'}`}>
              <Zap size={13} /> {latestTurn.speechMetrics.totalFillers === 0 ? '0 Fillers' : `${latestTurn.speechMetrics.totalFillers} Fillers`}
            </span>
          </div>}
          {latestTurn.starAnalysis && <div className="star-container">
            <div className="star-container-head">
              <strong>STAR writing cues</strong>
              <span>{latestTurn.starAnalysis.starScore}% of cues found</span>
            </div>
            <div className="star-badge-row">
              <span className={`star-pill ${latestTurn.starAnalysis.hasSituation ? 'active' : ''}`}>S · Context</span>
              <span className={`star-pill ${latestTurn.starAnalysis.hasTask ? 'active' : ''}`}>T · Task</span>
              <span className={`star-pill ${latestTurn.starAnalysis.hasAction ? 'active' : ''}`}>A · Action</span>
              <span className={`star-pill ${latestTurn.starAnalysis.hasResult ? 'active' : ''}`}>R · Result</span>
            </div>
            <p className="star-feedback">{latestTurn.starAnalysis.feedback}</p>
          </div>}
          {latestTurn.speechMetrics?.deliveryTip && <div className="delivery-tip-box">
            <strong>Delivery signal:</strong> {latestTurn.speechMetrics.deliveryTip}
          </div>}
          <div><strong>What worked</strong><p>{latestTurn.feedback.good}</p></div>
          <div><strong>Try next time</strong><p>{latestTurn.feedback.improve}</p></div>
        </div>
        <div className="panel-bottom">{question ? <button className="button primary full" onClick={nextQuestion}>Next question <ArrowRight size={18} /></button> : <button className="button primary full" disabled={!!busy} onClick={generateReport}>See my report <ArrowRight size={18} /></button>}</div></> : <><div className="panel-header"><div><span className="panel-overline">Your turn</span><h2>Answer out loud</h2></div><span className="answer-hint">Voice or text</span></div><p className="answer-description">Speak naturally. Your answer will appear below so you can review it before submitting.</p><div className="record-control"><button className={`record-button ${recording ? 'recording' : ''}`} disabled={!!busy} onClick={recording ? stopRecording : startRecording}>{recording ? <Square size={25} fill="currentColor" /> : <Mic size={29} />}</button><div><strong>{recording ? 'Recording…' : busy.includes('Transcribing') ? 'Transcribing…' : 'Tap to record'}{recording && <span className="recording-wave"><span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" /><span className="wave-bar" /></span>}</strong><span>{recording ? 'Tap the square when you finish' : 'Microphone access is requested only when you record'}</span></div></div><div className="answer-divider"><span>or type your answer</span></div><label className="answer-label" htmlFor="answer-text">Answer transcript</label><textarea id="answer-text" className="answer-textarea" value={answer} onChange={event => setAnswer(event.target.value)} placeholder="Your answer will appear here after recording. You can edit it before submitting." /><div className="answer-count">{answer.trim().length} characters · {answerSource === 'voice' ? 'recorded answer, transcript editable' : 'typed answer'}</div><div className="panel-bottom"><button className="button primary full" disabled={!!busy || recording || answer.trim().length < 12} onClick={submitAnswer}>Submit answer <ArrowRight size={18} /></button><p>We assess the content of your answer, not your camera image.</p></div></>}</aside></div>
        <div className="transcript-row"><div><Clock3 size={17} /><span>Conversation so far</span></div><span>{turns.length} answered</span></div>{turns.length > 0 && <div className="transcript-list">{turns.map((turn, index) => <details key={index}><summary><span>{String(index + 1).padStart(2, '0')}</span><strong>{turn.question.text}</strong><ChevronDown size={17} /></summary><div><p>{turn.answer}</p><small>{turn.answerSource === 'voice' ? `Voice${turn.durationSeconds ? ` · ${turn.durationSeconds}s` : ''}` : 'Typed'} · Score {turn.feedback.score}/100</small></div></details>)}</div>}
      </div>}

      {view === 'report' && report && <div className="page report-page"><div className="page-title-row report-title"><div><button className="back-link" onClick={reset}><ArrowLeft size={16} /> New practice session</button><h1>Your interview, in focus<span className="period">.</span></h1><p>{report.roleTitle} · {new Date(report.createdAt).toLocaleDateString()}</p></div><button className="button secondary" onClick={() => window.print()}><Download size={17} /> Save as PDF</button></div>
        {report.comparison && <div className="comparison-banner"><TrendingUp size={18} /><span><strong>Progress Comparison:</strong> Previous session was {report.comparison.previousScore}/100 → Current score is {report.overallScore}/100 ({report.comparison.deltaLabel})</span></div>}
        <div className="report-hero"><div><span className="mini-label">Interview readiness</span><h2>{report.readiness}</h2><p>{report.summary}</p><Badge kind="connected">Live AI evaluation</Badge></div><div className="report-score"><span>{report.overallScore}</span><small>/ 100</small><p>Overall score</p></div></div>
        {report.deliverySummary && <div className="delivery-summary-hero">
          <div className="delivery-metric-box">
            <span>Average Speaking Pace</span>
            <b>{report.deliverySummary.avgWpm} <small style={{ fontSize: '13px', fontWeight: 500 }}>WPM</small></b>
            <p>{report.deliverySummary.paceRating}: {report.deliverySummary.overallPaceAdvice}</p>
          </div>
          <div className="delivery-metric-box">
            <span>Possible Fillers in Voice Transcripts</span>
            <b>{report.deliverySummary.totalFillers}</b>
            <p>{report.deliverySummary.totalFillers === 0 ? 'No common fillers found; transcription may omit spoken fillers.' : `${report.deliverySummary.totalFillers} possible fillers found in recorded answers.`}</p>
          </div>
          <div className="delivery-metric-box">
            <span>Voice Response Ratio</span>
            <b>{report.deliverySummary.voiceAnswersCount} / {report.turns.length}</b>
            <p>Voice answers tested live with Whisper speech-to-text.</p>
          </div>
        </div>}
        <div className="score-method"><CircleHelp size={16} /><p>Overall score combines interview competencies (80%) and JD alignment (20%). Job fit measures evidence for required skills. Confidence reflects ownership and specificity in answers; video is never analysed.</p></div>
        <div className="report-grid"><section><h2>Competency scores</h2><div className="competency-list">{Object.entries(report.competencies).map(([name, score]) => <div key={name}><div><span>{name}</span><b>{score}</b></div><div className="score-track"><span className={scoreColor(score)} style={{ width: `${score}%` }} /></div></div>)}</div></section><section className="report-list-section"><div><h2>What you did well</h2><BulletList items={report.strengths} /></div><div><h2>Where to grow</h2><BulletList items={report.weaknesses} /></div></section></div>
        <section className="plan-section"><div className="section-heading-row"><div><h2>Your preparation plan</h2><p>Start with the highest impact gap before your real interview.</p></div></div><div className="plan-grid">{report.gaps.map(gap => <div className="plan-item" key={gap.priority}><span>Priority {gap.priority}</span><h3>{gap.topic}</h3><p>{gap.why}</p><strong>Review next</strong><BulletList items={gap.review} />{gap.resources && gap.resources.length > 0 && <div className="resource-block"><strong>Study searches</strong><div className="resource-list">{gap.resources.map((res, rIdx) => <a key={rIdx} className="resource-item" href={`https://www.google.com/search?q=${encodeURIComponent(res.query)}`} target="_blank" rel="noreferrer"><div><span className="resource-tag">{res.type}</span><span>{res.title}</span></div><ExternalLink size={13} /></a>)}</div></div>}</div>)}</div></section>
        <section className="question-feedback"><div className="section-heading-row"><div><h2>Question-by-question feedback</h2><p>See exactly how each answer landed and what a stronger direction looks like.</p></div></div><div className="question-list">{report.turns.map((turn, index) => <details key={index} open={index === 0}><summary><div><span>Question {index + 1} · {LEVEL_LABELS[turn.question.level]}</span><strong>{turn.question.text}</strong></div><div><b className={scoreColor(turn.feedback.score)}>{turn.feedback.score}/100</b><ChevronDown size={19} /></div></summary><div className="question-detail"><div><h4>Your answer</h4><p>{turn.answer}</p>{turn.speechMetrics && <div className="delivery-badge-row" style={{ marginTop: '10px' }}><span className={`metric-pill ${turn.speechMetrics.paceRating === 'Ideal Pace' ? 'ideal' : 'warn'}`}><Gauge size={12} /> {turn.speechMetrics.wpm} WPM ({turn.speechMetrics.paceRating})</span><span className={`metric-pill ${turn.speechMetrics.totalFillers === 0 ? 'ideal' : 'warn'}`}><Zap size={12} /> {turn.speechMetrics.totalFillers === 0 ? '0 Fillers' : `${turn.speechMetrics.totalFillers} Fillers`}</span>{turn.starAnalysis && <span className="metric-pill info">STAR: {turn.starAnalysis.starScore}%</span>}</div>}</div><div><h4>Assessment</h4><p>{turn.feedback.assessment}</p></div><div><h4>What was good</h4><p>{turn.feedback.good}</p></div><div><h4>What to improve</h4><p>{turn.feedback.improve}</p></div><div className="ideal-direction"><h4>Ideal direction</h4><p>{turn.feedback.idealDirection}</p></div></div></details>)}</div></section>
        <div className="report-end"><div><Sparkles size={19} /><span>Want to see progress? Practise this role again after reviewing your plan.</span></div><button className="button primary" onClick={reset}><RotateCcw size={17} /> New session</button></div>
      </div>}
    </main>

    {settingsOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSettingsOpen(false); }}><div className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div className="modal-top"><div><span className="mini-label">Live AI connection</span><h2 id="settings-title">Groq settings</h2></div><button className="icon-button" onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X size={19} /></button></div><p>Readyroom uses Groq for document analysis, adaptive questions, answer evaluation, reports, and speech transcription.</p>{serverKey ? <div className="connection-confirmation"><CheckCircle2 size={19} /> A server key is configured. You’re ready to practise.</div> : <><label htmlFor="groq-key">Groq API key</label><input id="groq-key" type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} placeholder="gsk_…" /><small>Your key stays in this browser tab and is sent only to this app’s API for Groq requests. It is not saved in local storage.</small><a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">Create a key in Groq Console <ArrowRight size={15} /></a></>}<button className="button primary full" onClick={() => setSettingsOpen(false)}>{connected ? 'Continue' : 'Done'} <ArrowRight size={17} /></button></div></div>}

    <footer className="footer"><span>readyroom<span className="brand-dot">.</span></span><span>Better practice makes better interviews.</span><span>Built for the Interview Accelerator challenge</span></footer>
  </div>;
}

function DocumentPanel({ kind, title, subtitle, value, onChange, onFile }: { kind: DocKind; title: string; subtitle: string; value: string; onChange: (value: string) => void; onFile: (file?: File) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return <section className="document-panel"><div className="document-panel-head"><div className="doc-icon"><FileText size={21} /></div><div><h3>{title}</h3><p>{subtitle}</p></div><span className="doc-counter">{value ? `${value.length.toLocaleString()} chars` : 'Required'}</span></div><textarea aria-label={`Paste ${title.toLowerCase()}`} value={value} onChange={event => onChange(event.target.value)} placeholder={kind === 'jd' ? 'Paste the full job description here, including responsibilities and required skills…' : 'Paste your resume here, including experience, projects, and measurable outcomes…'} /><div className="document-panel-foot"><button className="upload-button" onClick={() => inputRef.current?.click()}><UploadCloud size={17} /> Upload a file</button><span>{value.length >= 120 ? <><Check size={15} /> Ready to analyse</> : 'At least 120 characters'}</span><input ref={inputRef} type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={event => { onFile(event.target.files?.[0]); event.target.value = ''; }} /></div></section>;
}
