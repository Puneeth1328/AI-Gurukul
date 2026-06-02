import React, { useEffect, useState } from "react";
import { createFileRoute, useParams, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft, Star, RefreshCw, Download, Target, Flame, BookOpen,
  CheckCircle, Home, Clock, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { regenerateSection } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { subjectColor } from "@/lib/subjectStyle";
import { DiscussionTab } from "@/components/DiscussionTab";

export const Route = createFileRoute("/_authenticated/lesson/$id")({
  component: LessonViewerPage,
});

/* ============================== ERROR BOUNDARY ============================== */

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Content Loading Error</h2>
            <p className="text-gray-500 mb-6">
              The lesson content could not be displayed. This usually means the AI response needs to be regenerated.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl mr-3"
            >
              Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/library")}
              className="border border-gray-300 px-6 py-3 rounded-xl"
            >
              Go to Library
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function LessonViewerPage() {
  return (
    <ErrorBoundary>
      <LessonViewer />
    </ErrorBoundary>
  );
}

/* ============================== SAFE ACCESSORS ============================== */

const safeArray = <T,>(val: unknown): T[] => (Array.isArray(val) ? (val as T[]) : []);
const safeString = (val: unknown, fallback = ""): string =>
  typeof val === "string" ? val : val == null ? fallback : String(val);
const safeObj = (val: unknown): Record<string, unknown> =>
  val && typeof val === "object" && !Array.isArray(val) ? (val as Record<string, unknown>) : {};

const hasValidContent = (val: unknown): boolean => {
  const o = safeObj(val);
  if (!val || typeof val !== "object") return false;
  if ((o as { error?: unknown }).error) return false;
  return Object.keys(o).length > 0;
};

function ContentErrorState({ label }: { label: string }) {
  return (
    <div className="p-8 text-center bg-white rounded-xl border">
      <p className="text-amber-600 font-medium">
        {label} could not be generated properly.
      </p>
      <p className="text-gray-500 text-sm mt-2">Click Regenerate to try again.</p>
    </div>
  );
}

interface Lesson {
  id: string; user_id: string; subject: string; grade: string; topic: string;
  title: string | null; language: string | null; is_favorite: boolean;
}
type AnyContent = Record<string, unknown> | null;

const TABS = [
  { id: "plan", label: "📚 Lesson Plan" },
  { id: "worksheet", label: "📝 Worksheet" },
  { id: "quiz", label: "❓ Quiz" },
  { id: "rubric", label: "📊 Rubric" },
  { id: "key", label: "🔑 Answer Key" },
  { id: "discussion", label: "💬 Discussion" },
] as const;

const SECTIONS = [
  { id: "lesson_plan", name: "Lesson Plan" },
  { id: "worksheet", name: "Worksheet" },
  { id: "quiz", name: "Quiz" },
  { id: "rubric", name: "Rubric" },
  { id: "answer_key", name: "Answer Key" },
];

function LessonViewer() {
  const { id } = useParams({ from: "/_authenticated/lesson/$id" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [planC, setPlanC] = useState<AnyContent>(null);
  const [wsC, setWsC] = useState<AnyContent>(null);
  const [qzC, setQzC] = useState<AnyContent>(null);
  const [rbC, setRbC] = useState<AnyContent>(null);
  const [akC, setAkC] = useState<AnyContent>(null);
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("plan");
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenSection, setRegenSection] = useState("lesson_plan");
  const [regenInstr, setRegenInstr] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [lRes, pRes, wRes, qRes, rRes, aRes] = await Promise.all([
        supabase.from("lessons").select("*").eq("id", id).maybeSingle(),
        supabase.from("lesson_content").select("content").eq("lesson_id", id).maybeSingle(),
        supabase.from("worksheets").select("content").eq("lesson_id", id).maybeSingle(),
        supabase.from("quizzes").select("content").eq("lesson_id", id).maybeSingle(),
        supabase.from("rubrics").select("content").eq("lesson_id", id).maybeSingle(),
        supabase.from("answer_keys").select("content").eq("lesson_id", id).maybeSingle(),
      ]);
      if (!lRes.data) {
        toast.error("Lesson not found");
        navigate({ to: "/library" });
        return;
      }
      setLesson(lRes.data as Lesson);
      setPlanC((pRes.data?.content as AnyContent) ?? null);
      setWsC((wRes.data?.content as AnyContent) ?? null);
      setQzC((qRes.data?.content as AnyContent) ?? null);
      setRbC((rRes.data?.content as AnyContent) ?? null);
      setAkC((aRes.data?.content as AnyContent) ?? null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [id, user]);

  const toggleFav = async () => {
    if (!lesson) return;
    const newVal = !lesson.is_favorite;
    setLesson({ ...lesson, is_favorite: newVal });
    await supabase.from("lessons").update({ is_favorite: newVal }).eq("id", lesson.id);
  };

  const handleRegenerate = async () => {
    if (!lesson || !user) return;
    setRegenLoading(true);
    try {
      await regenerateSection({
        lesson_id: lesson.id, section: regenSection, user_id: user.id,
        subject: lesson.subject, grade: lesson.grade, topic: lesson.topic,
        language: lesson.language || "English", instructions: regenInstr,
      });
      await fetchAll();
      setRegenOpen(false);
      toast.success("Section regenerated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setRegenLoading(false);
    }
  };

  const handleExport = () => {
    if (!lesson) return;
    const html = buildPrintHTML(lesson, { plan: planC, worksheet: wsC, quiz: qzC, rubric: rbC, key: akC });
    const w = window.open("", "_blank");
    if (!w) return toast.error("Allow popups to export");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  if (loading) {
    return <div className="p-6 max-w-4xl mx-auto space-y-3">
      <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-96 bg-gray-100 rounded-xl animate-pulse" />
    </div>;
  }
  if (!lesson) return null;
  const c = subjectColor(lesson.subject);

  return (
    <div className="min-h-screen">
      {/* Action bar */}
      <div className="action-bar sticky top-0 lg:top-0 bg-white border-b shadow-sm z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link to="/library">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          </Link>
          <h1 className="font-bold text-lg truncate flex-1 min-w-0">{lesson.topic}</h1>
          <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-xs ${c.badge}`}>{lesson.subject}</span>
          <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{lesson.grade}</span>
          {lesson.language && <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-700">{lesson.language}</span>}
          <button onClick={toggleFav} className="p-2 rounded hover:bg-gray-100">
            <Star className={`h-4 w-4 ${lesson.is_favorite ? "fill-amber-500 text-amber-500" : "text-gray-400"}`} />
          </button>
          <Button variant="outline" size="sm" onClick={() => setRegenOpen(true)}><RefreshCw className="h-4 w-4 mr-1" /> Regenerate</Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Export PDF</Button>
        </div>
        {/* Tabs */}
        <div className="tabs-nav border-t overflow-x-auto">
          <div className="max-w-5xl mx-auto px-4 flex gap-1">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-4 transition-colors ${
                  tab === t.id ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-indigo-600"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="print-content max-w-4xl mx-auto p-4 sm:p-6">
        {tab === "plan" && <PlanTab content={planC} />}
        {tab === "worksheet" && <WorksheetTab content={wsC} />}
        {tab === "quiz" && <QuizTab content={qzC} />}
        {tab === "rubric" && <RubricTab content={rbC} />}
        {tab === "key" && <AnswerKeyTab content={akC} />}
        {tab === "discussion" && <DiscussionTab lessonId={lesson.id} />}
      </div>

      {/* Regen dialog */}
      <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate a Section</DialogTitle>
            <DialogDescription>Not happy with a section? AI will generate fresh content.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setRegenSection(s.id)}
                className={`p-3 rounded-lg border-2 text-left text-sm ${regenSection === s.id ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200"}`}>
                {s.name}
              </button>
            ))}
          </div>
          <Textarea placeholder="Additional instructions for AI (optional)" value={regenInstr} onChange={(e) => setRegenInstr(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenOpen(false)} disabled={regenLoading}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={regenLoading} onClick={handleRegenerate}>
              {regenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "🔄 Regenerate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================== TAB COMPONENTS ============================== */

function EmptyTab({ msg }: { msg: string }) {
  return <div className="text-center py-16 bg-white rounded-xl border text-gray-500">{msg}</div>;
}

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function PlanTab({ content }: { content: AnyContent }) {
  if (!content) return <EmptyTab msg="No lesson plan generated yet" />;
  if (!hasValidContent(content)) return <ContentErrorState label="Lesson plan" />;
  const c = safeObj(content);
  const objectives = safeArray<string>(c.objectives).map((o) => safeString(o));
  const warmUp = c.warmUp as Record<string, unknown> | undefined;
  const mainContent = asArray<Record<string, unknown>>(c.mainContent);
  const activity = c.activity as Record<string, unknown> | undefined;
  const recap = c.recap as Record<string, unknown> | undefined;
  const homework = c.homework as Record<string, unknown> | undefined;

  return (
    <div className="space-y-4">
      {objectives.length > 0 && (
        <section className="bg-indigo-50 rounded-xl p-6">
          <h2 className="font-bold flex items-center gap-2 text-indigo-900"><Target className="h-5 w-5" /> Learning Objectives</h2>
          <ol className="mt-3 space-y-2">
            {objectives.map((o, i) => (
              <li key={i} className="flex gap-3">
                <span className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <span>{o}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {warmUp && (
        <section className="bg-amber-50 rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold flex items-center gap-2 text-amber-900"><Flame className="h-5 w-5" /> 🔥 Warm-Up Activity</h2>
            {Boolean(warmUp.duration) && <span className="text-xs bg-white rounded-full px-2 py-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {String(warmUp.duration)}</span>}
          </div>
          {Boolean(warmUp.title) && <p className="font-semibold text-lg mt-2">{String(warmUp.title)}</p>}
          {Boolean(warmUp.description) && <p className="mt-2 text-gray-700">{String(warmUp.description)}</p>}
        </section>
      )}

      {mainContent.length > 0 && (
        <section>
          <h2 className="font-bold flex items-center gap-2 mb-3"><BookOpen className="h-5 w-5" /> 📖 Main Content</h2>
          <div className="space-y-3">
            {mainContent.map((concept, i) => (
              <div key={i} className="border-l-4 border-indigo-500 pl-4 py-3 bg-white rounded-r-lg">
                <h3 className="font-bold text-indigo-700">{String(concept.name || concept.title || `Concept ${i + 1}`)}</h3>
                {concept.explanation != null && <p className="mt-1 text-gray-700">{String(concept.explanation)}</p>}
                {concept.example != null && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 font-mono text-sm border">{String(concept.example)}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activity && (
        <section className="bg-indigo-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold">✏ Class Activity</h2>
            {Boolean(activity.duration) && <span className="text-xs border border-white/40 rounded-full px-2 py-1">{String(activity.duration)}</span>}
          </div>
          {Boolean(activity.title) && <p className="font-bold text-xl mt-2">{String(activity.title)}</p>}
          {Array.isArray(activity.instructions) ? (
            <ul className="list-disc list-inside mt-2 space-y-1">{activity.instructions.map((x, i) => <li key={i}>{String(x)}</li>)}</ul>
          ) : activity.instructions ? (
            <p className="mt-2">{String(activity.instructions)}</p>
          ) : null}
        </section>
      )}

      {recap && (
        <section className="bg-green-50 rounded-xl p-6">
          <h2 className="font-bold flex items-center gap-2 text-green-900"><CheckCircle className="h-5 w-5" /> 🔁 Recap & Review</h2>
          {asArray<string>(recap.keyPoints).length > 0 && (
            <ul className="mt-2 space-y-1">
              {asArray<string>(recap.keyPoints).map((k, i) => (
                <li key={i} className="flex gap-2"><CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> {k}</li>
              ))}
            </ul>
          )}
          {asArray<string>(recap.checkQuestions).length > 0 && (
            <div className="mt-3 space-y-1">
              {asArray<string>(recap.checkQuestions).map((q, i) => <p key={i} className="italic text-gray-600">? {q}</p>)}
            </div>
          )}
        </section>
      )}

      {homework && (
        <section className="bg-purple-50 rounded-xl p-6">
          <h2 className="font-bold flex items-center gap-2 text-purple-900"><Home className="h-5 w-5" /> 🏠 Homework</h2>
          {Boolean(homework.description) && <p className="mt-2">{String(homework.description)}</p>}
          {Boolean(homework.dueDate) && <span className="mt-2 inline-block bg-purple-200 text-purple-900 text-xs px-2 py-1 rounded">Due: {String(homework.dueDate)}</span>}
        </section>
      )}
    </div>
  );
}

function safeParse(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s) return v;
  if (s[0] !== "{" && s[0] !== "[") return v;
  try { return JSON.parse(s); } catch { return v; }
}

function renderQuestionItem(q: unknown, i: number) {
  if (q == null) return <p key={i} className="mb-2">{i + 1}.</p>;
  if (typeof q === "string" || typeof q === "number") {
    return <p key={i} className="mb-2">{i + 1}. {String(q)}</p>;
  }
  const obj = safeObj(q);
  const text = String(
    obj.text ?? obj.question ?? obj.statement ?? obj.prompt ?? obj.q ?? "",
  );
  return (
    <div key={i} className="mb-3">
      <p>{i + 1}. {text}</p>
      {asArray<string>(obj.options).length > 0 && (
        <ul className="ml-6 mt-1 text-sm text-gray-700">
          {asArray<unknown>(obj.options).map((o, j) => (
            <li key={j}>{String.fromCharCode(65 + j)}. {typeof o === "string" ? o : String(safeObj(o).text ?? JSON.stringify(o))}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WorksheetTab({ content }: { content: AnyContent }) {
  if (!content) return <EmptyTab msg="No worksheet generated yet" />;

  // Parse if string, then safely access
  const parsed = safeParse(content);
  const c = safeObj(parsed);
  const nested = safeObj((c as { content?: unknown }).content);

  // Flexible title + sections fallback (parse string if needed)
  const title = String(
    (c as { title?: unknown }).title ?? (nested as { title?: unknown }).title ?? "Worksheet Activity",
  );
  let rawSections: unknown =
    (c as { sections?: unknown }).sections ??
    (nested as { sections?: unknown }).sections ??
    (c as { activities?: unknown }).activities ??
    (nested as { activities?: unknown }).activities;
  rawSections = safeParse(rawSections);

  let sections: Record<string, unknown>[];
  if (Array.isArray(rawSections)) {
    sections = rawSections.map((s) => safeObj(s));
  } else if (rawSections && typeof rawSections === "object") {
    sections = [safeObj(rawSections)];
  } else if (typeof rawSections === "string" && rawSections.trim()) {
    sections = [{ title: "Worksheet", description: rawSections }];
  } else {
    sections = [];
  }

  // If no sections found, render top-level fields as a fallback block
  if (sections.length === 0) {
    const fallbackEntries = Object.entries(c).filter(
      ([k, v]) =>
        !["sections", "activities", "content", "title", "id", "lesson_id", "version", "created_at"].includes(k) &&
        (typeof v === "string" || typeof v === "number"),
    );
    return (
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="border-b pb-4 mb-6 text-gray-600 text-sm">Name: _______________ &nbsp;|&nbsp; Date: ___________ &nbsp;|&nbsp; Class: _____</p>
        {fallbackEntries.length > 0 ? (
          <div className="space-y-3">
            {fallbackEntries.map(([k, v]) => (
              <div key={k}>
                <p className="text-xs uppercase tracking-wide text-gray-500">{k}</p>
                <p className="text-gray-800">{String(v)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyTab msg="No worksheet sections found" />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <p className="border-b pb-4 mb-6 text-gray-600 text-sm">Name: _______________ &nbsp;|&nbsp; Date: ___________ &nbsp;|&nbsp; Class: _____</p>
      {sections.map((sec, si) => {
        const secTitle = String(sec.title ?? sec.heading ?? sec.name ?? `Section ${si + 1}`);
        const type = String(sec.type ?? "");
        const instructions = sec.instructions ?? sec.description ?? sec.directions;
        const questions = asArray<unknown>(safeParse(sec.questions));
        const problems = asArray<Record<string, unknown>>(safeParse(sec.problems));
        const items = asArray<unknown>(safeParse(sec.items));

        const hasStructured =
          questions.length > 0 || problems.length > 0 || items.length > 0;

        return (
          <div key={si} className="mb-6">
            <h3 className="font-bold text-lg border-b-2 border-indigo-500 pb-2 mb-4">{secTitle}</h3>
            {instructions ? (
              <p className="text-sm text-gray-600 italic mb-3">{String(instructions)}</p>
            ) : null}

            {/* Typed renderers (preserve original styling) */}
            {type === "fill_blanks" && questions.map((q, i) => (
              <p key={`fb-${i}`} className="mb-2">{i + 1}. {typeof q === "string" ? q : String(safeObj(q).text ?? "")}</p>
            ))}
            {type === "short_answer" && questions.map((q, i) => (
              <div key={`sa-${i}`} className="mb-4">
                <p>{i + 1}. {typeof q === "string" ? q : String(safeObj(q).text ?? "")}</p>
                {[0, 1, 2].map((j) => <div key={j} className="border-b border-dotted border-gray-300 mt-4" />)}
              </div>
            ))}
            {type === "long_answer" && questions.map((q, i) => (
              <div key={`la-${i}`} className="mb-4">
                <p>{i + 1}. {typeof q === "string" ? q : String(safeObj(q).text ?? "")}</p>
                <div className="h-32 border-2 border-dashed border-gray-300 rounded mt-3" />
              </div>
            ))}
            {type === "problem_solving" && problems.map((p, i) => (
              <div key={`ps-${i}`} className="mb-4">
                <p className="font-medium">{i + 1}. {String(p.statement ?? p.question ?? p.text ?? "")}</p>
                <div className="mt-2 border border-gray-300 rounded h-40 relative">
                  <span className="absolute top-1 left-2 text-xs text-gray-400">Work Space:</span>
                </div>
              </div>
            ))}

            {/* Generic renderer when type is unknown or empty */}
            {!["fill_blanks", "short_answer", "long_answer", "problem_solving"].includes(type) && (
              <>
                {questions.length > 0 && questions.map((q, i) => renderQuestionItem(q, i))}
                {items.length > 0 && items.map((it, i) => renderQuestionItem(it, i))}
                {problems.length > 0 && problems.map((p, i) => (
                  <p key={`gp-${i}`} className="mb-2">{i + 1}. {String(safeObj(p).statement ?? safeObj(p).question ?? safeObj(p).text ?? "")}</p>
                ))}
              </>
            )}

            {/* Fallback: render plain text properties if no structured content */}
            {!hasStructured && (
              <div className="space-y-2">
                {Object.entries(sec)
                  .filter(([k, v]) => !["title", "heading", "name", "type", "questions", "problems", "items", "instructions", "description", "directions"].includes(k) && (typeof v === "string" || typeof v === "number"))
                  .map(([k, v]) => (
                    <p key={k} className="text-gray-800"><span className="text-xs uppercase tracking-wide text-gray-500 mr-2">{k}:</span>{String(v)}</p>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuizTab({ content }: { content: AnyContent }) {
  if (!content) return <EmptyTab msg="No quiz generated yet" />;
  if (!hasValidContent(content)) return <ContentErrorState label="Quiz" />;
  const c = content as Record<string, unknown>;
  const sections = (c.sections || {}) as Record<string, unknown>;
  const mcq = asArray<Record<string, unknown>>(sections.mcq);
  const tf = asArray<Record<string, unknown>>(sections.trueFalse);
  const sa = asArray<Record<string, unknown>>(sections.shortAnswer);
  return (
    <div>
      <div className="bg-indigo-600 text-white rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold">{String(c.title || "Quiz")}</h2>
        <div className="flex gap-2 mt-2 flex-wrap">
          {c.totalMarks != null && <span className="bg-white/20 px-2 py-1 rounded text-xs">Total Marks: {String(c.totalMarks)}</span>}
          {c.duration != null && <span className="bg-white/20 px-2 py-1 rounded text-xs">Duration: {String(c.duration)}</span>}
        </div>
      </div>
      {mcq.length > 0 && (
        <section className="mb-8">
          <h3 className="font-semibold mb-3">Section A: Multiple Choice Questions</h3>
          {mcq.map((q, i) => (
            <div key={i} className="bg-white border rounded-xl p-4 mb-3">
              <p className="font-semibold">Q{i + 1}: {String(q.question || "")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {asArray<string>(q.options).map((o, j) => (
                  <div key={j} className="border rounded-lg p-2 text-sm flex gap-2">
                    <span className="font-semibold">{String.fromCharCode(65 + j)}.</span> {o}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
      {tf.length > 0 && (
        <section className="mb-8">
          <h3 className="font-semibold mb-3">Section B: True or False</h3>
          {tf.map((q, i) => (
            <div key={i} className="bg-white border rounded-xl p-4 mb-2">
              <p>Q{i + 1}: {String(q.statement || q.question || "")}</p>
              <p className="text-sm text-gray-500 mt-2">TRUE ☐ &nbsp;&nbsp; FALSE ☐</p>
            </div>
          ))}
        </section>
      )}
      {sa.length > 0 && (
        <section>
          <h3 className="font-semibold mb-3">Section C: Short Answer</h3>
          {sa.map((q, i) => (
            <div key={i} className="bg-white border rounded-xl p-4 mb-3">
              <div className="flex justify-between flex-wrap gap-2">
                <p className="font-semibold">Q{i + 1}: {String(q.question || "")}</p>
                {q.marks != null && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{String(q.marks)} marks</span>}
              </div>
              {[0, 1, 2].map((j) => <div key={j} className="border-b border-dotted border-gray-300 mt-4" />)}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function RubricTab({ content }: { content: AnyContent }) {
  if (!content) return <EmptyTab msg="No rubric generated yet" />;
  if (!hasValidContent(content)) return <ContentErrorState label="Rubric" />;
  const c = content as Record<string, unknown>;
  const criteria = asArray<Record<string, unknown>>(c.criteria);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{String(c.title || "Grading Rubric")}</h2>
      <div className="overflow-x-auto bg-white rounded-xl border">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-indigo-600 text-white">
            <tr>
              {["Criteria", "Excellent (4)", "Good (3)", "Satisfactory (2)", "Needs Work (1)"].map((h) => (
                <th key={h} className="border p-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {criteria.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-6 text-gray-500">No criteria yet</td></tr>
            ) : criteria.map((row, i) => (
              <tr key={i} className={i % 2 ? "bg-white" : "bg-gray-50"}>
                <td className="border p-3 font-semibold">{String(row.name || "")}</td>
                <td className="border p-3">{String(row.excellent || "")}</td>
                <td className="border p-3">{String(row.good || "")}</td>
                <td className="border p-3">{String(row.satisfactory || "")}</td>
                <td className="border p-3">{String(row.needsWork || "")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnswerKeyTab({ content }: { content: AnyContent }) {
  if (!content) return <EmptyTab msg="No answer key generated yet" />;
  if (!hasValidContent(content)) return <ContentErrorState label="Answer key" />;
  const c = content as Record<string, unknown>;
  const wsAns = (c.worksheetAnswers || {}) as Record<string, unknown>;
  const quizAns = (c.quizAnswers || {}) as Record<string, unknown>;
  const fillBlanks = asArray<string>(wsAns.fillBlanks);
  const shortAns = asArray<Record<string, unknown>>(wsAns.shortAnswers);
  const longAns = asArray<Record<string, unknown>>(wsAns.longAnswers);
  const mcqAns = asArray<Record<string, unknown>>(quizAns.mcq);
  const tfAns = asArray<Record<string, unknown>>(quizAns.trueFalse);
  const saAns = asArray<Record<string, unknown>>(quizAns.shortAnswer);

  return (
    <div className="relative bg-white rounded-xl border p-6 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <span className="text-6xl sm:text-8xl font-black text-red-100 -rotate-[20deg]">ANSWER KEY</span>
      </div>
      <div className="relative z-10 space-y-6">
        <h2 className="font-bold text-xl">Worksheet Answers</h2>
        {fillBlanks.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Fill in the Blanks Answers</h3>
            <ol className="space-y-1">{fillBlanks.map((a, i) => <li key={i}>{i + 1}. {a}</li>)}</ol>
          </div>
        )}
        {shortAns.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Short Answer Model Answers</h3>
            {shortAns.map((a, i) => (
              <div key={i} className="mb-2">
                <p>Q{i + 1}: {String(a.question || "")}</p>
                <div className="mt-1 bg-green-50 border border-green-200 rounded p-2 text-sm">{String(a.answer || "")}</div>
              </div>
            ))}
          </div>
        )}
        {longAns.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Long Answer Key Points</h3>
            {longAns.map((a, i) => (
              <div key={i} className="mb-3">
                <p className="font-medium">Q{i + 1}: {String(a.question || "")}</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  {asArray<string>(a.keyPoints).map((k, j) => <li key={j}>{k}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-bold text-xl mt-8">Quiz Answers</h2>
        {mcqAns.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">MCQ Answer Key</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {mcqAns.map((a, i) => (
                <div key={i} className="text-center">
                  <span className="inline-block bg-indigo-600 text-white px-3 py-1 rounded font-bold text-sm">Q{i + 1} → {String(a.answer || "?")}</span>
                  {a.explanation != null && <p className="text-xs text-gray-500 mt-1">{String(a.explanation)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        {tfAns.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">True/False Answers</h3>
            {tfAns.map((a, i) => {
              const v = String(a.answer || "").toLowerCase().includes("true");
              return (
                <div key={i} className="mb-2 flex flex-wrap gap-2 items-start">
                  <p className="flex-1 min-w-[200px]">{String(a.statement || "")}</p>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${v ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {String(a.answer || "")}
                  </span>
                  {a.explanation != null && <p className="w-full text-xs text-gray-500">{String(a.explanation)}</p>}
                </div>
              );
            })}
          </div>
        )}
        {saAns.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Short Answer Solutions</h3>
            {saAns.map((a, i) => (
              <div key={i} className="mb-2">
                <p>Q{i + 1}: {String(a.question || "")}</p>
                <div className="mt-1 bg-green-50 border border-green-200 rounded p-2 text-sm">{String(a.answer || "")}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== PRINT HTML ============================== */

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string));
}

// Coerce content to a plain object — parses JSON strings, unwraps nested .content
function normalize(v: unknown): Record<string, unknown> {
  if (v == null) return {};
  let val: unknown = v;
  if (typeof val === "string") {
    const s = val.trim();
    if (s.startsWith("{") || s.startsWith("[")) {
      try { val = JSON.parse(s); } catch { return {}; }
    } else {
      return {};
    }
  }
  if (Array.isArray(val)) return { items: val };
  if (typeof val !== "object") return {};
  const obj = val as Record<string, unknown>;
  // Unwrap one level of { content: {...} } if outer has no meaningful keys
  if (obj.content && typeof obj.content === "object" && !Array.isArray(obj.content)) {
    const inner = obj.content as Record<string, unknown>;
    return { ...inner, ...Object.fromEntries(Object.entries(obj).filter(([k]) => k !== "content")) };
  }
  return obj;
}

function toArray<T = unknown>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v == null) return [];
  if (typeof v === "string") {
    const s = v.trim();
    if (s.startsWith("[")) { try { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; } }
    return [];
  }
  return [];
}

const E = (v: unknown) => escapeHtml(String(v ?? ""));

function renderList(items: unknown[]): string {
  if (!items.length) return "";
  return `<ul>${items.map((it) => {
    if (it == null) return "";
    if (typeof it === "string" || typeof it === "number") return `<li>${E(it)}</li>`;
    const o = it as Record<string, unknown>;
    const text = o.text ?? o.question ?? o.statement ?? o.prompt ?? o.description ?? o.title ?? "";
    return `<li>${E(text)}</li>`;
  }).join("")}</ul>`;
}

function renderPlan(raw: unknown): string {
  const c = normalize(raw);
  if (!Object.keys(c).length) return "<p><em>No lesson plan generated.</em></p>";
  let html = "";
  if (c.title) html += `<h3>${E(c.title)}</h3>`;
  if (c.overview || c.summary) html += `<p>${E(c.overview ?? c.summary)}</p>`;

  const objectives = toArray<string>(c.objectives ?? c.learningObjectives);
  if (objectives.length) html += `<h4>Learning Objectives</h4>${renderList(objectives)}`;

  const materials = toArray<string>(c.materials ?? c.resources);
  if (materials.length) html += `<h4>Materials</h4>${renderList(materials)}`;

  const warmup = normalize(c.warmup ?? c.warmUp ?? c.introduction);
  if (Object.keys(warmup).length) {
    html += `<h4>Warm-up</h4>`;
    if (warmup.description) html += `<p>${E(warmup.description)}</p>`;
    const wq = toArray(warmup.questions ?? warmup.activities);
    if (wq.length) html += renderList(wq);
  }

  const mainContent = toArray<Record<string, unknown>>(c.mainContent ?? c.main ?? c.lesson);
  if (mainContent.length) {
    html += `<h4>Main Content</h4>`;
    mainContent.forEach((step) => {
      const s = normalize(step);
      if (s.title || s.heading) html += `<h5>${E(s.title ?? s.heading)}</h5>`;
      if (s.description ?? s.content ?? s.text) html += `<p>${E(s.description ?? s.content ?? s.text)}</p>`;
      const pts = toArray(s.points ?? s.bullets ?? s.items);
      if (pts.length) html += renderList(pts);
    });
  }

  const activities = toArray(c.activities);
  if (activities.length) { html += `<h4>Activities</h4>`; html += renderList(activities); }

  const recap = normalize(c.recap ?? c.conclusion ?? c.closure);
  if (Object.keys(recap).length) {
    html += `<h4>Recap</h4>`;
    if (recap.summary) html += `<p>${E(recap.summary)}</p>`;
    const kp = toArray<string>(recap.keyPoints);
    if (kp.length) html += renderList(kp);
    const cq = toArray<string>(recap.checkQuestions);
    if (cq.length) { html += `<p><strong>Check Questions:</strong></p>${renderList(cq)}`; }
  }

  const homework = c.homework ?? c.assignment;
  if (homework) html += `<h4>Homework</h4><p>${E(typeof homework === "string" ? homework : normalize(homework).description ?? "")}</p>`;

  return html || "<p><em>No structured content available.</em></p>";
}

function renderWorksheet(raw: unknown): string {
  const c = normalize(raw);
  if (!Object.keys(c).length) return "<p><em>No worksheet generated.</em></p>";
  let html = "";
  if (c.title) html += `<h3>${E(c.title)}</h3>`;
  if (c.instructions) html += `<p><em>${E(c.instructions)}</em></p>`;

  const sections = toArray<Record<string, unknown>>(c.sections ?? c.activities);
  if (!sections.length) {
    // fallback to top-level text fields
    const lines = Object.entries(c)
      .filter(([k, v]) => !["title", "instructions", "sections", "activities"].includes(k) && (typeof v === "string" || typeof v === "number"))
      .map(([k, v]) => `<p><strong>${E(k)}:</strong> ${E(v)}</p>`).join("");
    return html + (lines || "<p><em>No sections found.</em></p>");
  }

  sections.forEach((sec, i) => {
    const s = normalize(sec);
    html += `<h4>${E(s.title ?? s.heading ?? `Section ${i + 1}`)}</h4>`;
    if (s.instructions ?? s.description) html += `<p><em>${E(s.instructions ?? s.description)}</em></p>`;

    const questions = toArray(s.questions);
    const problems = toArray<Record<string, unknown>>(s.problems);

    if (questions.length) {
      html += `<ol>${questions.map((q) => {
        if (typeof q === "string" || typeof q === "number") return `<li>${E(q)}</li>`;
        const qo = normalize(q);
        return `<li>${E(qo.text ?? qo.question ?? qo.prompt ?? "")}</li>`;
      }).join("")}</ol>`;
    }
    if (problems.length) {
      html += `<ol>${problems.map((p) => {
        const po = normalize(p);
        return `<li>${E(po.statement ?? po.question ?? po.text ?? "")}</li>`;
      }).join("")}</ol>`;
    }
    if (!questions.length && !problems.length) {
      Object.entries(s).forEach(([k, v]) => {
        if (["title", "heading", "instructions", "description", "type", "questions", "problems"].includes(k)) return;
        if (typeof v === "string" || typeof v === "number") html += `<p>${E(v)}</p>`;
      });
    }
  });
  return html;
}

function renderQuiz(raw: unknown): string {
  const c = normalize(raw);
  if (!Object.keys(c).length) return "<p><em>No quiz generated.</em></p>";
  let html = "";
  if (c.title) html += `<h3>${E(c.title)}</h3>`;
  if (c.instructions) html += `<p><em>${E(c.instructions)}</em></p>`;

  const sections = normalize(c.sections ?? c);
  const mcq = toArray<Record<string, unknown>>(sections.mcq);
  const tf = toArray<Record<string, unknown>>(sections.trueFalse ?? sections.true_false);
  const sa = toArray<Record<string, unknown>>(sections.shortAnswer ?? sections.short_answer);

  if (mcq.length) {
    html += `<h4>Multiple Choice</h4><ol>`;
    mcq.forEach((q) => {
      const qo = normalize(q);
      html += `<li>${E(qo.question ?? qo.text ?? "")}`;
      const opts = toArray(qo.options);
      if (opts.length) {
        html += `<ul style="list-style:upper-alpha;">${opts.map((o) => `<li>${E(typeof o === "string" ? o : normalize(o).text ?? "")}</li>`).join("")}</ul>`;
      }
      html += `</li>`;
    });
    html += `</ol>`;
  }
  if (tf.length) {
    html += `<h4>True or False</h4><ol>`;
    tf.forEach((q) => { html += `<li>${E(normalize(q).question ?? normalize(q).statement ?? "")}</li>`; });
    html += `</ol>`;
  }
  if (sa.length) {
    html += `<h4>Short Answer</h4><ol>`;
    sa.forEach((q) => { html += `<li>${E(normalize(q).question ?? normalize(q).text ?? "")}</li>`; });
    html += `</ol>`;
  }
  return html || "<p><em>No quiz questions found.</em></p>";
}

function renderRubric(raw: unknown): string {
  const c = normalize(raw);
  if (!Object.keys(c).length) return "<p><em>No rubric generated.</em></p>";
  let html = "";
  if (c.title) html += `<h3>${E(c.title)}</h3>`;
  const criteria = toArray<Record<string, unknown>>(c.criteria);
  if (!criteria.length) return html + "<p><em>No criteria found.</em></p>";

  html += `<table style="width:100%;border-collapse:collapse;margin-top:8px;">
    <thead><tr style="background:#f3f4f6;">
      <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;">Criterion</th>
      <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;">Description</th>
      <th style="border:1px solid #e5e7eb;padding:8px;text-align:left;">Levels</th>
    </tr></thead><tbody>`;
  criteria.forEach((cr) => {
    const co = normalize(cr);
    const levels = toArray<Record<string, unknown>>(co.levels);
    const levelsHtml = levels.length
      ? levels.map((l) => { const lo = normalize(l); return `<div><strong>${E(lo.label ?? lo.name ?? lo.score ?? "")}:</strong> ${E(lo.description ?? lo.text ?? "")}</div>`; }).join("")
      : "—";
    html += `<tr>
      <td style="border:1px solid #e5e7eb;padding:8px;vertical-align:top;"><strong>${E(co.name ?? co.title ?? "")}</strong></td>
      <td style="border:1px solid #e5e7eb;padding:8px;vertical-align:top;">${E(co.description ?? "")}</td>
      <td style="border:1px solid #e5e7eb;padding:8px;vertical-align:top;">${levelsHtml}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

function renderAnswerKey(raw: unknown): string {
  const c = normalize(raw);
  if (!Object.keys(c).length) return "<p><em>No answer key generated.</em></p>";
  let html = "";
  const ws = normalize(c.worksheet);
  const qz = normalize(c.quiz);

  const fillBlanks = toArray<string>(ws.fillBlanks);
  const shortAns = toArray<Record<string, unknown>>(ws.shortAnswers);
  const longAns = toArray<Record<string, unknown>>(ws.longAnswers);
  const mcqAns = toArray<Record<string, unknown>>(qz.mcq);
  const tfAns = toArray<Record<string, unknown>>(qz.trueFalse ?? qz.true_false);
  const saAns = toArray<Record<string, unknown>>(qz.shortAnswer ?? qz.short_answer);

  if (fillBlanks.length || shortAns.length || longAns.length) {
    html += `<h4>Worksheet Answers</h4>`;
    if (fillBlanks.length) { html += `<p><strong>Fill in the blanks:</strong></p><ol>${fillBlanks.map((a) => `<li>${E(a)}</li>`).join("")}</ol>`; }
    if (shortAns.length) {
      html += `<p><strong>Short Answers:</strong></p><ol>`;
      shortAns.forEach((a) => { const ao = normalize(a); html += `<li>${E(ao.answer ?? ao.text ?? "")}</li>`; });
      html += `</ol>`;
    }
    if (longAns.length) {
      html += `<p><strong>Long Answers:</strong></p><ol>`;
      longAns.forEach((a) => {
        const ao = normalize(a);
        html += `<li>${E(ao.answer ?? ao.text ?? "")}`;
        const kp = toArray<string>(ao.keyPoints);
        if (kp.length) html += renderList(kp);
        html += `</li>`;
      });
      html += `</ol>`;
    }
  }

  if (mcqAns.length || tfAns.length || saAns.length) {
    html += `<h4>Quiz Answers</h4>`;
    if (mcqAns.length) {
      html += `<p><strong>Multiple Choice:</strong></p><ol>`;
      mcqAns.forEach((a) => { const ao = normalize(a); html += `<li>${E(ao.correct ?? ao.answer ?? "")}${ao.explanation ? ` — <em>${E(ao.explanation)}</em>` : ""}</li>`; });
      html += `</ol>`;
    }
    if (tfAns.length) {
      html += `<p><strong>True/False:</strong></p><ol>`;
      tfAns.forEach((a) => { const ao = normalize(a); html += `<li>${E(ao.correct ?? ao.answer ?? "")}</li>`; });
      html += `</ol>`;
    }
    if (saAns.length) {
      html += `<p><strong>Short Answer:</strong></p><ol>`;
      saAns.forEach((a) => { const ao = normalize(a); html += `<li>${E(ao.answer ?? ao.text ?? "")}</li>`; });
      html += `</ol>`;
    }
  }

  return html || "<p><em>No answers found.</em></p>";
}

function buildPrintHTML(lesson: Lesson, parts: { plan: AnyContent; worksheet: AnyContent; quiz: AnyContent; rubric: AnyContent; key: AnyContent }) {
  return `<!doctype html><html><head><title>${E(lesson.topic)} — AI Gurukul</title>
  <style>
    body{font-family:Inter,system-ui,sans-serif;max-width:800px;margin:24px auto;padding:0 20px;color:#1F2937;line-height:1.55;}
    h1,h2,h3,h4,h5{color:#3730a3;margin-top:1em;}
    h1{font-size:28px;} h2{font-size:22px;} h3{font-size:18px;} h4{font-size:16px;} h5{font-size:14px;}
    p{margin:0.5em 0;} ul,ol{margin:0.5em 0 0.5em 1.5em;} li{margin:0.25em 0;}
    .header{border-bottom:2px solid #4F46E5;padding-bottom:12px;margin-bottom:24px;}
    .meta{color:#6b7280;font-size:14px;margin:4px 0;}
    section{margin-bottom:32px;page-break-inside:avoid;}
    table{font-size:14px;}
    footer{margin-top:48px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;padding-top:16px;}
    @media print { section { page-break-inside: avoid; } }
  </style></head><body>
  <div class="header">
    <h1>AI Gurukul</h1>
    <h2>${E(lesson.topic)}</h2>
    <p class="meta">${E(lesson.subject)} · Grade ${E(lesson.grade)}${lesson.language ? ` · ${E(lesson.language)}` : ""}</p>
    <p class="meta">Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  <section><h2>Lesson Plan</h2>${renderPlan(parts.plan)}</section>
  <section><h2>Worksheet</h2>${renderWorksheet(parts.worksheet)}</section>
  <section><h2>Quiz</h2>${renderQuiz(parts.quiz)}</section>
  <section><h2>Rubric</h2>${renderRubric(parts.rubric)}</section>
  <section><h2>Answer Key</h2>${renderAnswerKey(parts.key)}</section>
  <footer>Generated by AI Gurukul</footer>
  </body></html>`;
}
