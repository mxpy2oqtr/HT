import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  Sparkles,
  Minimize2,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import ChatMessage from "./ChatMessage";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !conversation) {
      initConversation();
    }
  }, [isOpen]);

  const initConversation = async () => {
    try {
      const newConversation = await base44.agents.createConversation({
        agent_name: "health_assistant",
        metadata: {
          name: "Chat de Salud",
          started_at: new Date().toISOString()
        }
      });
      setConversation(newConversation);
      
      // Add welcome message
      setMessages([{
        role: "assistant",
        content: "¡Hola! 👋 Soy tu asistente de salud. Puedo ayudarte a:\n\n• 📊 Consultar tus métricas (pasos, agua, sueño, calorías)\n• ✍️ Registrar actividades y comidas\n• 💡 Darte consejos personalizados\n• 📈 Mostrarte resúmenes de tu progreso\n\n¿En qué puedo ayudarte hoy?"
      }]);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !conversation) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Subscribe to updates for streaming
      const unsubscribe = base44.agents.subscribeToConversation(
        conversation.id,
        (data) => {
          if (data.messages) {
            // Get the latest assistant message
            const assistantMessages = data.messages.filter(m => m.role === "assistant");
            if (assistantMessages.length > 0) {
              const latestAssistant = assistantMessages[assistantMessages.length - 1];
              setMessages(prev => {
                const userMessages = prev.filter(m => m.role === "user");
                const lastUserIdx = prev.length - 1;
                // Keep user messages and update/add assistant response
                const newMessages = [...prev];
                const existingAssistantIdx = newMessages.findIndex(
                  (m, idx) => idx > lastUserIdx && m.role === "assistant"
                );
                if (existingAssistantIdx >= 0) {
                  newMessages[existingAssistantIdx] = latestAssistant;
                } else {
                  newMessages.push(latestAssistant);
                }
                return newMessages;
              });
            }
          }
        }
      );

      // Send message
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userMessage
      });

      // Wait a bit then unsubscribe
      setTimeout(() => {
        unsubscribe();
        setIsLoading(false);
      }, 500);

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo."
      }]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    { label: "📊 Mi resumen de hoy", action: "Dame un resumen de mis métricas de hoy" },
    { label: "💧 Registrar agua", action: "Quiero registrar agua" },
    { label: "🏃 Nueva actividad", action: "Quiero registrar una actividad" },
    { label: "💡 Dame un consejo", action: "Dame un consejo para mejorar mi salud hoy" }
  ];

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200 z-50"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 z-50 shadow-2xl border-0 overflow-hidden transition-all duration-300",
      isMinimized ? "w-80 h-14" : "w-96 h-[600px] max-h-[80vh]"
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">HealthBot</h3>
            <p className="text-xs text-white/80">Tu asistente de salud</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[420px] bg-gray-50">
            {messages.map((message, idx) => (
              <ChatMessage key={idx} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Escribiendo...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 bg-gray-50">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(action.action);
                    setTimeout(() => handleSend(), 100);
                  }}
                  className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}