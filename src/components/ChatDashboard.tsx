import { useState, useRef, useEffect } from "react";
import { streamChat, type Message } from "@/lib/chat-stream";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { toast } from "sonner";

const ChatDashboard = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (input: string) => {
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

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
        messages: [...messages, userMsg],
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setIsLoading(false),
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
    <div className="fixed inset-0 flex items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-[800px] h-full max-h-[90vh] flex flex-col bg-card shadow-none">
        {/* Chat area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 sm:p-10">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
                Begin.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={i} message={msg} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="mb-6">
              <span className="inline-block w-2 h-5 bg-accent animate-pulse" />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSubmit={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatDashboard;
