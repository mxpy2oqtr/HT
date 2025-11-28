import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function WaterTracker({ current = 0, target = 2000, onAdd, onRemove }) {
  const glasses = Math.floor(current / 250);
  const targetGlasses = Math.ceil(target / 250);
  const progress = (current / target) * 100;

  return (
    <Card className="p-5 border-0 shadow-sm overflow-hidden relative">
      {/* Decorative background */}
      <div 
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-100/50 to-transparent transition-all duration-500"
        style={{ height: `${Math.min(progress, 100)}%` }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-600">
              <Droplets className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900">Hidratación</h3>
          </div>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>

        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-gray-900">
            {current.toLocaleString()}
            <span className="text-lg font-normal text-gray-500 ml-1">ml</span>
          </div>
          <p className="text-sm text-gray-500">de {target.toLocaleString()} ml</p>
        </div>

        {/* Glass indicators */}
        <div className="flex justify-center gap-1 mb-4 flex-wrap">
          {Array.from({ length: Math.min(targetGlasses, 8) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-6 h-8 rounded-b-lg border-2 transition-all duration-300",
                i < glasses 
                  ? "bg-cyan-400 border-cyan-500" 
                  : "bg-white border-gray-200"
              )}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove?.(250)}
            disabled={current <= 0}
            className="flex-1"
          >
            <Minus className="w-4 h-4 mr-1" />
            250ml
          </Button>
          <Button
            size="sm"
            onClick={() => onAdd?.(250)}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            250ml
          </Button>
        </div>
      </div>
    </Card>
  );
}