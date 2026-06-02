import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  ShieldCheck,
  Eye,
  BookOpen,
  Search,
  Users,
  GraduationCap,
  Mail,
  Calendar,
  UserCircle,
  LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { subjectColor } from "@/lib/subjectStyle";
import { getTutorOverview } from "@/lib/tutor.functions";

export const Route = createFileRoute("/_authenticated/tutor")({
  component: TutorConsole,
});

interface Lesson {
  id: string;
  subject: string;
  grade: string;
  topic: string;
  title: string | null;
  language: string | null;
  status: string;
  created_at: string;
  user_id: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
  email: string;
  created_at: string;
}

function TutorConsole() {
  const fetchOverview = useServerFn(getTutorOverview);

  // Overview data
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<{
    totalTeachers: number;
    totalStudents: number;
    teachers: Profile[];
    students: Profile[];
  } | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Lessons data
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");

  useEffect(() => {
    fetchOverview()
      .then((data) => {
        setOverviewData(data);
        setOverviewLoading(false);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load overview");
        setOverviewLoading(false);
      });
  }, [fetchOverview]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("lessons")
          .select("id, subject, grade, topic, title, language, status, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        setLessons((data || []) as Lesson[]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load lessons");
      } finally {
        setLessonsLoading(false);
      }
    })();
  }, []);

  const filteredLessons = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lessons.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.topic?.toLowerCase().includes(q) ||
        l.subject?.toLowerCase().includes(q) ||
        l.grade?.toLowerCase().includes(q) ||
        (l.title || "").toLowerCase().includes(q)
      );
    });
  }, [lessons, search, statusFilter]);

  const publishedOnly = useMemo(() => lessons.filter((l) => l.status === "published"), [lessons]);

  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return overviewData?.teachers || [];
    return (overviewData?.teachers || []).filter(
      (t) =>
        t.full_name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
    );
  }, [overviewData, teacherSearch]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return overviewData?.students || [];
    return (overviewData?.students || []).filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }, [overviewData, studentSearch]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tutor Master Control Console</h1>
          <p className="text-sm text-gray-500">
            Oversee every lesson and user on the platform.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutDashboard className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="all">
            <BookOpen className="h-4 w-4 mr-2" /> All Lessons
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" /> Student Preview
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Teachers Registered</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overviewLoading ? "..." : overviewData?.totalTeachers ?? 0}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Students Registered</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overviewLoading ? "..." : overviewData?.totalStudents ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Directories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teacher Profiles Directory */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-indigo-600" />
                  Teacher Profiles Directory
                </h2>
              </div>
              <div className="p-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search teachers..."
                    value={teacherSearch}
                    onChange={(e) => setTeacherSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {overviewLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filteredTeachers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <UserCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No teachers found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredTeachers.map((t) => (
                      <div key={t.id} className="py-3 flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-indigo-700">
                            {(t.full_name || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {t.full_name || "Unnamed"}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {t.email && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Mail className="h-3 w-3" />
                                {t.email}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Student Profiles Directory */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b bg-gray-50/50">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  Student Profiles Directory
                </h2>
              </div>
              <div className="p-4">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {overviewLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <UserCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No students found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredStudents.map((s) => (
                      <div key={s.id} className="py-3 flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-emerald-700">
                            {(s.full_name || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {s.full_name || "Unnamed"}
                          </p>
                          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                            {s.email && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Mail className="h-3 w-3" />
                                {s.email}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Calendar className="h-3 w-3" />
                              {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* All Lessons Tab */}
        <TabsContent value="all" className="mt-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by topic, subject, or grade"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(["all", "draft", "published"] as const).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "default" : "outline"}
                  onClick={() => setStatusFilter(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {lessonsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 font-semibold text-lg">No lessons match your filters</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLessons.map((l) => (
                <LessonCard key={l.id} lesson={l} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Student Preview Tab */}
        <TabsContent value="preview" className="mt-4">
          <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-4 mb-4">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <Eye className="h-4 w-4" /> Simulated Student View
            </div>
            <p className="text-sm text-emerald-700/80 mt-1">
              Showing only lessons with status <strong>published</strong> — exactly what a
              student would see.{" "}
              <Link to="/student" className="underline font-medium">
                Open full student dashboard →
              </Link>
            </p>
          </div>

          {lessonsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : publishedOnly.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="mt-4 font-semibold text-lg">No published lessons yet</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publishedOnly.map((l) => (
                <LessonCard key={l.id} lesson={l} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LessonCard({ lesson: l }: { lesson: Lesson }) {
  const c = subjectColor(l.subject);
  const isPublished = l.status === "published";
  return (
    <Link to="/lesson/$id" params={{ id: l.id }} className="block group">
      <article className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow">
        <div className={`h-1.5 ${c.strip}`} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.badge}`}>
              {c.emoji} {l.subject}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isPublished
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </span>
          </div>
          <h3 className="font-semibold mt-2 line-clamp-2">{l.topic}</h3>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{l.grade}</span>
            {l.language && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {l.language}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
          </p>
        </div>
      </article>
    </Link>
  );
}
