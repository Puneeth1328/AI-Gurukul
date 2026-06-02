const N8N_BASE = import.meta.env.VITE_N8N_WEBHOOK_URL || "";

export interface GenerateLessonPayload {
  user_id: string;
  subject: string;
  grade: string;
  topic: string;
  duration: string;
  objectives: string;
}

export interface GenerateLessonResponse {
  lesson_id: string;
  status?: string;
}

/**
 * Invokes the single consolidated n8n workflow ("generate-lesson") which
 * runs the AI generation pass and forwards the parsed payload to the
 * `save-lesson` Supabase Edge Function. The webhook resolves only after
 * all 5 child tables (lesson_content, worksheets, quizzes, rubrics,
 * answer_keys) have been inserted, returning the master lesson_id.
 */
export async function generateLesson(
  payload: GenerateLessonPayload
): Promise<GenerateLessonResponse> {
  const response = await fetch(`${N8N_BASE}/webhook/generate-lesson-gurukul`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("Generation failed. Please try again.");
  }
  const data = await response.json();
  // n8n may wrap the result in an array depending on the "Respond to Webhook" node
  const result = Array.isArray(data) ? data[0] : data;
  const lessonId = result?.lesson_id;
  if (!lessonId) {
    throw new Error("Generation completed but no lesson_id was returned.");
  }
  return { lesson_id: lessonId, status: result?.status };
}

export interface RegenerateSectionPayload {
  lesson_id: string;
  section: string;
  user_id: string;
  subject: string;
  grade: string;
  topic: string;
  language: string;
  instructions?: string;
}

export async function regenerateSection(payload: RegenerateSectionPayload) {
  const response = await fetch(`${N8N_BASE}/webhook/regenerate-section`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Regeneration failed. Please try again.");
  return response.json();
}
