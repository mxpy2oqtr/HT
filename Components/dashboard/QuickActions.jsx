import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { 
  Plus, 
  Footprints, 
  Utensils, 
  Droplets, 
  Moon,
  Dumbbell,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    icon: Footprints,
    label: "Registrar pasos",
    color: "emerald",
    page: "Activities",
    action: "steps"
  },
  {
    icon: Utensils,
    label: "Añadir comida",
    color: "orange",
    page: "Nutrition",
    action: "meal"
  },
  {
    icon: Droplets,
    label: "Registrar agua",
    color: "cyan",
    page: "Hydration",
    action: "water"
  },
  {
    icon: Dumbbell,
    label: "Nueva actividad",
    color: "purple",
    page: "Activities",
    action: "activity"
  },
  {
    icon: Moon,
    label: "Registro de sueño",
    color: "indigo",
    page: "Sleep",
    action: "sleep"
  },
  {
    icon: Heart,
    label: "Estado de ánimo",
    color: "pink",
    page: "Dashboard",
    action: "mood"
  }
];

const colorClasses = {
  emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 group-hover:scale-110",
  orange: "bg-orange-50 text-orange-600 hover:bg-orange-100 group-hover:scale-110",
  cyan: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100 group-hover:scale-110",
  purple: "bg-purple-50 text-purple-600 hover:bg-purple-100 group-hover:scale-110",
  indigo: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 group-hover:scale-110",
  pink: "bg-pink-50 text-pink-600 hover:bg-pink-100 group-hover:scale-110"
};

export default function QuickActions({ onAction }) {
  return (
    <Card className="p-5 border-0 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-emerald-600" />
        Acciones rápidas
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.action}
              onClick={() => onAction?.(action.action, action.page)}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              <div className={cn(
                "p-3 rounded-xl transition-all duration-300",
                colorClasses[action.color]
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-600 text-center font-medium leading-tight">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}