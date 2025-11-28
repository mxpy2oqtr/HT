import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, addDays, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Moon, 
  Sun, 
  Clock, 
  Star,
  TrendingUp,
  Calendar,
  Plus,
  Edit2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";

const qualityOptions = [
  { value: "poor", label: "Mala", icon: "😴", color: "bg-red-100 text-red-700" },
  { value: "fair", label: "Regular", icon: "😐", color: "bg-yellow-100 text-yellow-700" },
  { value: "good", label: "Buena", icon: "🙂", color: "bg-emerald-100 text-emerald-700" },
  { value: "excellent", label: "Excelente", icon: "😄", color: "bg-purple-100 text-purple-700" }
];

export default function Sleep() {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: today,
    sleep_hours: "",
    sleep_quality: "good",
    notes: ""
  });

  const { data: todayMetrics } = useQuery({
    queryKey: ["metrics", today],
    queryFn: async () => {
      const metrics = await base44.entities.HealthMetric.filter({ date: today });
      return metrics[0] || null;
    }
  });

  const { data: weekMetrics = [] } = useQuery({
    queryKey: ["metrics", "week", "sleep"],
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
    mutationFn: async (data) => {
      if (todayMetrics?.id) {
        return base44.entities.HealthMetric.update(todayMetrics.id, data);
      } else {
        return base44.entities.HealthMetric.create({ date: today, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
      setIsDialogOpen(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      sleep_hours: parseFloat(formData.sleep_hours) || 0,
      sleep_quality: formData.sleep_quality,
      notes: formData.notes
    });
  };

  const sleepGoal = goals.find(g => g.type === "sleep")?.target_value || 8;

  // Calculate weekly stats
  const weeklyAvg = weekMetrics.length > 0
    ? weekMetrics.reduce((sum, m) => sum + (m.sleep_hours || 0), 0) / weekMetrics.length
    : 0;

  // Chart data
  const chartData = React.useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    return days.map((day, index) => {
      const date = format(addDays(startDate, index), "yyyy-MM-dd");
      const metric = weekMetrics.find(m => m.date === date);
      return {
        day,
        hours: metric?.sleep_hours || 0,
        goal: sleepGoal
      };
    });
  }, [weekMetrics, sleepGoal]);

  const currentQuality = todayMetrics?.sleep_quality;
  const qualityInfo = qualityOptions.find(q => q.value === currentQuality);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sueño</h1>
          <p className="text-gray-500 mt-1">Monitorea la calidad de tu descanso</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Registrar sueño
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registro de sueño</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Horas de sueño</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="7.5"
                  value={formData.sleep_hours}
                  onChange={(e) => setFormData({ ...formData, sleep_hours: e.target.value })}
                  className="mt-1"
                />
                <div className="flex gap-2 mt-2">
                  {[6, 7, 8, 9].map((hours) => (
                    <Button
                      key={hours}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, sleep_hours: hours.toString() })}
                    >
                      {hours}h
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Calidad del sueño</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {qualityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, sleep_quality: option.value })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                        formData.sleep_quality === option.value
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Notas (opcional)</Label>
                <Textarea
                  placeholder="¿Cómo te sentiste al despertar?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1"
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                Guardar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Sleep */}
      <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Moon className="w-5 h-5 text-purple-600" />
            Sueño de hoy
          </h3>
          <span className="text-sm text-gray-500">
            {format(new Date(), "d 'de' MMMM", { locale: es })}
          </span>
        </div>

        {todayMetrics?.sleep_hours ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-bold text-gray-900">
                  {todayMetrics.sleep_hours}
                  <span className="text-xl font-normal text-gray-500 ml-1">horas</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">Meta: {sleepGoal} horas</p>
              </div>
              {qualityInfo && (
                <div className={cn("px-4 py-2 rounded-xl flex items-center gap-2", qualityInfo.color)}>
                  <span className="text-2xl">{qualityInfo.icon}</span>
                  <span className="font-medium">{qualityInfo.label}</span>
                </div>
              )}
            </div>
            <Progress 
              value={(todayMetrics.sleep_hours / sleepGoal) * 100} 
              className="h-3 bg-purple-100"
            />
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Moon className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-gray-500">No has registrado tu sueño de hoy</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsDialogOpen(true)}
            >
              Registrar ahora
            </Button>
          </div>
        )}
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-gray-500">Promedio semanal</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{weeklyAvg.toFixed(1)}h</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-500">Meta diaria</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{sleepGoal}h</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">Días registrados</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{weekMetrics.filter(m => m.sleep_hours > 0).length}</p>
        </Card>
      </div>

      {/* Weekly Chart */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Historial semanal</h3>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                domain={[0, 12]}
                ticks={[0, 4, 8, 12]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${value} horas`, 'Sueño']}
              />
              <Bar 
                dataKey="hours" 
                fill="#8B5CF6" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Tips */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Consejos para mejorar tu sueño</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: "🌙", title: "Horario consistente", desc: "Acuéstate y despierta a la misma hora" },
            { icon: "📱", title: "Sin pantallas", desc: "Evita dispositivos 1 hora antes de dormir" },
            { icon: "☕", title: "Limita la cafeína", desc: "No consumas después de las 2 PM" },
            { icon: "🏃", title: "Ejercicio regular", desc: "Pero no justo antes de acostarte" }
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
              <span className="text-2xl">{tip.icon}</span>
              <div>
                <p className="font-medium text-gray-900">{tip.title}</p>
                <p className="text-sm text-gray-500">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}