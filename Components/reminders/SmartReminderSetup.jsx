import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Droplets, 
  Footprints, 
  Moon,
  ChevronRight,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const smartReminders = [
  {
    type: "water",
    icon: Droplets,
    color: "cyan",
    title: "Recordatorios de hidratación",
    description: "Te avisamos cuando necesites beber más agua",
    triggers: [
      { value: "below_50", label: "Cuando estés por debajo del 50%", recommended: true },
      { value: "below_75", label: "Cuando estés entre 50-75%" },
      { value: "near_goal", label: "Cuando estés cerca de tu meta (ánimo)" }
    ]
  },
  {
    type: "steps",
    icon: Footprints,
    color: "emerald",
    title: "Recordatorios de actividad",
    description: "Te motivamos a alcanzar tus pasos diarios",
    triggers: [
      { value: "below_50", label: "Cuando estés por debajo del 50%", recommended: true },
      { value: "near_goal", label: "Cuando estés cerca de tu meta (ánimo)" }
    ]
  },
  {
    type: "sleep",
    icon: Moon,
    color: "purple",
    title: "Recordatorios de sueño",
    description: "Te ayudamos a mantener buenos hábitos de sueño",
    triggers: [
      { value: "below_75", label: "Si dormiste poco anoche", recommended: true }
    ]
  }
];

const colorClasses = {
  cyan: { bg: "bg-cyan-50", icon: "bg-cyan-100 text-cyan-600", border: "border-cyan-200" },
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", border: "border-emerald-200" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600", border: "border-purple-200" }
};

export default function SmartReminderSetup({ existingReminders = [], onSave, onSkip }) {
  const [selectedReminders, setSelectedReminders] = useState(() => {
    // Initialize with existing smart reminders
    const existing = {};
    existingReminders.forEach(r => {
      if (r.is_smart) {
        existing[r.type] = r.smart_trigger;
      }
    });
    return existing;
  });

  const toggleReminder = (type, trigger) => {
    setSelectedReminders(prev => {
      const newState = { ...prev };
      if (newState[type] === trigger) {
        delete newState[type];
      } else {
        newState[type] = trigger;
      }
      return newState;
    });
  };

  const handleSave = () => {
    const remindersToCreate = Object.entries(selectedReminders).map(([type, trigger]) => {
      const config = smartReminders.find(r => r.type === type);
      return {
        type,
        title: config?.title || "Recordatorio inteligente",
        message: `Recordatorio basado en tu progreso de ${type}`,
        is_smart: true,
        is_active: true,
        smart_trigger: trigger,
        days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
      };
    });
    onSave(remindersToCreate);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Recordatorios Inteligentes</h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Configura recordatorios que se activan automáticamente basándose en tu progreso diario
        </p>
      </div>

      <div className="space-y-4">
        {smartReminders.map((reminder) => {
          const Icon = reminder.icon;
          const colors = colorClasses[reminder.color];
          const isSelected = selectedReminders[reminder.type];

          return (
            <Card 
              key={reminder.type}
              className={cn(
                "p-5 border-2 transition-all",
                isSelected ? colors.border : "border-gray-100"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("p-3 rounded-xl", colors.icon)}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{reminder.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{reminder.description}</p>

                  <div className="space-y-2">
                    {reminder.triggers.map((trigger) => (
                      <button
                        key={trigger.value}
                        onClick={() => toggleReminder(reminder.type, trigger.value)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left",
                          selectedReminders[reminder.type] === trigger.value
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-gray-100 hover:border-gray-200 bg-gray-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            selectedReminders[reminder.type] === trigger.value
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-gray-300"
                          )}>
                            {selectedReminders[reminder.type] === trigger.value && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{trigger.label}</span>
                        </div>
                        {trigger.recommended && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            Recomendado
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={onSkip} className="flex-1">
          Saltar por ahora
        </Button>
        <Button 
          onClick={handleSave} 
          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          disabled={Object.keys(selectedReminders).length === 0}
        >
          Activar recordatorios
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}