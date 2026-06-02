import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserRole = "teacher" | "tutor" | "student";

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const raw = (data?.role || "student").toLowerCase();
      const normalized: UserRole =
        raw === "teacher" || raw === "tutor" || raw === "student" ? (raw as UserRole) : "student";
      setRole(normalized);
      setFullName(data?.full_name || "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { role, fullName, loading: loading || authLoading, user };
}
