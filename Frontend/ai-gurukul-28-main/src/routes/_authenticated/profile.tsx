import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LANGUAGES } from "@/lib/subjectStyle";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

interface Profile {
  id: string; full_name: string | null; school_name: string | null;
  role: string | null; language_preference: string | null; created_at: string;
}

function ProfilePage() {
  const { user, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, month: 0, favSubject: "—", langs: 0 });

  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [role, setRole] = useState("Teacher");
  const [language, setLanguage] = useState("English");

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const [pRes, totalRes, monthRes, lessonsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("lessons").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("lessons").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart),
          supabase.from("lessons").select("subject, language").eq("user_id", user.id),
        ]);
        const p = pRes.data as Profile | null;
        setProfile(p);
        setFullName(p?.full_name || "");
        setSchoolName(p?.school_name || "");
        setRole(p?.role || "Teacher");
        setLanguage(p?.language_preference || "English");
        const subjectCounts = new Map<string, number>();
        const langs = new Set<string>();
        for (const l of lessonsRes.data || []) {
          subjectCounts.set(l.subject, (subjectCounts.get(l.subject) || 0) + 1);
          if (l.language) langs.add(l.language);
        }
        const favSubject = [...subjectCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
        setStats({ total: totalRes.count ?? 0, month: monthRes.count ?? 0, favSubject, langs: langs.size });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        full_name: fullName, school_name: schoolName, role, language_preference: language,
      }).eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      toast.success("Reset email sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const deleteAll = async () => {
    if (!user) return;
    const { error } = await supabase.from("lessons").delete().eq("user_id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("All lessons deleted");
      navigate({ to: "/dashboard" });
    }
  };

  if (loading) return <div className="p-6"><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /></div>;

  const initial = (profile?.full_name?.[0] || user?.email?.[0] || "?").toUpperCase();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Profile header */}
      <div className="bg-white rounded-2xl border p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="h-24 w-24 rounded-full bg-indigo-600 text-white text-4xl font-bold flex items-center justify-center">
          {initial}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold">{profile?.full_name || "Educator"}</h1>
          <p className="text-gray-500">{user?.email}</p>
          <span className="mt-2 inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
            {profile?.role || "Teacher"}
          </span>
          {profile?.created_at && (
            <p className="text-xs text-gray-400 mt-2">
              Member since {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="font-semibold text-lg mb-4">Edit Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <Input className="mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>School Name</Label>
            <Input className="mt-1.5" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Role</Label>
            <div className="mt-1.5 grid grid-cols-3 gap-2 max-w-md">
              {["Teacher", "Tutor", "Trainer"].map((r) => (
                <button key={r} onClick={() => setRole(r)} className={`py-2 rounded-lg border-2 text-sm font-medium ${role === r ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Default Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Stat emoji="📚" label="Total Lessons" value={stats.total} />
        <Stat emoji="📅" label="This Month" value={stats.month} />
        <Stat emoji="⭐" label="Favorite Subject" value={stats.favSubject} />
        <Stat emoji="🌍" label="Languages Used" value={stats.langs} />
      </div>

      {/* Account */}
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="font-semibold text-lg mb-4">Account Settings</h2>
        <div className="space-y-3">
          <div>
            <Label>Email</Label>
            <Input readOnly value={user?.email || ""} className="mt-1.5 bg-gray-50" />
          </div>
          <Button variant="outline" onClick={handleReset}>Reset Password</Button>
        </div>
      </div>

      {/* Danger */}
      <div className="border border-red-200 rounded-xl p-6 bg-red-50/30">
        <h2 className="font-semibold text-red-700 mb-3">⚠ Danger Zone</h2>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">Delete All Lessons</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete all lessons?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete all your lessons. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAll} className="bg-red-600 hover:bg-red-700">Delete All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function Stat({ emoji, label, value }: { emoji: string; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="text-2xl">{emoji}</div>
      <div className="text-2xl font-bold mt-2">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
