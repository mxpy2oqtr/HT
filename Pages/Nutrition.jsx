import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Plus, 
  Coffee, 
  Sun, 
  Moon, 
  Cookie,
  Flame,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Apple,
  Beef,
  Wheat,
  Droplets
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const mealTypes = [
  { value: "breakfast", label: "Desayuno", icon: Coffee, color: "orange" },
  { value: "lunch", label: "Almuerzo", icon: Sun, color: "yellow" },
  { value: "dinner", label: "Cena", icon: Moon, color: "purple" },
  { value: "snack", label: "Snack", icon: Cookie, color: "pink" }
];

const colorClasses = {
  orange: "bg-orange-100 text-orange-600",
  yellow: "bg-yellow-100 text-yellow-600",
  purple: "bg-purple-100 text-purple-600",
  pink: "bg-pink-100 text-pink-600"
};

export default function Nutrition() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "breakfast",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "",
    calories: "",
    protein_g: "",
    carbs_g: "",
    fat_g: "",
    fiber_g: "",
    notes: ""
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const { data: meals = [], isLoading } = useQuery({
    queryKey: ["meals", dateStr],
    queryFn: () => base44.entities.Meal.filter({ date: dateStr })
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.filter({ is_active: true })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Meal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      resetForm();
      setIsDialogOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Meal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      resetForm();
      setIsDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Meal.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["meals"] })
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "breakfast",
      date: format(selectedDate, "yyyy-MM-dd"),
      time: "",
      calories: "",
      protein_g: "",
      carbs_g: "",
      fat_g: "",
      fiber_g: "",
      notes: ""
    });
    setEditingMeal(null);
  };

  const handleEdit = (meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      type: meal.type,
      date: meal.date,
      time: meal.time || "",
      calories: meal.calories?.toString() || "",
      protein_g: meal.protein_g?.toString() || "",
      carbs_g: meal.carbs_g?.toString() || "",
      fat_g: meal.fat_g?.toString() || "",
      fiber_g: meal.fiber_g?.toString() || "",
      notes: meal.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      calories: parseInt(formData.calories) || 0,
      protein_g: parseFloat(formData.protein_g) || 0,
      carbs_g: parseFloat(formData.carbs_g) || 0,
      fat_g: parseFloat(formData.fat_g) || 0,
      fiber_g: parseFloat(formData.fiber_g) || 0
    };

    if (editingMeal) {
      updateMutation.mutate({ id: editingMeal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  // Calculate totals
  const totals = meals.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.protein_g || 0),
    carbs: acc.carbs + (meal.carbs_g || 0),
    fat: acc.fat + (meal.fat_g || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const caloriesGoal = goals.find(g => g.type === "calories_intake")?.target_value || 2000;

  // Group meals by type
  const mealsByType = mealTypes.map(type => ({
    ...type,
    meals: meals.filter(m => m.type === type.value)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutrición</h1>
          <p className="text-gray-500 mt-1">Controla tu alimentación diaria</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Añadir comida
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMeal ? "Editar comida" : "Añadir comida"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Tipo de comida</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {mealTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: type.value })}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                            formData.type === type.value
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <Icon className={cn("w-5 h-5", colorClasses[type.color].split(" ")[1])} />
                          <span className="text-xs font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="col-span-2">
                  <Label>Nombre *</Label>
                  <Input
                    required
                    placeholder="Ej: Ensalada César"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Calorías *</Label>
                  <Input
                    type="number"
                    required
                    placeholder="350"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Proteínas (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="25"
                    value={formData.protein_g}
                    onChange={(e) => setFormData({ ...formData, protein_g: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Carbohidratos (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="45"
                    value={formData.carbs_g}
                    onChange={(e) => setFormData({ ...formData, carbs_g: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Grasas (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="15"
                    value={formData.fat_g}
                    onChange={(e) => setFormData({ ...formData, fat_g: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Fibra (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="5"
                    value={formData.fiber_g}
                    onChange={(e) => setFormData({ ...formData, fiber_g: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <Label>Notas</Label>
                  <Textarea
                    placeholder="Notas adicionales..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {editingMeal ? "Guardar cambios" : "Añadir comida"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Selector */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {format(selectedDate, "EEEE", { locale: es })}
            </p>
            <p className="text-sm text-gray-500">
              {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Calories Summary */}
      <Card className="p-5 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-100">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Calorías consumidas</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.calories.toLocaleString()} <span className="text-lg font-normal text-gray-500">/ {caloriesGoal}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Restantes</p>
            <p className={cn(
              "text-xl font-bold",
              caloriesGoal - totals.calories > 0 ? "text-emerald-600" : "text-red-600"
            )}>
              {(caloriesGoal - totals.calories).toLocaleString()} kcal
            </p>
          </div>
        </div>
        <Progress value={(totals.calories / caloriesGoal) * 100} className="h-3" />
      </Card>

      {/* Macros */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Beef className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-500">Proteínas</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{totals.protein.toFixed(1)}g</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wheat className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-500">Carbohidratos</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{totals.carbs.toFixed(1)}g</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-500">Grasas</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{totals.fat.toFixed(1)}g</p>
        </Card>
      </div>

      {/* Meals by Type */}
      <div className="space-y-4">
        {mealsByType.map((typeGroup) => {
          const Icon = typeGroup.icon;
          const typeCalories = typeGroup.meals.reduce((sum, m) => sum + (m.calories || 0), 0);
          
          return (
            <Card key={typeGroup.value} className="border-0 shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", colorClasses[typeGroup.color])}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-gray-900">{typeGroup.label}</span>
                </div>
                <span className="text-sm text-gray-500">{typeCalories} kcal</span>
              </div>
              
              {typeGroup.meals.length > 0 ? (
                <div className="divide-y">
                  {typeGroup.meals.map((meal) => (
                    <div key={meal.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{meal.name}</p>
                        <p className="text-sm text-gray-500">
                          {meal.calories} kcal
                          {meal.protein_g > 0 && ` • ${meal.protein_g}g prot`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(meal)}>
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(meal.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p className="text-sm">Sin registros</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}