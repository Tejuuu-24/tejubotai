import ReactMarkdown from "react-markdown";
import type { Message } from "@/lib/chat-stream";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-ai-bubble flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={16} className="text-ai-bubble-foreground" />
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-user-bubble text-user-bubble-foreground rounded-br-md"
            : "bg-ai-bubble text-ai-bubble-foreground rounded-bl-md"
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-headings:text-ai-bubble-foreground prose-p:text-ai-bubble-foreground prose-li:text-ai-bubble-foreground prose-strong:text-foreground prose-code:text-primary prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-secondary prose-pre:rounded-lg">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-user-bubble flex items-center justify-center shrink-0 mt-0.5">
          <User size={16} className="text-user-bubble-foreground" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
