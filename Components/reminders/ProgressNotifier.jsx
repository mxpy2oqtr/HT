import React, { useEffect, useRef } from "react";
import { useNotifications } from "./NotificationService";
import { toast } from "sonner";
import { Sparkles, Trophy, Target } from "lucide-react";

// Celebratory messages when goals are achieved
const celebrationMessages = {
  water: [
    "🎉 ¡Meta de hidratación completada!",
    "💧 ¡Excelente! Has bebido suficiente agua hoy",
    "🌊 ¡Tu cuerpo te lo agradece!"
  ],
  steps: [
    "🎉 ¡Meta de pasos completada!",
    "👟 ¡Increíble! Has alcanzado tu meta de pasos",
    "🏆 ¡Eres un campeón!"
  ],
  sleep: [
    "😊 ¡Buen descanso! Has dormido lo suficiente",
    "🌙 ¡Excelente noche de sueño!"
  ],
  calories_burn: [
    "🔥 ¡Meta de calorías alcanzada!",
    "💪 ¡Has quemado todas las calorías planificadas!"
  ]
};

export default function ProgressNotifier({ 
  type, 
  currentValue, 
  targetValue, 
  previousValue 
}) {
  const { sendNotification, permission } = useNotifications();
  const hasNotifiedRef = useRef({});
  const sessionKey = `${type}-${new Date().toDateString()}`;

  useEffect(() => {
    if (!targetValue || targetValue <= 0) return;
    
    const progress = (currentValue / targetValue) * 100;
    const prevProgress = previousValue ? (previousValue / targetValue) * 100 : 0;

    // Check if just reached goal (crossed 100%)
    if (progress >= 100 && prevProgress < 100 && !hasNotifiedRef.current[`${sessionKey}-complete`]) {
      hasNotifiedRef.current[`${sessionKey}-complete`] = true;
      
      const messages = celebrationMessages[type];
      if (messages) {
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        // Show celebratory toast
        toast.success(message, {
          duration: 5000,
          icon: <Trophy className="w-5 h-5 text-amber-500" />
        });

        // Also send browser notification if permitted
        if (permission === "granted") {
          sendNotification("🎉 ¡Meta completada!", {
            body: message,
            tag: `goal-complete-${type}`
          });
        }
      }
    }

    // Milestone notifications (50%, 75%)
    const milestones = [
      { threshold: 50, key: "50" },
      { threshold: 75, key: "75" }
    ];

    milestones.forEach(({ threshold, key }) => {
      if (
        progress >= threshold && 
        prevProgress < threshold && 
        !hasNotifiedRef.current[`${sessionKey}-${key}`]
      ) {
        hasNotifiedRef.current[`${sessionKey}-${key}`] = true;
        
        const labels = {
          water: "hidratación",
          steps: "pasos",
          sleep: "sueño",
          calories_burn: "calorías"
        };

        toast(`¡${threshold}% de tu meta de ${labels[type] || type}!`, {
          description: `Vas por buen camino, ¡sigue así!`,
          icon: <Target className="w-5 h-5 text-emerald-500" />,
          duration: 4000
        });
      }
    });

  }, [currentValue, targetValue, previousValue, type, sendNotification, permission, sessionKey]);

  return null; // This is a logic-only component
}