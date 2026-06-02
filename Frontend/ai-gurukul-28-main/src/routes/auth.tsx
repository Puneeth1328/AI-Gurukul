import { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

const languages = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati", "Punjabi", "Odia"];

function passwordStrength(p: string) {
  if (p.length < 3) return { pct: 0, label: "", color: "" };
  if (p.length < 6) return { pct: 33, label: "Weak", color: "bg-red-500" };
  if (p.length < 8) return { pct: 66, label: "Medium", color: "bg-amber-500" };
  return { pct: 100, label: "Strong", color: "bg-green-500" };
}

function InputWithIcon({
  icon: Icon,
  rightSlot,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ElementType;
  rightSlot?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input {...props} className={`pl-10 ${rightSlot ? "pr-10" : ""} h-11 rounded-lg border-gray-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-shadow`} />
      {rightSlot && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, login, signup, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"teacher" | "tutor" | "student">("teacher");
  const [language, setLanguage] = useState("English");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard" });
  }, [user, authLoading, navigate]);

  const strength = passwordStrength(password);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!email) errs.email = "Email is required";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!fullName) errs.fullName = "Full name is required";
    if (!email) errs.email = "Email is required";
    if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords don't match";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await signup(email, password, { full_name: fullName, role, language_preference: language });
      toast.success("Account created! Check your email to confirm.");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      toast.success("Reset link sent! Check your email.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-700 text-white flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-amber-400" />
          <span className="font-bold text-xl">AI Gurukul</span>
        </Link>
        <div>
          <blockquote className="text-3xl xl:text-4xl font-bold leading-snug">
            "The art of teaching is the art of assisting discovery."
          </blockquote>
          <p className="mt-4 text-indigo-200">— Mark Van Doren</p>
          <ul className="mt-10 space-y-3 text-indigo-100">
            {[
              "Generate complete lesson kits in seconds",
              "Save and organize all your lessons",
              "Export to PDF with one click",
              "10+ Indian languages supported",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-amber-400 text-indigo-900 flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-indigo-200 text-sm">Join 10,000+ educators</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FAFAF9]">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <GraduationCap className="h-7 w-7 text-indigo-700" />
            <span className="font-bold text-xl">AI Gurukul</span>
          </Link>

          {mode === "forgot" ? (
            <div className="bg-white rounded-2xl border shadow-sm p-8">
              <button
                onClick={() => {
                  setMode("login");
                  setResetSent(false);
                }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4"
              >
                <ArrowLeft className="h-4 w-4" /> Back to login
              </button>
              <h1 className="text-2xl font-bold">Reset your password</h1>
              <p className="text-gray-500 text-sm mt-1">
                Enter your email and we'll send you a reset link.
              </p>
              {resetSent ? (
                <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-800">
                  ✓ Reset email sent. Check your inbox.
                </div>
              ) : (
                <form onSubmit={handleReset} className="mt-6 space-y-4">
                  <div>
                    <Label>Email</Label>
                    <div className="mt-1.5">
                      <InputWithIcon
                        icon={Mail}
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-lg"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-indigo-100/40 p-8">
              <h1 className="text-2xl font-bold">
                {mode === "login" ? "Welcome back" : "Create account"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {mode === "login"
                  ? "Sign in to access your lesson library"
                  : "Start generating lesson kits in seconds"}
              </p>

              {/* Tabs */}
              <div className="mt-6 flex border-b">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m);
                      setErrors({});
                    }}
                    className={`pb-3 px-4 text-sm font-medium border-b-2 -mb-px ${
                      mode === m
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-gray-500"
                    }`}
                  >
                    {m === "login" ? "Login" : "Sign Up"}
                  </button>
                ))}
              </div>

              {mode === "login" ? (
                <form onSubmit={handleLogin} className="mt-6 space-y-4">
                  <div>
                    <Label>Email</Label>
                    <div className="mt-1.5">
                      <InputWithIcon
                        icon={Mail}
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label>Password</Label>
                    <div className="mt-1.5">
                      <InputWithIcon
                        icon={Lock}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        rightSlot={
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="p-1.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      />
                    </div>
                    {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-sm text-indigo-600 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-lg"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Login"}
                  </Button>
                  <div className="text-center text-sm text-gray-400">— or —</div>
                  <p className="text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Sign Up
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="mt-6 space-y-4">
                  <div>
                    <Label>Full Name</Label>
                    <div className="mt-1.5">
                      <InputWithIcon
                        icon={UserIcon}
                        placeholder="Your name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                    {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="mt-1.5">
                      <InputWithIcon
                        icon={Mail}
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <Label>Password</Label>
                    <div className="mt-1.5">
                      <InputWithIcon
                        icon={Lock}
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        rightSlot={
                          <button
                            type="button"
                            onClick={() => setShowPassword((s) => !s)}
                            className="p-1.5 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      />
                    </div>
                    {password.length >= 3 && (
                      <div className="mt-2">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${strength.color} transition-all`}
                            style={{ width: `${strength.pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
                      </div>
                    )}
                    {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <Label>Confirm Password</Label>
                    <div className="mt-1.5">
                      <InputWithIcon
                        icon={Lock}
                        type="password"
                        placeholder="Repeat password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>
                  <div>
                    <Label>I am a</Label>
                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                      {([
                        { value: "teacher", label: "Teacher", emoji: "👩‍🏫" },
                        { value: "tutor", label: "Tutor", emoji: "🧑‍💼" },
                        { value: "student", label: "Student", emoji: "🎓" },
                      ] as const).map((r) => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setRole(r.value)}
                          className={`py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                            role === r.value
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm scale-[1.02]"
                              : "border-gray-200 hover:border-indigo-300 text-gray-600"
                          }`}
                        >
                          <span className="mr-1">{r.emoji}</span>
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Language preference</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="mt-1.5 h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-lg shadow-md shadow-indigo-200 transition-transform hover:scale-[1.02] active:scale-[0.99]"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                  </Button>
                  <p className="text-center text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Login
                    </button>
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
