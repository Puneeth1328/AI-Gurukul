# AI-Powered Multi-Role Lesson Crafting Engine & LMS

An advanced, full-stack Learning Management System (LMS) designed to automate comprehensive educational content generation using Gemini AI, n8n orchestration, and real-time user collaboration modules.

## 🚀 Key Features
- **Tri-Role Architecture:** Customized interfaces for Tutors (Super Admins), Teachers (Content Creators), and Students (Learners).
- **Unified Generation Pipeline:** One-click automated lesson kits (Lesson Plan, Worksheets, Quizzes, Rubrics, Answer Keys) via n8n backend workflows.
- **Granular Section Regeneration:** Targeted AI recreation of individual tabs without regenerating the master layout.
- **Real-Time Classroom Discussions:** Localized, live comment streaming inside specific lessons utilizing Supabase real-time channels.
- **Defensive Data Rendering:** Safe-parsing frontend architecture to guarantee zero-crash loading screens and clean PDF exports.

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Vite, TailwindCSS (via Lovable)
- **Backend Orchestration:** n8n Workflow Automation Engine, Ngrok Tunneling
- **Database & Authentication:** Supabase (PostgreSQL, Realtime, Edge Functions)
- **AI Core:** Google Gemini 2.5 Flash API
