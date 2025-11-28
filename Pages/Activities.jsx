import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Plus, 
  Footprints, 
  Bike, 
  Dumbbell, 
  Waves, 
  Timer,
  Flame,
  MapPin,
  Trash2,
  Edit2,
  Filter,
  Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const activityTypes = [
  { value: "walking", label: "Caminata", icon: Footprints, color: "emerald" },
  { value: "running", label: "Carrera", icon: Footprints, color: "orange" },
  { value: "cycling", label: "Ciclismo", icon: Bike, color: "blue" },
  { value: "swimming", label: "Natación", icon: Waves, color: "cyan" },
  { value: "gym", label: "Gimnasio", icon: Dumbbell, color: "purple" },
  { value: "yoga", label: "Yoga", icon: Timer, color: "pink" },
  { value: "sports", label: "Deportes", icon: Dumbbell, color: "amber" },
  { value: "other", label: "Otro", icon: Timer, color: "gray" }
];

const intensities = [
  { value: "low", label: "Baja", color: "bg-green-100 text-green-700" },
  { value: "moderate", label: "Moderada", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "Alta", color: "bg-orange-100 text-orange-700" },
  { value: "extreme", label: "Extrema", color: "bg-red-100 text-red-700" }
];

const colorClasses = {
  emerald: "bg-emerald-100 text-emerald-600",
  orange: "bg-orange-100 text-orange-600",
  blue: "bg-blue-100 text-blue-600",
  cyan: "bg-cyan-100 text-cyan-600",
  purple: "bg-purple-100 text-purple-600",
  pink: "bg-pink-100 text-pink-600",
  amber: "bg-amber-100 text-amber-600",
  gray: "bg-gray-100 text-gray-600"
};

export default function Activities() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    type: "walking",
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "",
    duration_minutes: "",
    calories_burned: "",
    distance_km: "",
    intensity: "moderate",
    notes: ""
  });

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: () => base44.entities.Activity.list("-date", 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      resetForm();
      setIsDialogOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      resetForm();
      setIsDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Activity.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] })
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "walking",
      date: format(new Date(), "yyyy-MM-dd"),
      start_time: "",
      duration_minutes: "",
      calories_burned: "",
      distance_km: "",
      intensity: "moderate",
      notes: ""
    });
    setEditingActivity(null);
  };

  const handleEdit = (activity) => {
    setEditingActivity(activity);
    setFormData({
      name: activity.name || "",
      type: activity.type,
      date: activity.date,
      start_time: activity.start_time || "",
      duration_minutes: activity.duration_minutes?.toString() || "",
      calories_burned: activity.calories_burned?.toString() || "",
      distance_km: activity.distance_km?.toString() || "",
      intensity: activity.intensity || "moderate",
      notes: activity.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      duration_minutes: parseInt(formData.duration_minutes) || 0,
      calories_burned: parseInt(formData.calories_burned) || 0,
      distance_km: parseFloat(formData.distance_km) || 0
    };

    if (editingActivity) {
      updateMutation.mutate({ id: editingActivity.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredActivities = filterType === "all" 
    ? activities 
    : activities.filter(a => a.type === filterType);

  // Stats
  const totalMinutes = activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
  const totalCalories = activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0);
  const totalDistance = activities.reduce((sum, a) => sum + (a.distance_km || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Actividad Física</h1>
          <p className="text-gray-500 mt-1">Registra y monitorea tus ejercicios</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Nueva actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingActivity ? "Editar actividad" : "Nueva actividad"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Tipo de actividad</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {activityTypes.map((type) => {
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
                  <Label>Nombre (opcional)</Label>
                  <Input
                    placeholder="Ej: Caminata matutina"
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
                  <Label>Hora de inicio</Label>
                  <Input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Duración (minutos) *</Label>
                  <Input
                    type="number"
                    required
                    placeholder="30"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Calorías quemadas</Label>
                  <Input
                    type="number"
                    placeholder="200"
                    value={formData.calories_burned}
                    onChange={(e) => setFormData({ ...formData, calories_burned: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Distancia (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={formData.distance_km}
                    onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Intensidad</Label>
                  <Select
                    value={formData.intensity}
                    onValueChange={(value) => setFormData({ ...formData, intensity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {intensities.map((intensity) => (
                        <SelectItem key={intensity.value} value={intensity.value}>
                          {intensity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Notas</Label>
                  <Textarea
                    placeholder="Añade notas sobre tu actividad..."
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
                  {editingActivity ? "Guardar cambios" : "Crear actividad"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Timer className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tiempo total</p>
              <p className="text-xl font-bold text-gray-900">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Calorías</p>
              <p className="text-xl font-bold text-gray-900">{totalCalories.toLocaleString()} kcal</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Distancia</p>
              <p className="text-xl font-bold text-gray-900">{totalDistance.toFixed(1)} km</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <Tabs value={filterType} onValueChange={setFilterType}>
            <TabsList className="bg-gray-100">
              <TabsTrigger value="all">Todos</TabsTrigger>
              {activityTypes.slice(0, 5).map((type) => (
                <TabsTrigger key={type.value} value={type.value}>{type.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </Card>

      {/* Activities List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <Card className="p-12 border-0 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Dumbbell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No hay actividades</h3>
            <p className="text-gray-500 mt-1">Comienza a registrar tu actividad física</p>
          </Card>
        ) : (
          filteredActivities.map((activity) => {
            const typeInfo = activityTypes.find(t => t.value === activity.type) || activityTypes[7];
            const Icon = typeInfo.icon;
            const intensityInfo = intensities.find(i => i.value === activity.intensity);
            
            return (
              <Card key={activity.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-xl", colorClasses[typeInfo.color])}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {activity.name || typeInfo.label}
                      </h3>
                      {intensityInfo && (
                        <Badge variant="secondary" className={cn("text-xs", intensityInfo.color)}>
                          {intensityInfo.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(activity.date), "d 'de' MMMM, yyyy", { locale: es })}
                      {activity.start_time && ` • ${activity.start_time}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-medium text-gray-900">
                        <Timer className="w-4 h-4 text-gray-400" />
                        {activity.duration_minutes} min
                      </div>
                      {activity.calories_burned > 0 && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {activity.calories_burned} kcal
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(activity)}>
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteMutation.mutate(activity.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}