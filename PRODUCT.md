# Readyroom

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React frontend as requested. Node API and Groq were selected to keep one deployable service and keep the API key off the client in hosted mode.

## Users

Students and job candidates who have a job description and resume and need to prepare for a specific interview.

## Product Purpose

Turn the candidate's documents into a role and fit analysis, conduct a three-level adaptive interview, and produce evidence-based feedback and a focused preparation plan.

## Positioning

Questions are grounded in both documents and adapt to the candidate's actual answers. The report explains what evidence supported each assessment.

## Operating Context

The candidate may paste or upload a JD and resume, practice on a laptop with a microphone, optionally turn on a camera preview, and review or export results before a real interview.

## Capabilities and Constraints

- Required: JD/resume upload or paste, role and candidate analysis, job fit, screening/competency/deep-dive interview, voice answers, dynamic follow-ups, detailed report and readiness.
- Every analysis, interview turn, and report uses live Groq AI. Live AI needs a Groq API key, supplied through the server environment or in a temporary local session. Example documents may prefill the inputs for a fast demo.
- Keep the complete path short enough to show in a demo video.
- No account is required for this prototype. Interview history is stored in the current browser.

## Evidence on Hand

The assignment brief was supplied in the project request. The requested company site could not be retrieved from this environment, so no company-specific claims are used.

## Product Principles

- Explain the next action plainly.
- Show evidence behind fit and feedback.
- Ask questions that refer to the person's own work.
- Give preparation steps a candidate can act on immediately.
