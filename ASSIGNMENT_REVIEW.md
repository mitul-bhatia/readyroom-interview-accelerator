# Assignment 3: deliverable review

This checklist compares the supplied Interview Accelerator brief with the implementation. It is a product review, not a claim that the prototype predicts a real employer's hiring decision.

## Minimum acceptance criteria

| Brief requirement | Status | Evidence in the app / code |
| --- | --- | --- |
| JD and resume paste or upload | Implemented | Two input panels; PDF, DOCX, TXT, MD parsing in `server/app.ts`. Files must be under 4 MB; scanned PDFs need OCR outside the app. |
| JD analysis | Implemented | Role title, responsibilities, required/preferred skills, competencies, experience, keywords, concepts, qualifications in `server/ai.ts` and the role dashboard. |
| Resume analysis | Implemented | Skills, experience, projects, achievements, strengths, weak areas, claims to probe, and preparation areas in the candidate dashboard. |
| Job fit | Implemented | Strong/partial/missing required-skill evidence calculated in `scoreFit`; explanations displayed per skill. |
| Personalized interview | Implemented | First question draws on the resume and role; later turns carry role/candidate analysis and conversation history. |
| Three levels | Implemented | Two screening, two competency, two deep-dive questions; `levelForTurn` enforces progression. |
| Dynamic follow-ups and prior answers | Implemented | `interviewTurn` evaluates the current answer and generates the next question using previous questions, scores, strengths, weaknesses, claims, and skill gaps. The level schedule is fixed; question content is live. |
| Voice interview | Implemented | Browser TTS reads questions; MediaRecorder captures answers; Groq Whisper transcribes; candidate can edit transcript before evaluation. Requires HTTPS or localhost and microphone permission. |
| Evaluation and report | Implemented | Overall score, seven competency scores, question-level assessment/good/improve/ideal direction, strengths, weaknesses, three priority gaps, readiness category. |
| Functional web interface | Implemented | Responsive React/Vite UI with loading/error states, a clear multi-step journey, question progress, and report view. |
| Public app + source + README | Implemented | Vercel production alias and public GitHub repository; `README.md` explains architecture, AI, voice, scoring, privacy, and limits. |
| Applicant-recorded video | **Applicant action required** | Record your own complete journey with `RECORDING_SCRIPT.md`, upload it, then add its link to `README.md` and the submission. The synthetic reference capture is not the final video. |

## Bonus features: what to claim accurately

| Feature | Actual behavior |
| --- | --- |
| Camera | Optional local self-preview during interview. Video is not recorded, transmitted, analysed, or scored; no animated human interviewer. |
| Speaking pace | WPM computed from measured voice-recording duration and the final transcript. Typed answers have no WPM. Transcript edits or speech-recognition omissions can affect accuracy. |
| Filler cues | Counts a conservative list of common fillers in voice transcripts; Whisper may omit spoken fillers. This is an approximate coaching cue. |
| STAR cues | Keyword-based writing checklist for situation, task, action, and result. It is not a model-graded score and does not affect readiness. |
| Preparation plan | AI names three ranked gaps and specific subtopics. Links are labelled study **searches**, not vetted articles. |
| Interview history and comparison | Last eight reports in browser local storage. A new run compares points only with the same candidate name and role title on the same device. |
| Multiple job profiles | Candidate can start a new session with another JD/resume and see earlier reports on the same device. No account sync. |
| PDF export | Browser print-to-PDF action; no hosted share link. |
| Two Groq keys | Server can try the second key after a failed or rate-limited first key. If both belong to the same Groq organization, shared organization rate limits still apply. Neither key is in Git or the frontend bundle. |

## Key engineering decisions and limits

- **Live AI only:** example documents are static input helpers; role extraction, interviews, transcription, and reports call Groq. A failed request surfaces an error and the candidate can retry; no canned result replaces it.
- **One API boundary:** browser calls a Vercel-hosted Express function. Secrets stay in server environment variables, document sizes are bounded, and the browser uses shared TypeScript contracts.
- **Small-document context:** JD and resume text fit in the bounded prompt and are summarized into structured analysis for later turns. A vector database would add complexity without a retrieval need in this six-question prototype.
- **Evidence-based scoring:** the server computes required-skill fit and calibrates model competency ratings against question scores. This prevents an upbeat final model response from overriding weak answer evidence. It does not make the score psychometrically validated.
- **Privacy:** reports stay in browser local storage; the server stores no reports or recordings. Uploaded document content, answers, and audio are sent to Groq for the requested AI operation. There is no account login or cross-device history.
- **Quality verification:** automated tests cover level progression, fit scoring, calibration, multi-key failover, rate-limit retry, measured speaking metrics, and transcript-only delivery summary. A live production smoke test analysed the fictional documents and generated a screening question.

## Submission package

1. Live app: `https://vibes-tawny.vercel.app`
2. Repository: `https://github.com/mitul-bhatia/readyroom-interview-accelerator`
3. README: `README.md`
4. Applicant-recorded complete demo video: **add link after recording**
5. Script and code tour: `RECORDING_SCRIPT.md`

Use the live alias above in the submission. Vercel's generated deployment URLs may redirect anonymous visitors to SSO even while this alias is public.
