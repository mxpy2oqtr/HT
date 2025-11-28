import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Target, 
  Plus, 
  Edit2, 
  Trash2,
  Footprints,
  Flame,
  Droplets,
  Moon,
  Scale,
  Timer,
  CheckCircle2,
  Circle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const goalTypes = [
  { value: "steps", label: "Pasos diarios", icon: Footprints, unit: "pasos", color: "emerald", defaultValue: 10000 },
  { value: "calories_burn", label: "Calorías quemadas", icon: Flame, unit: "kcal", color: "orange", defaultValue: 500 },
  { value: "calories_intake", label: "Calorías consumidas", icon: Flame, unit: "kcal", color: "red", defaultValue: 2000 },
  { value: "water", label: "Hidratación", icon: Droplets, unit: "ml", color: "cyan", defaultValue: 2000 },
  { value: "sleep", label: "Horas de sueño", icon: Moon, unit: "horas", color: "purple", defaultValue: 8 },
  { value: "weight", label: "Peso objetivo", icon: Scale, unit: "kg", color: "blue", defaultValue: 70 },
  { value: "exercise_minutes", label: "Ejercicio diario", icon: Timer, unit: "min", color: "pink", defaultValue: 30 }
];

const frequencies = [
  { value: "daily", label: "Diaria" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" }
];

const colorClasses = {
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600", progress: "bg-emerald-500" },
  orange: { bg: "bg-orange-100", text: "text-orange-600", progress: "bg-orange-500" },
  red: { bg: "bg-red-100", text: "text-red-600", progress: "bg-red-500" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-600", progress: "bg-cyan-500" },
  purple: { bg: "bg-purple-100", text: "text-purple-600", progress: "bg-purple-500" },
  blue: { bg: "bg-blue-100", text: "text-blue-600", progress: "bg-blue-500" },
  pink: { bg: "bg-pink-100", text: "text-pink-600", progress: "bg-pink-500" }
};

export default function Goals() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    type: "steps",
    target_value: "",
    frequency: "daily",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    is_active: true
  });

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.list("-created_date")
  });

  const { data: todayMetrics } = useQuery({
    queryKey: ["metrics", format(new Date(), "yyyy-MM-dd")],
    queryFn: async () => {
      const metrics = await base44.entities.HealthMetric.filter({ 
        date: format(new Date(), "yyyy-MM-dd") 
      });
      return metrics[0] || null;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      resetForm();
      setIsDialogOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      resetForm();
      setIsDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] })
  });

  const resetForm = () => {
    setFormData({
      type: "steps",
      target_value: "",
      frequency: "daily",
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: "",
      is_active: true
    });
    setEditingGoal(null);
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      type: goal.type,
      target_value: goal.target_value?.toString() || "",
      frequency: goal.frequency,
      start_date: goal.start_date || format(new Date(), "yyyy-MM-dd"),
      end_date: goal.end_date || "",
      is_active: goal.is_active
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const goalTypeInfo = goalTypes.find(t => t.value === formData.type);
    const data = {
      ...formData,
      target_value: parseFloat(formData.target_value) || goalTypeInfo?.defaultValue || 0,
      unit: goalTypeInfo?.unit || "",
      current_value: 0
    };

    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getCurrentValue = (goalType) => {
    if (!todayMetrics) return 0;
    switch (goalType) {
      case "steps": return todayMetrics.steps || 0;
      case "calories_burn": return todayMetrics.calories_burned || 0;
      case "calories_intake": return todayMetrics.calories_consumed || 0;
      case "water": return todayMetrics.water_ml || 0;
      case "sleep": return todayMetrics.sleep_hours || 0;
      case "weight": return todayMetrics.weight_kg || 0;
      default: return 0;
    }
  };

  const toggleActive = (goal) => {
    updateMutation.mutate({
      id: goal.id,
      data: { is_active: !goal.is_active }
    });
  };

  const activeGoals = goals.filter(g => g.is_active);
  const inactiveGoals = goals.filter(g => !g.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
          <p className="text-gray-500 mt-1">Define y alcanza tus objetivos de salud</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva meta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Editar meta" : "Nueva meta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tipo de meta</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => {
                    const goalType = goalTypes.find(t => t.value === value);
                    setFormData({ 
                      ...formData, 
                      type: value,
                      target_value: goalType?.defaultValue?.toString() || ""
                    });
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={cn("w-4 h-4", colorClasses[type.color].text)} />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Valor objetivo</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  />
                  <div className="flex items-center px-3 bg-gray-100 rounded-md text-sm text-gray-500">
                    {goalTypes.find(t => t.value === formData.type)?.unit}
                  </div>
                </div>
              </div>

              <div>
                <Label>Frecuencia</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de inicio</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Fecha límite (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {editingGoal ? "Guardar cambios" : "Crear meta"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-gray-500">Metas activas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeGoals.length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-500">Completadas hoy</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {activeGoals.filter(g => getCurrentValue(g.type) >= g.target_value).length}
          </p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Circle className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Inactivas</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{inactiveGoals.length}</p>
        </Card>
      </div>

      {/* Active Goals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Metas activas</h2>
        {activeGoals.length === 0 ? (
          <Card className="p-12 border-0 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No tienes metas activas</h3>
            <p className="text-gray-500 mt-1">Crea tu primera meta para comenzar</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {activeGoals.map((goal) => {
              const typeInfo = goalTypes.find(t => t.value === goal.type);
              const Icon = typeInfo?.icon || Target;
              const colors = colorClasses[typeInfo?.color || "emerald"];
              const currentValue = getCurrentValue(goal.type);
              const progress = Math.min((currentValue / goal.target_value) * 100, 100);
              const isCompleted = currentValue >= goal.target_value;

              return (
                <Card key={goal.id} className={cn(
                  "p-5 border-0 shadow-sm transition-all",
                  isCompleted && "ring-2 ring-emerald-500"
                )}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2.5 rounded-xl", colors.bg)}>
                        <Icon className={cn("w-5 h-5", colors.text)} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{typeInfo?.label}</h3>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {frequencies.find(f => f.value === goal.frequency)?.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(goal.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {currentValue.toLocaleString()}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            / {goal.target_value?.toLocaleString()} {goal.unit}
                          </span>
                        </p>
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      )}
                    </div>
                    <Progress value={progress} className={cn("h-2", colors.bg)} />
                    <p className="text-sm text-gray-500">{Math.round(progress)}% completado</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Inactive Goals */}
      {inactiveGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-500">Metas inactivas</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {inactiveGoals.map((goal) => {
              const typeInfo = goalTypes.find(t => t.value === goal.type);
              const Icon = typeInfo?.icon || Target;

              return (
                <Card key={goal.id} className="p-4 border-0 shadow-sm bg-gray-50 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-200">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-700">{typeInfo?.label}</h3>
                        <p className="text-sm text-gray-500">
                          {goal.target_value?.toLocaleString()} {goal.unit}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={goal.is_active}
                        onCheckedChange={() => toggleActive(goal)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(goal.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}