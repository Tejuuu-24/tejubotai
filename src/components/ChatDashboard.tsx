import { useState, useRef, useEffect, useCallback } from "react";
import { streamChat, type Message } from "@/lib/chat-stream";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatSidebar, { type Conversation } from "./ChatSidebar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X } from "lucide-react";

const ChatDashboard = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (data) setConversations(data);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Save messages to active conversation
  const saveMessages = useCallback(async (convId: string, msgs: Message[]) => {
    const title = msgs.find(m => m.role === "user")?.content.slice(0, 50) || "New Chat";
    await supabase
      .from("conversations")
      .update({ messages: msgs as any, title, updated_at: new Date().toISOString() })
      .eq("id", convId);
    loadConversations();
  }, [loadConversations]);

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConvId(id);
    const { data } = await supabase
      .from("conversations")
      .select("messages")
      .eq("id", id)
      .single();
    if (data?.messages) {
      setMessages(data.messages as unknown as Message[]);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    if (activeConvId === id) handleNewChat();
    loadConversations();
  };

  const handleSend = async (input: string) => {
    const userMsg: Message = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    // Create conversation if needed
    let convId = activeConvId;
    if (!convId) {
      const { data } = await supabase
        .from("conversations")
        .insert({ title: input.slice(0, 50), messages: newMessages as any })
        .select("id")
        .single();
      if (data) {
        convId = data.id;
        setActiveConvId(convId);
        loadConversations();
      }
    } else {
      await saveMessages(convId, newMessages);
    }

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => {
          setIsLoading(false);
          // Save final messages
          setMessages((prev) => {
            if (convId) saveMessages(convId, prev);
            return prev;
          });
        },
        onError: (error) => {
          toast.error(error);
          setIsLoading(false);
        },
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to connect to AI service.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-card hover:bg-secondary transition-colors sm:hidden"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "block" : "hidden"} sm:block shrink-0`}>
        <ChatSidebar
          conversations={conversations}
          activeId={activeConvId}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onDelete={handleDeleteConversation}
        />
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Start a conversation — ask me anything!
              </p>
            </div>
          )}
          <div className="max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-ai-bubble flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="bg-ai-bubble rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto w-full">
          <ChatInput onSubmit={handleSend} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;
