import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getTutorOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Verify the caller is a tutor
    const { data: myProfile, error: roleError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (roleError || !myProfile || myProfile.role !== "tutor") {
      throw new Error("Forbidden: Tutor access required");
    }

    // Fetch all profiles using admin client (bypasses RLS)
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    // Fetch user emails via auth admin API
    const emailMap: Record<string, string> = {};
    try {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (usersData?.users) {
        for (const user of usersData.users) {
          emailMap[user.id] = user.email || "";
        }
      }
    } catch {
      // Silently continue without emails if the admin API fails
    }

    const allProfiles = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name || "",
      role: p.role || "",
      email: emailMap[p.id] || "",
      created_at: p.created_at,
    }));

    const teachers = allProfiles.filter((p) => p.role === "teacher");
    const students = allProfiles.filter((p) => p.role === "student");

    return {
      totalTeachers: teachers.length,
      totalStudents: students.length,
      teachers,
      students,
    };
  });
