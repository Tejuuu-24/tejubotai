import ReactMarkdown from "react-markdown";
import type { Message } from "@/lib/chat-stream";

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className="mb-6 last:mb-0">
      <div
        className={`font-serif text-base leading-relaxed whitespace-pre-wrap ${
          isUser ? "text-card-foreground" : "text-ai-text"
        }`}
      >
        {isUser ? (
          message.content
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:font-mono prose-headings:text-card-foreground prose-p:text-ai-text prose-li:text-ai-text prose-strong:text-card-foreground prose-code:text-card-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded-none prose-pre:bg-muted prose-pre:rounded-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
