import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Droplets, 
  Plus, 
  Minus, 
  Target,
  TrendingUp,
  Calendar,
  GlassWater
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";

const quickAmounts = [
  { value: 150, label: "Taza", icon: "☕" },
  { value: 250, label: "Vaso", icon: "🥤" },
  { value: 500, label: "Botella", icon: "🧴" },
  { value: 750, label: "Botella grande", icon: "💧" }
];

export default function Hydration() {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [customAmount, setCustomAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: todayMetrics } = useQuery({
    queryKey: ["metrics", today],
    queryFn: async () => {
      const metrics = await base44.entities.HealthMetric.filter({ date: today });
      return metrics[0] || null;
    }
  });

  const { data: weekMetrics = [] } = useQuery({
    queryKey: ["metrics", "week", "water"],
    queryFn: async () => {
      const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      return base44.entities.HealthMetric.filter({
        date: { $gte: startDate }
      });
    }
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.filter({ is_active: true })
  });

  const updateMutation = useMutation({
    mutationFn: async (water_ml) => {
      if (todayMetrics?.id) {
        return base44.entities.HealthMetric.update(todayMetrics.id, { water_ml });
      } else {
        return base44.entities.HealthMetric.create({ date: today, water_ml });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    }
  });

  const waterGoal = goals.find(g => g.type === "water")?.target_value || 2000;
  const currentWater = todayMetrics?.water_ml || 0;
  const progress = (currentWater / waterGoal) * 100;

  const handleAdd = (amount) => {
    updateMutation.mutate(currentWater + amount);
  };

  const handleRemove = (amount) => {
    updateMutation.mutate(Math.max(0, currentWater - amount));
  };

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount);
    if (!isNaN(amount) && amount > 0) {
      handleAdd(amount);
      setCustomAmount("");
      setIsDialogOpen(false);
    }
  };

  // Weekly stats
  const weeklyTotal = weekMetrics.reduce((sum, m) => sum + (m.water_ml || 0), 0);
  const weeklyAvg = weekMetrics.length > 0 ? weeklyTotal / weekMetrics.length : 0;
  const daysOnTarget = weekMetrics.filter(m => (m.water_ml || 0) >= waterGoal).length;

  // Chart data
  const chartData = React.useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    return days.map((day, index) => {
      const date = format(addDays(startDate, index), "yyyy-MM-dd");
      const metric = weekMetrics.find(m => m.date === date);
      return {
        day,
        water: metric?.water_ml || 0,
        goal: waterGoal
      };
    });
  }, [weekMetrics, waterGoal]);

  // Glass visualization
  const glasses = Math.floor(currentWater / 250);
  const maxGlasses = Math.ceil(waterGoal / 250);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hidratación</h1>
          <p className="text-gray-500 mt-1">Mantén tu cuerpo hidratado</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4 mr-2" />
              Añadir cantidad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Añadir agua</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {quickAmounts.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => {
                      handleAdd(item.value);
                      setIsDialogOpen(false);
                    }}
                    className="flex items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.value} ml</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t">
                <Label>Cantidad personalizada (ml)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="350"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                  <Button onClick={handleCustomAdd} className="bg-cyan-600 hover:bg-cyan-700">
                    Añadir
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Progress Card */}
      <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-cyan-50 to-blue-50 overflow-hidden relative">
        {/* Animated water effect */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-200/30 to-transparent transition-all duration-700"
          style={{ height: `${Math.min(progress, 100)}%` }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-100">
                <Droplets className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Progreso de hoy</p>
                <p className="text-3xl font-bold text-gray-900">
                  {currentWater.toLocaleString()}
                  <span className="text-lg font-normal text-gray-500 ml-1">ml</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Meta</p>
              <p className="text-xl font-semibold text-gray-700">{waterGoal.toLocaleString()} ml</p>
            </div>
          </div>

          {/* Glass Visualization */}
          <div className="flex justify-center gap-1 mb-6 flex-wrap">
            {Array.from({ length: Math.min(maxGlasses, 10) }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-8 h-12 rounded-b-xl border-2 transition-all duration-300 relative overflow-hidden",
                  i < glasses 
                    ? "border-cyan-400" 
                    : "border-gray-200"
                )}
              >
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 bg-cyan-400 transition-all duration-300",
                    i < glasses ? "h-full" : "h-0"
                  )}
                />
              </div>
            ))}
          </div>

          <Progress value={progress} className="h-4 bg-cyan-100" />
          
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{Math.round(progress)}% completado</span>
            <span>{Math.max(0, waterGoal - currentWater).toLocaleString()} ml restantes</span>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => handleRemove(250)}
              disabled={currentWater <= 0}
              className="flex-1"
            >
              <Minus className="w-4 h-4 mr-2" />
              250 ml
            </Button>
            <Button
              onClick={() => handleAdd(250)}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              250 ml
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-gray-500">Promedio semanal</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{Math.round(weeklyAvg).toLocaleString()} ml</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-500">Días en meta</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{daysOnTarget} / 7</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">Total semanal</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{(weeklyTotal / 1000).toFixed(1)} L</p>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Historial semanal</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `${value / 1000}L`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${value.toLocaleString()} ml`, 'Agua']}
              />
              <Area
                type="monotone"
                dataKey="water"
                stroke="#06B6D4"
                strokeWidth={2}
                fill="url(#colorWater)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Benefits */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💧 Beneficios de mantenerte hidratado</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: "🧠", title: "Mejora la concentración", desc: "El cerebro necesita agua para funcionar" },
            { icon: "💪", title: "Más energía", desc: "La deshidratación causa fatiga" },
            { icon: "✨", title: "Piel saludable", desc: "Mantiene la piel hidratada y radiante" },
            { icon: "🏃", title: "Mejor rendimiento", desc: "Mejora el desempeño físico" }
          ].map((benefit, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <span className="text-2xl">{benefit.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{benefit.title}</p>
                <p className="text-sm text-gray-500">{benefit.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}