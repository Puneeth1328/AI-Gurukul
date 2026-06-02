import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { subjectColor } from "@/lib/subjectStyle";

export const Route = createFileRoute("/_authenticated/student")({
  component: StudentDashboard,
});

interface Lesson {
  id: string;
  subject: string;
  grade: string;
  topic: string;
  title: string | null;
  language: string | null;
  created_at: string;
}

function StudentDashboard() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Students can only see published lessons (enforced by RLS + this filter)
        const { data, error } = await supabase
          .from("lessons")
          .select("id, subject, grade, topic, title, language, created_at")
          .eq("status", "published")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setLessons((data || []) as Lesson[]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load lessons");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
          <GraduationCap className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Published Lessons</h1>
          <p className="text-sm text-gray-500">Browse lessons shared by your teachers</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border mt-6">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 font-semibold text-lg">No published lessons yet</h3>
          <p className="text-gray-500 mt-1">Check back later — your teachers are preparing content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {lessons.map((l) => {
            const c = subjectColor(l.subject);
            return (
              <Link key={l.id} to="/lesson/$id" params={{ id: l.id }} className="block group">
                <article className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`h-1.5 ${c.strip}`} />
                  <div className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.badge}`}>
                      {c.emoji} {l.subject}
                    </span>
                    <h3 className="font-semibold mt-2 line-clamp-2">{l.topic}</h3>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{l.grade}</span>
                      {l.language && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {l.language}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Published
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
