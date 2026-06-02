import { useEffect, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Discussion {
  id: string;
  lesson_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  message: string;
  created_at: string;
}

export function DiscussionTab({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [me, setMe] = useState<{ name: string; role: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load profile + initial messages
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [profileRes, msgRes] = await Promise.all([
        supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
        supabase.from("discussions").select("*").eq("lesson_id", lessonId).order("created_at", { ascending: true }),
      ]);
      setMe({
        name: profileRes.data?.full_name || user.email?.split("@")[0] || "User",
        role: (profileRes.data?.role as string) || "student",
      });
      setMessages((msgRes.data || []) as Discussion[]);
      setLoading(false);
    })();
  }, [user, lessonId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`discussions:${lessonId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "discussions", filter: `lesson_id=eq.${lessonId}` },
        (payload) => {
          const row = payload.new as Discussion;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [lessonId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const msg = text.trim();
    if (!msg || !user || !me) return;
    setSending(true);
    const { error } = await supabase.from("discussions").insert({
      lesson_id: lessonId,
      user_id: user.id,
      user_name: me.name,
      user_role: me.role,
      message: msg,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-8 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border flex flex-col h-[600px]">
      <div className="px-5 py-3 border-b flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-indigo-600" />
        <h2 className="font-bold">Discussion</h2>
        <span className="text-xs text-gray-500 ml-auto">{messages.length} {messages.length === 1 ? "message" : "messages"}</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.user_id === user?.id;
            const isTeacher = (m.user_role || "").toLowerCase() === "teacher";
            return (
              <div key={m.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${isTeacher ? "bg-indigo-600 text-white" : "bg-emerald-500 text-white"}`}>
                  {(m.user_name || "?")[0].toUpperCase()}
                </div>
                <div className={`flex-1 max-w-[80%] ${isMe ? "items-end text-right" : ""} flex flex-col`}>
                  <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                    <span className="text-sm font-semibold text-gray-800">{m.user_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isTeacher ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {isTeacher ? "Teacher" : "Student"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className={`inline-block px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
                    {m.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t p-3 flex gap-2">
        <Input
          placeholder="Write a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={sending}
        />
        <Button onClick={send} disabled={sending || !text.trim()} className="bg-indigo-600 hover:bg-indigo-700">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
