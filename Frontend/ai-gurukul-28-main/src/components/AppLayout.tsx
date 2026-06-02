import { useMemo, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, type UserRole } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

type NavItem = { to: string; label: string; icon: React.ElementType };

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  teacher: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/generate", label: "Generate Lesson", icon: Sparkles },
    { to: "/library", label: "My Library", icon: BookOpen },
    { to: "/profile", label: "Profile", icon: User },
  ],
  tutor: [
    { to: "/tutor", label: "Tutor Console", icon: ShieldCheck },
    { to: "/student", label: "Student Preview", icon: Users },
    { to: "/profile", label: "Profile", icon: User },
  ],
  student: [
    { to: "/student", label: "Lessons", icon: BookOpen },
    { to: "/profile", label: "Profile", icon: User },
  ],
};

function useNavItems(): NavItem[] {
  const { role } = useProfile();
  return useMemo(() => NAV_BY_ROLE[role ?? "student"], [role]);
}


function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navItems = useNavItems();
  return (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClick}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-white text-indigo-700 font-bold shadow-sm"
                : "text-indigo-100 hover:bg-indigo-700"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = (user?.email?.[0] || "?").toUpperCase();
  return (
    <div className="border-t border-indigo-700 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-indigo-900 font-bold">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-indigo-200 truncate">{user?.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        className="w-full justify-start text-indigo-100 hover:bg-indigo-700 hover:text-white"
        onClick={async () => {
          await logout();
          navigate({ to: "/" });
        }}
      >
        <LogOut className="h-4 w-4 mr-2" /> Logout
      </Button>
    </div>
  );
}

function SidebarHeader() {
  return (
    <div className="flex items-center gap-3 px-5 py-5 border-b border-indigo-700">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500">
        <GraduationCap className="h-6 w-6 text-indigo-900" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-white">AI Gurukul</span>
        <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-indigo-900">
          Beta
        </span>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navItems = useNavItems();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="sidebar hidden lg:flex w-64 flex-col bg-indigo-800 fixed inset-y-0 left-0 z-30">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto py-4">
          <NavLinks />
        </div>
        <SidebarFooter />
      </aside>

      {/* Mobile header */}
      <header className="navbar lg:hidden fixed top-0 inset-x-0 h-14 bg-white border-b z-30 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-indigo-700" />
          <span className="font-bold">AI Gurukul</span>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-indigo-800 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-2 text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarHeader />
            <div className="flex-1 overflow-y-auto py-4">
              <NavLinks onClick={() => setMobileOpen(false)} />
            </div>
            <SidebarFooter />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 pb-20 lg:pb-0 overflow-y-auto bg-gray-50 min-h-screen">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t z-30 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-xs ${
                active ? "text-indigo-700 font-semibold" : "text-gray-500"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
