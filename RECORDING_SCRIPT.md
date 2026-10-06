# Readyroom: recording script and submission checklist

**Use this as a teleprompter and shot list.** Record the video yourself. Target 7–9 minutes after trimming waiting time. The sample candidate, Aarav Mehta, and sample role are fictional. All analysis, questions, transcription, feedback, and report text in the app run against the live Groq API. Let at least one loading state appear briefly so the evaluator can see that the result is being generated.

## Before you press Record

1. Open the public deployment in Chrome or Edge and make sure the top right reads **Groq connected**. Use a private window to confirm it opens without a Vercel login. If it redirects to Vercel authentication, public access still needs to be enabled before submitting.
2. Check the microphone and speaker, allow microphone permission, and close other tabs that might speak. Browser speech synthesis varies by operating system; use **Hear question again** if the first question is silent.
3. Set browser zoom around 90% on a desktop width. Keep the app and your editor ready in separate windows. Never show `.env`, the Vercel environment-variable value, a Groq key, or browser developer tools containing request headers.
4. Keep this script on another screen or printed. The example documents are available through **Fill example documents**, and their exact text is in `shared/sample.ts`. For a paste demonstration, use the two blocks below. Do not present the fictional candidate's accomplishments as your own.
5. Avoid promising a particular score, question, or follow-up. The model generates them in real time. Read and respond to what actually appears.

### Exact demo inputs, if you prefer to paste instead of using the example button

Paste this into **Job description**:

```text
AI Product Engineer Intern — Example role for demo

We are looking for a curious engineer to build AI-powered experiences that help students and early-career candidates demonstrate their skills and prepare for opportunities.

Responsibilities
• Build responsive React interfaces and reliable Node.js APIs.
• Integrate LLM APIs to analyse documents, generate useful feedback, and support conversational workflows.
• Design prompts, evaluate output quality, and improve the user experience from feedback.
• Collaborate with product and design to turn ambiguous problems into working prototypes.

Required skills
React, TypeScript or JavaScript, Node.js, API integration, prompt engineering, clear communication, and problem solving.

Preferred skills
Experience with speech-to-text, text-to-speech, document parsing, testing, and deployment. Familiarity with LLM evaluation and privacy-aware handling of candidate data.

We value hands-on projects, ownership, curiosity, and the ability to explain tradeoffs. Internship or project experience is welcome.
```

Paste this into **Your resume**:

```text
Aarav Mehta
Computer Science undergraduate | Bengaluru, India

Skills: React, TypeScript, JavaScript, Node.js, Express, Python, REST APIs, PostgreSQL, prompt engineering, Git.

Projects
CampusPath — Built a React and Node.js career guidance app for students. Integrated an LLM API to summarize job descriptions and suggest preparation topics. I led frontend implementation and API integration. 120 students tried the pilot; survey responses showed 82% found the suggestions useful.

StudyBuddy — Built a document Q&A prototype using embeddings and retrieval. Improved answer relevance by 18% in a small internal test, but I have not deployed it to production.

Experience
Software Engineering Intern, BrightLabs (May–July 2026). Built dashboard components, fixed API error handling, and worked with a designer to reduce a five-step onboarding flow to three steps.

Education
B.Tech in Computer Science, expected 2027.

Achievement
Finalist in a university hackathon for an accessible learning tool.
```

## Video sequence: show / say / paste

| Time | Show and do | Say (use your own natural delivery) |
| --- | --- | --- |
| 0:00–0:25 | Open Readyroom landing screen, pause on the three-step explanation. | “StudentCredibility focuses on a real early-career problem: candidates may have skills but struggle to show convincing evidence. For the interview stage, a student often has a resume and job description yet does not know which claims will be challenged. Readyroom turns those documents into role-specific practice and a concrete preparation plan.” |
| 0:25–0:55 | Point to **Job description** and **Your resume**, upload controls, then click **Fill example documents**. Scroll just enough to show both populated fields. | “Candidates can paste text or upload PDF, DOCX, TXT, or Markdown. I’m using clearly labelled fictional documents so anyone can reproduce this run. The example button only fills the inputs; the AI analysis and interview are live.” |
| 0:55–1:20 | Click **Analyse my fit**. Show the loading state briefly, then role title and fit score. | “The server asks Groq to analyse the JD and resume independently. It extracts responsibilities, required and preferred skills, competencies, qualifications, and the candidate’s evidence. The fit percentage is computed from required-skill evidence; it is a preparation signal, not a hiring probability.” |
| 1:20–1:45 | Scroll the **Understand the role** tab: responsibilities, required/preferred skills, competencies, concepts. | “This view decodes the employer’s requirements before starting the interview. It helps the candidate focus on the actual role instead of generic interview questions.” |
| 1:45–2:10 | Click **Understand your fit**. Point to strong, partial, and missing evidence; then projects, weak areas, claims to probe. | “A skill only counts as strong when the resume shows applied evidence. A skills-list mention is partial; missing evidence is missing. I also surface claims the interviewer should probe, like a reported relevance improvement without a clear evaluation method.” |
| 2:10–2:45 | Click **Start your interview**. Let the AI question play. Show level indicator and progress. Click **Hear question again** if useful; optionally turn on the camera preview for a second, then off. | “The interview has two screening, two competency, and two deep-dive questions. The level schedule is fixed so a complete run is practical, but the wording and follow-ups are generated after each answer. The optional camera is just a local preview; the model never scores the image.” |
| 2:45–3:25 | Click microphone, **speak a response to the actual question**, stop, wait for Whisper transcription, show the editable transcript, then click **Submit answer**. | “I’m answering by voice. The browser records audio, the server sends it to Groq Whisper, and I can review the transcript before submitting. The same screen supports typing when a microphone is unavailable.” |
| 3:25–3:55 | On **Quick feedback**, point to assessment, what worked, improvement, STAR writing cues, and voice metrics if the recording lasted at least three seconds. Click **Next question** and point to how it refers to the previous answer. | “The feedback cites what I actually said. The next question is generated with the role, resume, skill gaps, conversation history, and this answer. Strong answers can prompt a tougher tradeoff; weak ones can prompt a clarification. Speaking pace comes from recorded duration only; filler counts are approximate transcript cues. The STAR checklist is a writing aid, not part of the scored evaluation.” |
| 3:55–5:15 | Answer the remaining five **actual** questions. Show a screening follow-up, a competency question, and a deep-dive question. For speed, use the answer cards below only when relevant; trim waiting time in the final edit, not the substantive questions. | Between levels: “We’re now checking applied skill and decisions.” At deep dive: “Here the interviewer should test tradeoffs, metrics, failure modes, or a weak claim rather than repeating a static list.” If a follow-up does not clearly connect to the last answer, do not claim that it does; point to the broader role context instead. |
| 5:15–6:10 | Click **See my report**. Show readiness, overall and seven competency scores, strengths, weaknesses, preparation priorities, study searches, and one expanded question card showing question, answer, assessment, good, improve, ideal direction. | “The report combines answer quality with job alignment. Each answer gets specific feedback, and the final report shows the seven requested competencies, ranked gaps, and a readiness category. Notice that the plan explains exactly what to review, while the question cards preserve the evidence behind the score.” |
| 6:10–6:30 | Click **Save as PDF** and show the print dialog, then cancel. Return to home or show **Past practice** if a report is present. | “Reports can be exported through the browser’s PDF print flow. Recent sessions live in this browser, and a later session for the same candidate and role can show a point difference. There’s no account database in this prototype.” |
| 6:30–7:55 | Switch to editor. Show the files and functions in the **Code tour** below in order. Keep each stop short; do not scroll through huge files. | Use the exact code-tour lines below. |
| 7:55–8:15 | Return to deployed app and GitHub README, then finish. | “The product gives the candidate a specific next action after every response, not just a question list. The repository documents the architecture, scoring and limitations; the deployment uses the same GitHub source. Thank you.” |

### Spoken answer for the first recorded question

**Use only if the generated question is about CampusPath, product decisions, or impact.** Speak naturally rather than reading word for word:

> “In this fictional candidate’s CampusPath project, I led the React interface and Node API integration. We used job descriptions to suggest preparation topics to students. A pilot involved 120 students, and 82 percent of survey respondents said the suggestions were useful. That is survey sentiment, not a controlled measure of improved outcomes. Next I would compare task completion and answer quality against a baseline.”

If the question is about **StudyBuddy**, instead say:

> “For StudyBuddy, I built a document question-answering prototype using embeddings and retrieval. The resume says relevance improved by 18 percent in a small internal test. I would not call that production evidence yet. I would document the baseline, the test questions, an appropriate relevance metric, and failure cases before making a stronger claim.”

If it asks about a different topic, answer that topic directly. Do not force one of these examples into an unrelated question.

### Pasteable answer cards for the other five turns

Keep these on a second screen. **Paste only the card matching the generated question, and edit its first sentence to match the question.** The live model can ask in any order. These are deliberately substantive but honest about the fictional resume. Using voice for at least the first answer demonstrates the mandatory voice path.

**When asked about impact or evaluation**

```text
The CampusPath pilot reached 120 students. The 82% figure is a usefulness survey response, so it does not prove improved job outcomes. I would define a baseline, measure whether students can identify JD gaps and finish a preparation task, and compare those outcomes before and after the feature. I would also check response bias and look at qualitative failure cases.
```

**When asked about the 18% retrieval claim**

```text
The 18% relevance improvement on StudyBuddy came from a small internal test, not a production benchmark. I would preserve a fixed evaluation set of representative questions, compare the same retrieval metric against the previous system, and inspect failures such as missing context or irrelevant chunks. I would report sample size and uncertainty before presenting the number as a reliable gain.
```

**When asked about API reliability or scaling**

```text
I would validate the request and response contracts, enforce upload and payload limits, and show a recoverable error instead of inventing a result when the model fails. For a rate limit, I would honor a short retry window and let the candidate retry the same step. At higher usage I would add observability, abuse protection, and an evaluation set that tracks quality as well as latency and cost.
```

**When asked about product, UX, or collaboration**

```text
At BrightLabs, I worked with a designer to reduce onboarding from five steps to three. I would first identify where users were dropping out, then test a shorter flow. To judge the change, I would compare completion rate and task success against the old flow, check for regressions, and talk with users whose needs were not met by the simplified version.
```

**When asked for a deep-dive tradeoff or hypothetical scenario**

```text
I would start by defining the user-facing failure and a measurable target. For an AI interview tool, I would keep the JD, resume evidence, and previous answers in the prompt, but limit context to relevant summaries as the session grows. I would test question relevance, unsupported attributions, repeated topics, and whether feedback is actionable. If the model made an unsupported claim, I would treat that as a failure, tighten the grounding instruction, and add that case to a regression set.
```

For a question these cards do not cover, answer in your own words. The evaluator will notice if a pasted answer does not address the prompt.

## Code tour: open these exact files/functions

1. **`shared/types.ts` → `Analysis`, `Turn`, `Report`:** “I defined typed contracts for the role, candidate evidence, each turn, and the report, so the browser and server share one data shape.”
2. **`server/app.ts` → `requireDocuments` and `/api/index` actions:** “The API validates document length, accepts text or file uploads, parses PDF and DOCX, and exposes separate analysis, interview, transcription, and report actions. The Groq secret stays server-side.”
3. **`server/ai.ts` → `analyze` and `interviewTurn`:** “The first prompt separates JD requirements from resume claims. The turn prompt evaluates the actual answer, includes prior strengths and weaknesses, prevents unsupported ‘you mentioned’ attributions, and generates exactly one next question based on the latest context.”
4. **`server/ai.ts` → `transcribe`, then `src/App.tsx` → `startRecording`, `speak`:** “Browser MediaRecorder captures audio; the server calls Whisper; browser speech synthesis reads the interviewer’s question. The transcript is editable before evaluation.”
5. **`server/engine.ts` → `scoreFit`, `levelForTurn`, `buildReport`:** “Strong, partial, and missing required-skill evidence receive 1, 0.5, and 0 points. The six-turn schedule sets the level. The final score gives 80% weight to interview competencies and 20% to job fit; generous LLM ratings are calibrated against actual answer scores.”
6. **`shared/metrics.ts` → `analyzeSpeech`, `analyzeStarStructure`:** “Bonus delivery and STAR cues are transparent heuristics. Pace is only calculated from voice recordings with a measured duration, and neither camera pixels nor these cues drive the main score.”
7. **`api/index.ts`, `vercel.json`, and `README.md`:** “A single Vercel function hosts the API behind the React app. The README documents the flow, scoring, deployment, privacy choices, and prototype limits.”

## Architecture sentence if asked

“React handles the interview UI, audio capture, playback, and local report history. One Express API in a Vercel Function validates inputs, parses files, and calls Groq for JSON analysis, adaptive evaluation, report writing, and Whisper transcription. Shared TypeScript contracts and a deterministic scoring layer keep the output consistent. The candidate’s camera preview stays in the browser.”

## Why these choices if asked

“I kept the prototype focused on the candidate’s immediate preparation problem. The JD and resume are small enough to analyse directly, so I did not add a vector database just for the sake of it. The server owns prompts, validation, and secrets; React owns the interactive experience; the deterministic scoring layer makes the fit and readiness logic inspectable. Browser TTS makes the interviewer audible without another paid service, and local report history keeps the first version simple. A future version would add a measured evaluation set for question relevance and feedback quality before claiming calibrated real-world interview predictions.”

## Scoring sentence if asked

“The model classifies resume evidence for each required JD skill; the server calculates fit from that evidence. Each interview answer is scored for relevance, accuracy, depth, evidence, and clarity. Final competency ratings are calibrated with the average question score, and the overall score weights interview performance 80% and job fit 20%. Readiness labels are coaching thresholds, not hiring predictions.”

## Submission checklist

- [ ] Public deployment opens in an incognito window without Vercel authentication.
- [ ] Header says **Groq connected** and a complete live run works before recording.
- [ ] GitHub repository is public and README links to the real recording after you make it.
- [ ] Video shows the complete journey, one genuine microphone answer with transcription, all three levels, one clear adaptive follow-up, the report, and the code tour.
- [ ] No API key or `.env` appears in video, repository, or pasted submission text.
- [ ] Submit the live URL, GitHub URL, and a link to **your** final recording.
