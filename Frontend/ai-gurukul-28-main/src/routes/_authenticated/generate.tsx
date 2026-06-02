import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { GraduationCap, CheckCircle, Loader2, ChevronRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateLesson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUBJECTS, GRADES, LANGUAGES } from "@/lib/subjectStyle";

export const Route = createFileRoute("/_authenticated/generate")({
  validateSearch: (s: Record<string, unknown>) => ({
    subject: typeof s.subject === "string" ? s.subject : "",
    grade: typeof s.grade === "string" ? s.grade : "",
    topic: typeof s.topic === "string" ? s.topic : "",
  }),
  component: GeneratorPage,
});

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"];
const DURATIONS = ["20 minutes", "30 minutes", "45 minutes", "60 minutes", "90 minutes"];

const COMPONENTS = [
  { id: "lesson_plan", emoji: "📚", name: "Lesson Plan", desc: "Objectives, concepts, activities" },
  { id: "worksheet", emoji: "📝", name: "Worksheet", desc: "Practice problems and exercises" },
  { id: "quiz", emoji: "❓", name: "Quiz", desc: "MCQs, short answers, true/false" },
  { id: "rubric", emoji: "📊", name: "Rubric", desc: "Grading criteria table" },
  { id: "answer_key", emoji: "🔑", name: "Answer Key", desc: "Complete solutions guide" },
];

const STEPS = [
  "Analyzing your requirements...",
  "Crafting lesson plan...",
  "Building worksheet...",
  "Creating quiz...",
  "Writing answer key...",
];

function GeneratorPage() {
  const search = useSearch({ from: "/_authenticated/generate" });
  const navigate = useNavigate();

  const [subject, setSubject] = useState(search.subject || "");
  const [grade, setGrade] = useState(search.grade || "");
  const [topic, setTopic] = useState(search.topic || "");
  const [duration, setDuration] = useState("45 minutes");
  const [objectives, setObjectives] = useState("");
  const [language, setLanguage] = useState("English");
  const [difficulty, setDifficulty] = useState("Medium");
  const [selected, setSelected] = useState<string[]>(COMPONENTS.map((c) => c.id));

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;
    setProgress(0);
    const timeouts = [1000, 3000, 6000, 9000, 12000].map((d, i) =>
      setTimeout(() => setProgress(i + 1), d)
    );
    return () => timeouts.forEach(clearTimeout);
  }, [loading]);

  const canSubmit = !!subject && !!topic && selected.length > 0 && !loading;

  const toggleComp = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const submit = async () => {
    // Get fresh user directly from Supabase
    const { data: { user: currentUser }, error: authError } = 
      await supabase.auth.getUser();
    
    if (authError || !currentUser) {
      toast.error('Authentication error. Please login again.');
      return;
    }

    if (!currentUser.id) {
      toast.error('Could not get user ID. Please logout and login again.');
      return;
    }

    if (!canSubmit) return;

    // Log for debugging
    console.log('Current user ID:', currentUser.id);
    console.log('User email:', currentUser.email);

    setLoading(true);
    setError(null);

    try {
      // Single consolidated n8n webhook payload — only the 6 base parameters.
      // n8n runs the AI pass and forwards results to the `save-lesson` Edge
      // Function, which inserts into all 5 child tables before returning.
      const payload = {
        user_id: currentUser.id,
        subject,
        grade,
        topic,
        duration,
        objectives,
      };

      console.log('Sending payload:', JSON.stringify(payload));

      const res = await generateLesson(payload);

      console.log('Received lesson_id from n8n:', res.lesson_id);

      toast.success('Lesson kit generated!');

      // LessonViewerPage will load lesson_content / worksheets / quizzes /
      // rubrics / answer_keys for this lesson_id using the existing queries.
      navigate({ to: "/lesson/$id", params: { id: res.lesson_id } });
    } catch (err) {
      console.error('Generation error:', err);
      const msg = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/dashboard" className="hover:text-indigo-600">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-800">Generate Lesson</span>
      </div>
      <h1 className="mt-3 text-2xl font-bold text-indigo-900">✨ Generate Lesson Kit</h1>
      <p className="text-gray-500">Fill in the details and AI will create your complete lesson kit</p>

      <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8 mt-6">
        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-20 w-20 rounded-full bg-indigo-600 text-white flex items-center justify-center animate-pulse shadow-lg">
              <GraduationCap className="h-10 w-10" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">🤖 AI is crafting your lesson kit...</h2>
            <p className="text-sm text-gray-400">Powered by Google Gemini</p>
            <div className="mt-8 max-w-md mx-auto space-y-3 text-left">
              {STEPS.map((s, i) => (
                <div key={s} className={`flex items-center gap-2 ${i < progress ? "" : "opacity-30"}`}>
                  {i < progress ? <CheckCircle className="h-5 w-5 text-green-500" /> : <div className="h-5 w-5 rounded-full border-2 border-gray-200" />}
                  <span className="text-sm">{s}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-amber-600 text-sm">⏱ Usually takes 15-30 seconds</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-800">Something went wrong</p>
                  <p className="text-sm text-red-700">{error}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={submit}>Retry</Button>
                </div>
              </div>
            )}

            <h3 className="font-semibold border-b pb-2 mb-6">Lesson Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Subject *">
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Grade Level *">
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Topic *" sub={`${topic.length}/200`}>
                <Input maxLength={200} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Quadratic Equations, Photosynthesis" />
              </Field>
              <Field label="Duration">
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DURATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Learning Objectives" sub={`${objectives.length}/500`}>
                <Textarea
                  rows={3}
                  maxLength={500}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  placeholder="What should students be able to do after this lesson?"
                />
              </Field>
            </div>

            <h3 className="font-semibold border-b pb-2 mb-6 mt-8">Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Output Language">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Difficulty Level">
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>

            <h3 className="font-semibold border-b pb-2 mb-6 mt-8">Select Components</h3>
            <p className="text-sm text-gray-500 mb-3">Choose what AI should generate:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COMPONENTS.map((c) => {
                const isOn = selected.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleComp(c.id)}
                    className={`relative border-2 rounded-xl p-4 text-left transition-all ${
                      isOn ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    {isOn && <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-indigo-600" />}
                    <div className="text-2xl">{c.emoji}</div>
                    <div className="font-semibold text-sm mt-1">{c.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{c.desc}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={submit}
              disabled={!canSubmit}
              className={`mt-8 w-full py-4 rounded-xl text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 ${
                !canSubmit ? "opacity-50 cursor-not-allowed" : "hover:from-indigo-700 hover:to-purple-700"
              }`}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin inline" /> :
                <>🚀 Generate Lesson Kit <span className="text-xs opacity-80 ml-2">({selected.length} components selected)</span></>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
