import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const features = [
  { icon: "📚", title: "Lesson Plans", desc: "Complete warm-up, concept explanation, activity, recap and homework" },
  { icon: "📝", title: "Worksheets", desc: "Auto-generated practice problems at multiple difficulty levels" },
  { icon: "❓", title: "Smart Quizzes", desc: "MCQs, true/false, and short answer questions ready to print" },
  { icon: "📊", title: "Grading Rubrics", desc: "Clear assessment criteria for objective grading" },
  { icon: "🔑", title: "Answer Keys", desc: "Complete solution guides generated automatically" },
  { icon: "🌏", title: "Multi-Language", desc: "Generate in English, Hindi, Tamil, Telugu and more" },
];

const stats = [
  { value: "10,000+", label: "Lessons Generated" },
  { value: "5", label: "Content Types" },
  { value: "10+", label: "Indian Languages" },
  { value: "< 60s", label: "Generation Time" },
];

const steps = [
  { n: 1, title: "Fill the Form", desc: "Enter subject, grade, topic, duration and objectives" },
  { n: 2, title: "AI Generates", desc: "Gemini AI creates all 5 components simultaneously in seconds" },
  { n: 3, title: "Download & Teach", desc: "Export as PDF, save to library, regenerate any section" },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-indigo-700" />
            <span className="font-bold text-lg">AI Gurukul</span>
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
              Beta
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-indigo-900 via-indigo-900 to-purple-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(245,158,11,0.4), transparent 50%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.4), transparent 50%)" }} />
        <div className="relative max-w-5xl mx-auto text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Trusted by 10,000+ Indian Educators
          </span>
          <h1 className="mt-8 text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">
            Create Complete<br />
            Lesson Kits in<br />
            <span className="text-amber-400">60 Seconds</span>
          </h1>
          <p className="mt-6 text-xl text-indigo-200 max-w-2xl mx-auto">
            AI generates lesson plans, worksheets, quizzes, rubrics & answer keys instantly. In English, Hindi, or your regional language.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-amber-400 hover:bg-amber-300 text-indigo-900 font-bold text-base px-8 py-6 rounded-xl">
                Generate Your First Lesson Free <ArrowRight className="h-5 w-5 ml-1" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-900 text-base px-8 py-6 rounded-xl bg-transparent">
              Watch How It Works
            </Button>
          </div>

          {/* Floating cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { emoji: "📚", text: "Lesson Plan - Quadratic Equations, Grade 9", rot: "-rotate-2" },
              { emoji: "❓", text: "Quiz - 10 Questions Generated", rot: "rotate-1" },
              { emoji: "📝", text: "Worksheet - 3 Difficulty Levels", rot: "-rotate-1" },
            ].map((c, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl shadow-2xl p-6 text-left text-gray-800 transform ${c.rot} hover:rotate-0 transition-transform`}
              >
                <div className="text-3xl mb-2">{c.emoji}</div>
                <p className="font-semibold text-sm">{c.text}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="h-1.5 bg-gray-100 rounded-full"></div>
                  <div className="h-1.5 bg-gray-100 rounded-full w-3/4"></div>
                  <div className="h-1.5 bg-gray-100 rounded-full w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-indigo-950 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-400">{s.value}</div>
              <div className="text-sm text-indigo-200 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-900 text-center">
            Everything a Teacher Needs
          </h2>
          <p className="mt-3 text-center text-gray-500 max-w-2xl mx-auto">
            One AI workflow generates every piece of your lesson kit.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">
                  {f.icon}
                </div>
                <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-indigo-900 text-center">
            How It Works
          </h2>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((s) => (
              <div key={s.n} className="text-center relative">
                <div className="mx-auto h-20 w-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-black shadow-lg">
                  {s.n}
                </div>
                <h3 className="mt-6 font-bold text-xl">{s.title}</h3>
                <p className="mt-2 text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="h-6 w-6 text-amber-400" />
            <span className="font-bold text-lg">AI Gurukul</span>
          </div>
          <p className="mt-2 text-indigo-200 text-sm">AI-Powered Teaching Assistant</p>
          <p className="mt-4 text-indigo-300 text-sm flex items-center justify-center gap-1">
            Made with <span className="text-red-400">❤</span> for Indian Educators
          </p>
          <p className="mt-2 text-xs text-indigo-400">© 2024 AI Gurukul</p>
        </div>
      </footer>
    </div>
  );
}

// Helper for unused import
void CheckCircle2;
