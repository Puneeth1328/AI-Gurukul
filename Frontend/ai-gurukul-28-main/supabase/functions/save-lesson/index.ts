// Supabase Edge Function: save-lesson
// Receives lesson data from n8n and writes to all related tables using the
// service role (bypasses RLS). Returns { status, lesson_id }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SaveLessonBody {
  user_id: string;
  subject: string;
  grade: string;
  topic: string;
  duration?: string;
  objectives?: string;
  language?: string;
  lessonPlan?: Record<string, unknown>;
  worksheet?: Record<string, unknown>;
  quiz?: Record<string, unknown>;
  rubric?: Record<string, unknown>;
  answerKey?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ status: "error", message: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as SaveLessonBody;

    if (!body.user_id || !body.subject || !body.grade || !body.topic) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing required fields: user_id, subject, grade, topic",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // 1) Create lesson row
    const { data: lesson, error: lessonErr } = await supabase
      .from("lessons")
      .insert({
        user_id: body.user_id,
        subject: body.subject,
        grade: body.grade,
        topic: body.topic,
        duration: body.duration ?? null,
        objectives: body.objectives ?? null,
        language: body.language ?? "English",
        title: body.topic,
      })
      .select("id")
      .single();

    if (lessonErr || !lesson) {
      console.error("lessons insert failed", lessonErr);
      return new Response(
        JSON.stringify({ status: "error", message: lessonErr?.message ?? "Failed to create lesson" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const lesson_id = lesson.id as string;

    // 2) Child rows — run in parallel
    const results = await Promise.all([
      supabase.from("lesson_content").insert({ lesson_id, content: body.lessonPlan ?? {} }),
      supabase.from("worksheets").insert({ lesson_id, content: body.worksheet ?? {} }),
      supabase.from("quizzes").insert({ lesson_id, content: body.quiz ?? {} }),
      supabase.from("rubrics").insert({ lesson_id, content: body.rubric ?? {} }),
      supabase.from("answer_keys").insert({ lesson_id, content: body.answerKey ?? {} }),
    ]);

    const childErr = results.find((r) => r.error)?.error;
    if (childErr) {
      console.error("child insert failed", childErr);
      // best-effort cleanup
      await supabase.from("lessons").delete().eq("id", lesson_id);
      return new Response(
        JSON.stringify({ status: "error", message: childErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ status: "success", lesson_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("save-lesson error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ status: "error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
