import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout } from "@/components/AppLayout";
import { useProfile } from "@/hooks/useProfile";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

// Routes that only teachers may visit. Students get redirected to /student,
// tutors get redirected to /tutor.
const TEACHER_ONLY = ["/dashboard", "/generate", "/library"];

function RoleRouter() {
  const { role, loading } = useProfile();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !role) return;

    const isTeacherOnly = TEACHER_ONLY.some((p) => pathname.startsWith(p));

    if (role === "student") {
      // Students stay locked to the student view.
      if (isTeacherOnly || pathname === "/tutor" || pathname.startsWith("/tutor/")) {
        navigate({ to: "/student", replace: true });
      }
      return;
    }

    if (role === "tutor") {
      // Tutors land on their console; block teacher-only authoring routes.
      if (isTeacherOnly) {
        navigate({ to: "/tutor", replace: true });
      }
      return;
    }

    // Teachers: keep them out of the tutor console.
    if (role === "teacher" && (pathname === "/tutor" || pathname.startsWith("/tutor/"))) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [role, loading, pathname, navigate]);

  return <Outlet />;
}

function AuthenticatedLayout() {
  return (
    <AuthGuard>
      <AppLayout>
        <RoleRouter />
      </AppLayout>
    </AuthGuard>
  );
}
