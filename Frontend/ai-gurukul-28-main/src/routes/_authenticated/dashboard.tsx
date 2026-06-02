import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { BookOpen, TrendingUp, Heart, Globe, Sparkles, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { subjectColor, SUBJECTS, GRADES } from "@/lib/subjectStyle";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

interface Lesson {
  id: string;
  subject: string;
  grade: string;
  topic: string;
  title: string | null;
  language: string | null;
  is_favorite: boolean;
  created_at: string;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, week: 0, favorites: 0, languages: 0 });
  const [recent, setRecent] = useState<Lesson[]>([]);
  const [fullName, setFullName] = useState("");

  // quick gen
  const [qSubject, setQSubject] = useState("");
  const [qGrade, setQGrade] = useState("");
  const [qTopic, setQTopic] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const [totalRes, weekRes, favRes, recentRes, profileRes] = await Promise.all([
          supabase.from("lessons").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("lessons").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekAgo),
          supabase.from("lessons").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_favorite", true),
          supabase.from("lessons").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(6),
          supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        ]);
        const langs = new Set((recentRes.data || []).map((l) => l.language).filter(Boolean));
        setStats({
          total: totalRes.count ?? 0,
          week: weekRes.count ?? 0,
          favorites: favRes.count ?? 0,
          languages: langs.size,
        });
        setRecent((recentRes.data || []) as Lesson[]);
        setFullName(profileRes.data?.full_name || "");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const toggleFavorite = async (l: Lesson) => {
    const newVal = !l.is_favorite;
    setRecent((prev) => prev.map((x) => (x.id === l.id ? { ...x, is_favorite: newVal } : x)));
    await supabase.from("lessons").update({ is_favorite: newVal }).eq("id", l.id);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {greeting()}, {fullName || "Teacher"}! 🌟
          </h1>
          <p className="text-gray-500 mt-1">Ready to inspire your students today?</p>
        </div>
        <Link to="/generate">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Sparkles className="h-4 w-4 mr-2" /> Generate New Lesson
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <StatCard icon={BookOpen} bg="bg-indigo-100" iconColor="text-indigo-600" value={stats.total} label="Total Lessons" sub="lessons in library" loading={loading} />
        <StatCard icon={TrendingUp} bg="bg-green-100" iconColor="text-green-600" value={stats.week} label="This Week" sub="recently created" loading={loading} />
        <StatCard icon={Heart} bg="bg-red-100" iconColor="text-red-600" value={stats.favorites} label="Favorites" sub="starred lessons" loading={loading} />
        <StatCard icon={Globe} bg="bg-purple-100" iconColor="text-purple-600" value={stats.languages || "—"} label="Languages Used" sub="across lessons" loading={loading} />
      </div>

      {/* Quick generate */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mt-6">
        <h2 className="font-bold flex items-center gap-2">⚡ Quick Generate</h2>
        <p className="text-sm text-gray-500">Jump right in with a quick lesson</p>
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <Select value={qSubject} onValueChange={setQSubject}>
            <SelectTrigger className="md:w-48"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={qGrade} onValueChange={setQGrade}>
            <SelectTrigger className="md:w-44"><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
          </Select>
          <Input className="flex-1" placeholder="Topic — e.g., Photosynthesis" value={qTopic} onChange={(e) => setQTopic(e.target.value)} />
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => navigate({ to: "/generate", search: { subject: qSubject, grade: qGrade, topic: qTopic } as never })}
          >
            Generate <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Recent */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Recent Lessons</h2>
          <Link to="/library" className="text-sm text-indigo-600 hover:underline">View All →</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border mt-4">
            <div className="text-6xl">📚</div>
            <h3 className="mt-4 font-semibold text-lg">No lessons yet</h3>
            <p className="text-gray-500 mt-2">Generate your first AI lesson kit and it will appear here</p>
            <Link to="/generate">
              <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700">Generate Now →</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {recent.map((l) => {
              const c = subjectColor(l.subject);
              return (
                <Link key={l.id} to="/lesson/$id" params={{ id: l.id }} className="block group">
                  <article className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow relative">
                    <div className={`h-1.5 ${c.strip}`} />
                    <button
                      onClick={(e) => { e.preventDefault(); toggleFavorite(l); }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white"
                    >
                      <Heart className={`h-4 w-4 ${l.is_favorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                    </button>
                    <div className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.badge}`}>
                        {c.emoji} {l.subject}
                      </span>
                      <h3 className="font-semibold mt-2 line-clamp-2">{l.topic}</h3>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{l.grade}</span>
                        {l.language && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">{l.language}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</p>
                      <div className="flex gap-1 mt-3 text-base opacity-80">📚 📝 ❓ 📊 🔑</div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, bg, iconColor, value, label, sub, loading,
}: {
  icon: React.ElementType; bg: string; iconColor: string;
  value: number | string; label: string; sub: string; loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border shadow-sm">
      <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      {loading ? <div className="h-8 w-16 bg-gray-100 rounded mt-3 animate-pulse" /> :
        <div className="text-3xl font-bold mt-3">{value}</div>}
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  );
}
