import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Send, 
  Loader2, 
  Sparkles, 
  MessageSquare,
  Trash2,
  Plus,
  Clock,
  Activity,
  Droplets,
  Utensils,
  Moon,
  Target
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "@/components/chat/ChatMessage";
import { cn } from "@/lib/utils";

const suggestedQuestions = [
  { icon: Activity, text: "¿Cuántos pasos llevo hoy?", color: "emerald" },
  { icon: Droplets, text: "¿Cuánta agua he bebido?", color: "cyan" },
  { icon: Utensils, text: "¿Cuántas calorías consumí ayer?", color: "orange" },
  { icon: Moon, text: "¿Cómo estuvo mi sueño esta semana?", color: "purple" },
  { icon: Target, text: "¿Cómo voy con mis metas?", color: "blue" },
  { icon: Sparkles, text: "Dame consejos para mejorar mi salud", color: "pink" }
];

const quickCommands = [
  { label: "💧 Registrar 250ml de agua", command: "Registra 250ml de agua" },
  { label: "🚶 Registrar 5000 pasos", command: "Registra 5000 pasos" },
  { label: "🏃 Nueva caminata 30min", command: "Añade una caminata de 30 minutos" },
  { label: "📊 Resumen de hoy", command: "Dame un resumen completo de mis métricas de hoy" },
  { label: "📈 Resumen semanal", command: "Dame un resumen de mi progreso esta semana" }
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const messagesEndRef = useRef(null);

  const { data: todayMetrics } = useQuery({
    queryKey: ["metrics", format(new Date(), "yyyy-MM-dd")],
    queryFn: async () => {
      const metrics = await base44.entities.HealthMetric.filter({
        date: format(new Date(), "yyyy-MM-dd")
      });
      return metrics[0] || null;
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const convos = await base44.agents.listConversations({
        agent_name: "health_assistant"
      });
      setConversations(convos || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  };

  const startNewConversation = async () => {
    try {
      const newConversation = await base44.agents.createConversation({
        agent_name: "health_assistant",
        metadata: {
          name: `Chat ${format(new Date(), "d MMM HH:mm", { locale: es })}`,
          started_at: new Date().toISOString()
        }
      });
      setConversation(newConversation);
      setMessages([{
        role: "assistant",
        content: `¡Hola! 👋 Soy HealthBot, tu asistente de salud personal.\n\n**Hoy es ${format(new Date(), "EEEE d 'de' MMMM", { locale: es })}**\n\nPuedo ayudarte a:\n• 📊 Consultar tus métricas de salud\n• ✍️ Registrar actividades, comidas y agua\n• 💡 Darte consejos personalizados\n• 📈 Mostrarte resúmenes de progreso\n\n¿Qué te gustaría saber o hacer?`
      }]);
      loadConversations();
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const loadConversation = async (conv) => {
    try {
      const fullConvo = await base44.agents.getConversation(conv.id);
      setConversation(fullConvo);
      setMessages(fullConvo.messages || []);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const handleSend = async (customMessage) => {
    const messageToSend = customMessage || input.trim();
    if (!messageToSend || isLoading) return;

    if (!conversation) {
      await startNewConversation();
      setTimeout(() => handleSend(messageToSend), 500);
      return;
    }

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: messageToSend }]);
    setIsLoading(true);

    try {
      const unsubscribe = base44.agents.subscribeToConversation(
        conversation.id,
        (data) => {
          if (data.messages) {
            setMessages(data.messages);
          }
        }
      );

      await base44.agents.addMessage(conversation, {
        role: "user",
        content: messageToSend
      });

      setTimeout(() => {
        unsubscribe();
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Lo siento, hubo un error. Por favor, intenta de nuevo."
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

  return (
    <div className="h-[calc(100vh-200px)] flex gap-6">
      {/* Sidebar - Conversations */}
      <Card className="w-72 border-0 shadow-sm flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-4 border-b">
          <Button 
            onClick={startNewConversation}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva conversación
          </Button>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  conversation?.id === conv.id
                    ? "bg-emerald-50 text-emerald-700"
                    : "hover:bg-gray-100"
                )}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {conv.metadata?.name || "Conversación"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(conv.created_date), "d MMM, HH:mm", { locale: es })}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Area */}
      <Card className="flex-1 border-0 shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-emerald-500 to-emerald-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">HealthBot</h2>
              <p className="text-sm text-white/80">Tu asistente de salud personal</p>
            </div>
          </div>
        </div>

        {/* Messages or Welcome */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {!conversation ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Bienvenido a HealthBot!
              </h3>
              <p className="text-gray-500 mb-8 max-w-md">
                Tu asistente inteligente para consultar métricas, registrar actividades y recibir consejos personalizados.
              </p>

              {/* Quick Stats */}
              {todayMetrics && (
                <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-md">
                  <div className="p-3 bg-white rounded-xl border text-center">
                    <p className="text-2xl font-bold text-emerald-600">{todayMetrics.steps || 0}</p>
                    <p className="text-xs text-gray-500">Pasos hoy</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border text-center">
                    <p className="text-2xl font-bold text-cyan-600">{todayMetrics.water_ml || 0}</p>
                    <p className="text-xs text-gray-500">ml de agua</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border text-center">
                    <p className="text-2xl font-bold text-purple-600">{todayMetrics.sleep_hours || 0}h</p>
                    <p className="text-xs text-gray-500">Sueño</p>
                  </div>
                </div>
              )}

              {/* Suggested Questions */}
              <div className="w-full max-w-lg">
                <p className="text-sm text-gray-500 mb-3">Prueba preguntando:</p>
                <div className="grid grid-cols-2 gap-2">
                  {suggestedQuestions.map((q, idx) => {
                    const Icon = q.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          startNewConversation().then(() => {
                            setTimeout(() => handleSend(q.text), 600);
                          });
                        }}
                        className="flex items-center gap-2 p-3 bg-white rounded-xl border hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left text-sm"
                      >
                        <Icon className={cn("w-4 h-4 flex-shrink-0", `text-${q.color}-500`)} />
                        <span className="text-gray-700">{q.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button 
                onClick={startNewConversation}
                className="mt-8 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Iniciar conversación
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <ChatMessage key={idx} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">HealthBot está pensando...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Quick Commands */}
        {conversation && messages.length <= 2 && (
          <div className="px-4 py-2 border-t bg-white flex gap-2 overflow-x-auto">
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(cmd.command)}
                className="text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition-colors whitespace-nowrap"
              >
                {cmd.label}
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
              placeholder="Escribe tu mensaje o pregunta..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}