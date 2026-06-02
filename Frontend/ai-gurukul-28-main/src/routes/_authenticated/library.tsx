import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, LayoutGrid, List, Heart, Trash2, BookOpen, Plus, Globe, FileEdit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { subjectColor, SUBJECTS, GRADES } from "@/lib/subjectStyle";

export const Route = createFileRoute("/_authenticated/library")({
  component: LibraryPage,
});

interface Lesson {
  id: string; user_id: string; subject: string; grade: string; topic: string;
  title: string | null; language: string | null; is_favorite: boolean;
  status: string; created_at: string;
}

const PAGE = 12;

function LibraryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az" | "favorites">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      const v = localStorage.getItem("library_view");
      if (v === "list" || v === "grid") return v;
    }
    return "grid";
  });
  const [deleteTarget, setDeleteTarget] = useState<Lesson | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("library_view", viewMode);
  }, [viewMode]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const offset = page * PAGE;
      let q = supabase.from("lessons").select("*", { count: "exact" })
        .eq("user_id", user.id);
      if (sortBy === "newest") q = q.order("created_at", { ascending: false });
      else if (sortBy === "oldest") q = q.order("created_at", { ascending: true });
      else if (sortBy === "az") q = q.order("topic", { ascending: true });
      else q = q.order("is_favorite", { ascending: false }).order("created_at", { ascending: false });
      const { data, count, error } = await q.range(offset, offset + PAGE - 1);
      if (error) throw error;
      setLessons((data || []) as Lesson[]);
      setTotalCount(count ?? 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load library");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [user, page, sortBy]);

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      if (subjectFilter !== "all" && l.subject !== subjectFilter) return false;
      if (gradeFilter !== "all" && l.grade !== gradeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.topic.toLowerCase().includes(q) ||
          l.subject.toLowerCase().includes(q) ||
          l.grade.toLowerCase().includes(q) ||
          (l.title || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [lessons, search, subjectFilter, gradeFilter]);

  const favorites = lessons.filter((l) => l.is_favorite);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE));

  const toggleFav = async (l: Lesson) => {
    const newVal = !l.is_favorite;
    setLessons((prev) => prev.map((x) => (x.id === l.id ? { ...x, is_favorite: newVal } : x)));
    const { error } = await supabase.from("lessons").update({ is_favorite: newVal }).eq("id", l.id);
    if (error) toast.error("Failed to update favorite");
    else toast.success(newVal ? "Added to favorites" : "Removed from favorites");
  };

  const toggleStatus = async (l: Lesson) => {
    const newStatus = l.status === "published" ? "draft" : "published";
    setLessons((prev) => prev.map((x) => (x.id === l.id ? { ...x, status: newStatus } : x)));
    const { error } = await supabase.from("lessons").update({ status: newStatus }).eq("id", l.id);
    if (error) {
      toast.error("Failed to update status");
      setLessons((prev) => prev.map((x) => (x.id === l.id ? { ...x, status: l.status } : x)));
    } else {
      toast.success(newStatus === "published" ? "Lesson published" : "Moved to draft");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || !user) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    const { error } = await supabase.from("lessons").delete().eq("id", id).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else {
      setLessons((p) => p.filter((x) => x.id !== id));
      toast.success("Lesson deleted");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">📚 My Lesson Library</h1>
          <span className="text-sm bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{totalCount} lessons</span>
        </div>
        <Link to="/generate">
          <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-1" /> Generate New</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 mt-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-10" placeholder="Search lessons…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as never)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="az">A-Z</SelectItem>
              <SelectItem value="favorites">Favorites First</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-1 border rounded-lg p-1">
            <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-indigo-100 text-indigo-700" : "text-gray-400"}`}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded ${viewMode === "list" ? "bg-indigo-100 text-indigo-700" : "text-gray-400"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Favorites strip */}
      {favorites.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">⭐ Favorites</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {favorites.map((l) => (
              <Link to="/lesson/$id" params={{ id: l.id }} key={l.id} className="min-w-[220px] bg-white rounded-xl border p-3 hover:shadow-sm">
                <div className="text-xs text-gray-500">{l.subject} · {l.grade}</div>
                <div className="font-semibold text-sm line-clamp-2 mt-1">{l.topic}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main grid/list */}
      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 font-semibold text-lg">Your lesson library is empty</h3>
            <p className="text-gray-500 mt-1">Start generating AI-powered lesson kits for your classes</p>
            <Link to="/generate"><Button className="mt-6 bg-indigo-600 hover:bg-indigo-700">Generate First Lesson</Button></Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((l) => <LessonCard key={l.id} lesson={l} onFav={toggleFav} onStatus={toggleStatus} onDelete={() => setDeleteTarget(l)} onView={() => navigate({ to: "/lesson/$id", params: { id: l.id } })} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((l) => {
              const c = subjectColor(l.subject);
              return (
                <div key={l.id} className="bg-white rounded-xl border overflow-hidden flex hover:shadow-sm transition-shadow">
                  <div className={`w-1.5 ${c.strip}`} />
                  <div className="flex-1 p-4 flex items-center gap-4 flex-wrap">
                    <div className="text-2xl">{c.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{l.topic}</div>
                      <div className="text-xs text-gray-500">{l.subject} · {l.grade} · {l.language}</div>
                    </div>
                    <div className="text-xs text-gray-400">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}</div>
                    <StatusBadge status={l.status} onClick={() => toggleStatus(l)} />
                    <button onClick={() => toggleFav(l)} className="p-2"><Heart className={`h-4 w-4 ${l.is_favorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} /></button>
                    <Link to="/lesson/$id" params={{ id: l.id }}><Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">View</Button></Link>
                    <button onClick={() => setDeleteTarget(l)} className="p-2 text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-2">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-600">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status, onClick }: { status: string; onClick: () => void }) {
  const isPublished = status === "published";
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
      title={isPublished ? "Click to unpublish" : "Click to publish for students"}
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium border transition-colors ${
        isPublished
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
      }`}
    >
      {isPublished ? <Globe className="h-3 w-3" /> : <FileEdit className="h-3 w-3" />}
      {isPublished ? "Published" : "Draft"}
    </button>
  );
}

function LessonCard({
  lesson, onFav, onStatus, onDelete, onView,
}: { lesson: Lesson; onFav: (l: Lesson) => void; onStatus: (l: Lesson) => void; onDelete: () => void; onView: () => void }) {
  const c = subjectColor(lesson.subject);
  return (
    <article className="relative bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow group">
      <div className={`h-1.5 ${c.strip}`} />
      <button onClick={() => onFav(lesson)} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80">
        <Heart className={`h-4 w-4 ${lesson.is_favorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
      </button>
      <div className="p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.badge}`}>{c.emoji} {lesson.subject}</span>
          <StatusBadge status={lesson.status} onClick={() => onStatus(lesson)} />
        </div>
        <h3 className="font-semibold mt-2 line-clamp-2">{lesson.topic}</h3>
        <div className="flex gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{lesson.grade}</span>
          {lesson.language && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">{lesson.language}</span>}
        </div>
        <p className="text-xs text-gray-400 mt-2">{formatDistanceToNow(new Date(lesson.created_at), { addSuffix: true })}</p>
        <div className="flex gap-1 mt-3 pt-3 border-t text-base opacity-80">📚 📝 ❓ 📊 🔑</div>
      </div>
      <div className="absolute inset-0 bg-white/95 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button onClick={onView} className="bg-indigo-600 hover:bg-indigo-700">View Lesson</Button>
        <Button variant="outline" onClick={onDelete} className="text-red-600 border-red-200 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
