import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { toast } from "sonner";

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

// Smart notification messages based on progress
const getSmartMessage = (type, progress, goal) => {
  const messages = {
    water: {
      below_50: [
        "💧 ¡Tu cuerpo necesita agua! Solo llevas {current}ml de {goal}ml",
        "💧 ¡Hora de hidratarse! Vas al {progress}% de tu meta",
        "💧 Recuerda beber agua, tu cerebro te lo agradecerá"
      ],
      below_75: [
        "💧 ¡Buen progreso! Llevas {current}ml, solo te faltan {remaining}ml",
        "💧 Vas muy bien con la hidratación, ¡sigue así!"
      ],
      near_goal: [
        "💧 ¡Casi lo logras! Solo {remaining}ml más para tu meta",
        "💧 ¡Increíble! Un vaso más y completas tu objetivo de agua"
      ]
    },
    steps: {
      below_50: [
        "👟 ¡A moverse! Solo llevas {current} pasos de {goal}",
        "👟 Tu cuerpo necesita movimiento, sal a caminar un poco",
        "👟 Cada paso cuenta, ¡levántate y camina!"
      ],
      below_75: [
        "👟 ¡Vas genial! {current} pasos hasta ahora",
        "👟 Buen ritmo, te faltan {remaining} pasos para tu meta"
      ],
      near_goal: [
        "👟 ¡Ya casi! Solo {remaining} pasos más, ¡tú puedes!",
        "👟 ¡Increíble progreso! Una caminata corta y lo logras",
        "🎯 ¡Estás a punto de completar tu meta de pasos!"
      ]
    },
    meal: {
      no_activity: [
        "🍽️ ¿Ya desayunaste? Registra tu comida",
        "🍽️ No olvides registrar tu almuerzo",
        "🍽️ ¿Qué cenaste hoy? Registra tus comidas"
      ]
    },
    exercise: {
      no_activity: [
        "🏃 ¿Ya hiciste ejercicio hoy?",
        "💪 Tu cuerpo te pide movimiento, ¡actívate!",
        "🧘 30 minutos de ejercicio mejoran tu día"
      ]
    },
    sleep: {
      below_75: [
        "😴 Dormiste {current}h anoche, intenta descansar más hoy",
        "🌙 Tu cuerpo necesita {goal}h de sueño para rendir mejor"
      ],
      near_goal: [
        "😊 ¡Buen descanso anoche! {current}h de sueño"
      ]
    }
  };

  const typeMessages = messages[type];
  if (!typeMessages) return null;

  let category;
  if (progress < 50) category = "below_50";
  else if (progress < 75) category = "below_75";
  else if (progress >= 75) category = "near_goal";
  
  if (type === "meal" || type === "exercise") category = "no_activity";

  const categoryMessages = typeMessages[category];
  if (!categoryMessages) return null;

  const template = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  
  return template
    .replace("{current}", goal.current?.toLocaleString() || "0")
    .replace("{goal}", goal.target?.toLocaleString() || "0")
    .replace("{remaining}", (goal.target - goal.current)?.toLocaleString() || "0")
    .replace("{progress}", Math.round(progress));
};

export function NotificationProvider({ children }) {
  const [permission, setPermission] = useState("default");
  const [isSupported, setIsSupported] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    // Check if browser supports notifications
    if ("Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error("Tu navegador no soporta notificaciones");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast.success("¡Notificaciones activadas!");
        return true;
      } else {
        toast.error("Permiso de notificaciones denegado");
        return false;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback((title, options = {}) => {
    if (permission !== "granted") {
      // Fallback to toast notification
      toast(title, {
        description: options.body,
        icon: options.icon
      });
      return;
    }

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || "/favicon.ico",
        badge: "/favicon.ico",
        tag: options.tag || "healthtrack",
        requireInteraction: options.requireInteraction || false,
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) options.onClick();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      return notification;
    } catch (error) {
      console.error("Error sending notification:", error);
      toast(title, { description: options.body });
    }
  }, [permission]);

  const checkSmartReminders = useCallback(async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    
    // Prevent checking too frequently (every 30 min max)
    const now = Date.now();
    if (lastCheck && now - lastCheck < 30 * 60 * 1000) {
      return;
    }
    setLastCheck(now);

    try {
      // Fetch current metrics and goals
      const [metrics, goals, reminders] = await Promise.all([
        base44.entities.HealthMetric.filter({ date: today }),
        base44.entities.Goal.filter({ is_active: true }),
        base44.entities.Reminder.filter({ is_smart: true, is_active: true })
      ]);

      const todayMetric = metrics[0] || {};

      // Check each smart reminder
      for (const reminder of reminders) {
        const goal = goals.find(g => {
          if (reminder.type === "water") return g.type === "water";
          if (reminder.type === "steps") return g.type === "steps";
          if (reminder.type === "sleep") return g.type === "sleep";
          return false;
        });

        if (!goal) continue;

        let currentValue = 0;
        if (reminder.type === "water") currentValue = todayMetric.water_ml || 0;
        if (reminder.type === "steps") currentValue = todayMetric.steps || 0;
        if (reminder.type === "sleep") currentValue = todayMetric.sleep_hours || 0;

        const progress = (currentValue / goal.target_value) * 100;

        // Check if trigger condition is met
        let shouldTrigger = false;
        switch (reminder.smart_trigger) {
          case "below_50":
            shouldTrigger = progress < 50;
            break;
          case "below_75":
            shouldTrigger = progress >= 50 && progress < 75;
            break;
          case "near_goal":
            shouldTrigger = progress >= 75 && progress < 100;
            break;
        }

        if (shouldTrigger) {
          // Check if already triggered today
          const lastTriggered = reminder.last_triggered ? new Date(reminder.last_triggered) : null;
          const triggeredToday = lastTriggered && format(lastTriggered, "yyyy-MM-dd") === today;

          if (!triggeredToday) {
            const message = getSmartMessage(reminder.type, progress, {
              current: currentValue,
              target: goal.target_value
            });

            if (message) {
              sendNotification(reminder.title, {
                body: message,
                tag: `smart-${reminder.type}-${today}`
              });

              // Update last triggered
              await base44.entities.Reminder.update(reminder.id, {
                last_triggered: new Date().toISOString()
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking smart reminders:", error);
    }
  }, [lastCheck, sendNotification]);

  const sendMotivationalNotification = useCallback((type, currentValue, targetValue) => {
    const progress = (currentValue / targetValue) * 100;
    const message = getSmartMessage(type, progress, {
      current: currentValue,
      target: targetValue
    });

    if (message) {
      const titles = {
        water: "💧 Recordatorio de hidratación",
        steps: "👟 Recordatorio de actividad",
        meal: "🍽️ Recordatorio de alimentación",
        exercise: "💪 Hora de ejercitarse",
        sleep: "😴 Recordatorio de descanso"
      };

      sendNotification(titles[type] || "HealthTrack", {
        body: message,
        tag: `motivation-${type}`
      });
    }
  }, [sendNotification]);

  const value = {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    checkSmartReminders,
    sendMotivationalNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}