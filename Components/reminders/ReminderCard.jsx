import React from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Footprints, 
  Utensils, 
  Moon, 
  Dumbbell, 
  Bell,
  Trash2,
  Edit2,
  Clock,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeConfig = {
  water: { icon: Droplets, color: "cyan", label: "Hidratación" },
  steps: { icon: Footprints, color: "emerald", label: "Pasos" },
  meal: { icon: Utensils, color: "orange", label: "Comidas" },
  sleep: { icon: Moon, color: "purple", label: "Sueño" },
  exercise: { icon: Dumbbell, color: "pink", label: "Ejercicio" },
  custom: { icon: Bell, color: "blue", label: "Personalizado" }
};

const colorClasses = {
  cyan: { bg: "bg-cyan-100", text: "text-cyan-600" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  pink: { bg: "bg-pink-100", text: "text-pink-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" }
};

const triggerLabels = {
  below_50: "< 50% de meta",
  below_75: "50-75% de meta",
  near_goal: "> 75% de meta",
  no_activity: "Sin actividad"
};

export default function ReminderCard({ 
  reminder, 
  onToggle, 
  onEdit, 
  onDelete 
}) {
  const config = typeConfig[reminder.type] || typeConfig.custom;
  const Icon = config.icon;
  const colors = colorClasses[config.color];

  const daysLabels = {
    mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D"
  };

  return (
    <Card className={cn(
      "p-4 border-0 shadow-sm transition-all",
      !reminder.is_active && "opacity-60"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn("p-2.5 rounded-xl", colors.bg)}>
          <Icon className={cn("w-5 h-5", colors.text)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{reminder.title}</h3>
            {reminder.is_smart && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Inteligente
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{reminder.message}</p>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {reminder.time && !reminder.is_smart && (
              <span className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                {reminder.time}
              </span>
            )}
            
            {reminder.is_smart && reminder.smart_trigger && (
              <Badge variant="outline" className="text-xs">
                {triggerLabels[reminder.smart_trigger]}
              </Badge>
            )}

            {reminder.days && reminder.days.length > 0 && reminder.days.length < 7 && (
              <div className="flex gap-0.5">
                {Object.entries(daysLabels).map(([day, label]) => (
                  <span
                    key={day}
                    className={cn(
                      "w-5 h-5 rounded text-xs flex items-center justify-center",
                      reminder.days.includes(day)
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {reminder.days && reminder.days.length === 7 && (
              <span className="text-gray-500">Todos los días</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={reminder.is_active}
            onCheckedChange={() => onToggle(reminder)}
          />
          <Button variant="ghost" size="icon" onClick={() => onEdit(reminder)}>
            <Edit2 className="w-4 h-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(reminder.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>
    </Card>
  );
}