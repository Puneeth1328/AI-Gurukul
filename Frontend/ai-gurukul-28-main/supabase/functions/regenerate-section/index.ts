// Supabase Edge Function: regenerate-section
// Receives { lesson_id, section, content } and updates the matching child table row
// using the service role client (bypasses RLS).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RegenerateSectionBody {
  lesson_id: string;
  section: string;
  content: Record<string, unknown>;
}

const sectionToTable: Record<string, string> = {
  lesson_content: "lesson_content",
  worksheets: "worksheets",
  quizzes: "quizzes",
  rubrics: "rubrics",
  answer_keys: "answer_keys",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ status: "error", message: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const body = (await req.json()) as RegenerateSectionBody;

    if (!body.lesson_id || !body.section) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Missing required fields: lesson_id, section",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const table = sectionToTable[body.section];
    if (!table) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: `Invalid section '${body.section}'. Allowed: lesson_content, worksheets, quizzes, rubrics, answer_keys`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Overwrite the content column for the matching lesson_id row
    const { error } = await supabase
      .from(table)
      .update({ content: body.content ?? {} })
      .eq("lesson_id", body.lesson_id);

    if (error) {
      console.error(`${table} update failed`, error);
      return new Response(
        JSON.stringify({ status: "error", message: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ status: "success", lesson_id: body.lesson_id, section: body.section }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("regenerate-section error", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ status: "error", message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
