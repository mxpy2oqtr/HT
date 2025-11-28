import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MetricCard({ 
  icon: Icon, 
  title, 
  value, 
  unit, 
  target, 
  trend, 
  trendValue,
  color = "emerald",
  onClick 
}) {
  const progress = target ? Math.min((value / target) * 100, 100) : null;
  
  const colorClasses = {
    emerald: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-600",
      progress: "bg-emerald-500",
      progressBg: "bg-emerald-100"
    },
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-100 text-blue-600",
      progress: "bg-blue-500",
      progressBg: "bg-blue-100"
    },
    purple: {
      bg: "bg-purple-50",
      icon: "bg-purple-100 text-purple-600",
      progress: "bg-purple-500",
      progressBg: "bg-purple-100"
    },
    orange: {
      bg: "bg-orange-50",
      icon: "bg-orange-100 text-orange-600",
      progress: "bg-orange-500",
      progressBg: "bg-orange-100"
    },
    pink: {
      bg: "bg-pink-50",
      icon: "bg-pink-100 text-pink-600",
      progress: "bg-pink-500",
      progressBg: "bg-pink-100"
    },
    cyan: {
      bg: "bg-cyan-50",
      icon: "bg-cyan-100 text-cyan-600",
      progress: "bg-cyan-500",
      progressBg: "bg-cyan-100"
    }
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-gray-400";

  return (
    <Card 
      className={cn(
        "p-5 border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group",
        onClick && "hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl", colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        {trendValue && (
          <div className={cn("flex items-center gap-1 text-sm font-medium", trendColor)}>
            <TrendIcon className="w-4 h-4" />
            <span>{trendValue}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
      </div>

      {progress !== null && (
        <div className="mt-4 space-y-2">
          <div className={cn("h-2 rounded-full overflow-hidden", colors.progressBg)}>
            <div 
              className={cn("h-full rounded-full transition-all duration-500", colors.progress)}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{Math.round(progress)}% completado</span>
            <span>Meta: {target?.toLocaleString()} {unit}</span>
          </div>
        </div>
      )}
    </Card>
  );
}