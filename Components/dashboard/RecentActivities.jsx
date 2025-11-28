import React from "react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Footprints, 
  Bike, 
  Dumbbell, 
  Waves, 
  Timer,
  Flame,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const activityIcons = {
  walking: Footprints,
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  gym: Dumbbell,
  yoga: Timer,
  sports: Dumbbell,
  other: Timer
};

const activityColors = {
  walking: "bg-emerald-100 text-emerald-600",
  running: "bg-orange-100 text-orange-600",
  cycling: "bg-blue-100 text-blue-600",
  swimming: "bg-cyan-100 text-cyan-600",
  gym: "bg-purple-100 text-purple-600",
  yoga: "bg-pink-100 text-pink-600",
  sports: "bg-amber-100 text-amber-600",
  other: "bg-gray-100 text-gray-600"
};

const activityNames = {
  walking: "Caminata",
  running: "Carrera",
  cycling: "Ciclismo",
  swimming: "Natación",
  gym: "Gimnasio",
  yoga: "Yoga",
  sports: "Deportes",
  other: "Otro"
};

export default function RecentActivities({ activities = [], onViewAll }) {
  if (activities.length === 0) {
    return (
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No hay actividades registradas</p>
          <p className="text-sm text-gray-400 mt-1">Comienza a registrar tu actividad diaria</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            Ver todo
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {activities.slice(0, 5).map((activity) => {
          const Icon = activityIcons[activity.type] || Timer;
          const colorClass = activityColors[activity.type] || activityColors.other;
          
          return (
            <div 
              key={activity.id}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className={cn("p-2.5 rounded-xl", colorClass)}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {activity.name || activityNames[activity.type]}
                </p>
                <p className="text-sm text-gray-500">
                  {format(new Date(activity.date), "d 'de' MMM", { locale: es })}
                  {activity.start_time && ` • ${activity.start_time}`}
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <Timer className="w-4 h-4 text-gray-400" />
                  {activity.duration_minutes} min
                </div>
                {activity.calories_burned && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Flame className="w-3 h-3 text-orange-500" />
                    {activity.calories_burned} kcal
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}