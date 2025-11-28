import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { User, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser ? "bg-gray-200" : "bg-emerald-100"
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-gray-600" />
        ) : (
          <Sparkles className="w-4 h-4 text-emerald-600" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "max-w-[80%] rounded-2xl px-4 py-2.5",
        isUser 
          ? "bg-emerald-600 text-white rounded-br-md" 
          : "bg-white border border-gray-200 rounded-bl-md shadow-sm"
      )}>
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children }) => (
                  <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">{children}</code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Tool Calls Display */}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
            {message.tool_calls.map((tool, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                {tool.status === "completed" || tool.status === "success" ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : tool.status === "running" || tool.status === "in_progress" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                )}
                <span className="truncate">
                  {tool.name?.replace(".", " → ") || "Procesando..."}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}