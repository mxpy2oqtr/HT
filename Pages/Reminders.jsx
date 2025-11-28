import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Bell, 
  Plus, 
  Sparkles, 
  BellRing,
  Clock,
  Droplets,
  Footprints,
  Utensils,
  Moon,
  Dumbbell,
  Settings2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import ReminderCard from "@/components/reminders/ReminderCard";
import SmartReminderSetup from "@/components/reminders/SmartReminderSetup";
import { useNotifications } from "@/components/reminders/NotificationService";

const reminderTypes = [
  { value: "water", label: "Hidratación", icon: Droplets, color: "cyan" },
  { value: "steps", label: "Pasos", icon: Footprints, color: "emerald" },
  { value: "meal", label: "Comidas", icon: Utensils, color: "orange" },
  { value: "sleep", label: "Sueño", icon: Moon, color: "purple" },
  { value: "exercise", label: "Ejercicio", icon: Dumbbell, color: "pink" },
  { value: "custom", label: "Personalizado", icon: Bell, color: "blue" }
];

const defaultMessages = {
  water: "¡Hora de hidratarse! Bebe un vaso de agua 💧",
  steps: "¡A moverse! Levántate y camina un poco 👟",
  meal: "Es hora de comer. ¿Ya registraste tu comida? 🍽️",
  sleep: "Prepárate para dormir. Un buen descanso es esencial 🌙",
  exercise: "¿Ya hiciste ejercicio hoy? ¡Tu cuerpo te lo agradecerá! 💪",
  custom: ""
};

const allDays = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const dayLabels = { mon: "L", tue: "M", wed: "X", thu: "J", fri: "V", sat: "S", sun: "D" };

export default function Reminders() {
  const queryClient = useQueryClient();
  const { permission, isSupported, requestPermission, sendNotification, checkSmartReminders } = useNotifications();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSmartSetup, setShowSmartSetup] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  
  const [formData, setFormData] = useState({
    type: "water",
    title: "Recordatorio de hidratación",
    message: defaultMessages.water,
    time: "09:00",
    days: [...allDays],
    is_active: true,
    is_smart: false,
    smart_trigger: ""
  });

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => base44.entities.Reminder.list("-created_date")
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Reminder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      resetForm();
      setIsDialogOpen(false);
      toast.success("Recordatorio creado");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reminder.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      resetForm();
      setIsDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Reminder.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Recordatorio eliminado");
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (reminders) => base44.entities.Reminder.bulkCreate(reminders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      setShowSmartSetup(false);
      toast.success("Recordatorios inteligentes activados");
    }
  });

  // Check smart reminders periodically
  useEffect(() => {
    if (permission === "granted") {
      checkSmartReminders();
      const interval = setInterval(checkSmartReminders, 30 * 60 * 1000); // Every 30 min
      return () => clearInterval(interval);
    }
  }, [permission, checkSmartReminders]);

  const resetForm = () => {
    setFormData({
      type: "water",
      title: "Recordatorio de hidratación",
      message: defaultMessages.water,
      time: "09:00",
      days: [...allDays],
      is_active: true,
      is_smart: false,
      smart_trigger: ""
    });
    setEditingReminder(null);
  };

  const handleTypeChange = (type) => {
    const typeInfo = reminderTypes.find(t => t.value === type);
    setFormData({
      ...formData,
      type,
      title: `Recordatorio de ${typeInfo?.label.toLowerCase() || type}`,
      message: defaultMessages[type] || ""
    });
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      type: reminder.type,
      title: reminder.title,
      message: reminder.message,
      time: reminder.time || "09:00",
      days: reminder.days || [...allDays],
      is_active: reminder.is_active,
      is_smart: reminder.is_smart || false,
      smart_trigger: reminder.smart_trigger || ""
    });
    setIsDialogOpen(true);
  };

  const handleToggle = (reminder) => {
    updateMutation.mutate({
      id: reminder.id,
      data: { is_active: !reminder.is_active }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingReminder) {
      updateMutation.mutate({ id: editingReminder.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSmartSetupSave = async (smartReminders) => {
    // Delete existing smart reminders of same types
    const existingSmart = reminders.filter(r => r.is_smart);
    for (const r of existingSmart) {
      if (smartReminders.some(sr => sr.type === r.type)) {
        await base44.entities.Reminder.delete(r.id);
      }
    }
    bulkCreateMutation.mutate(smartReminders);
  };

  const handleTestNotification = () => {
    sendNotification("🔔 Notificación de prueba", {
      body: "¡Las notificaciones están funcionando correctamente!",
      tag: "test"
    });
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const filteredReminders = activeTab === "all" 
    ? reminders 
    : activeTab === "smart"
      ? reminders.filter(r => r.is_smart)
      : reminders.filter(r => !r.is_smart);

  const activeCount = reminders.filter(r => r.is_active).length;
  const smartCount = reminders.filter(r => r.is_smart && r.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recordatorios</h1>
          <p className="text-gray-500 mt-1">Configura notificaciones para mantener tus hábitos</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowSmartSetup(true)}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Configurar inteligentes
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo recordatorio
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingReminder ? "Editar recordatorio" : "Nuevo recordatorio"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Tipo</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {reminderTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleTypeChange(type.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                            formData.type === type.value
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Mensaje</Label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1 w-32"
                  />
                </div>

                <div>
                  <Label>Días</Label>
                  <div className="flex gap-1 mt-2">
                    {Object.entries(dayLabels).map(([day, label]) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "w-9 h-9 rounded-lg text-sm font-medium transition-all",
                          formData.days.includes(day)
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {editingReminder ? "Guardar cambios" : "Crear recordatorio"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notification Permission Card */}
      {isSupported && permission !== "granted" && (
        <Card className="p-5 border-0 shadow-sm bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <BellRing className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Activa las notificaciones</h3>
              <p className="text-sm text-gray-600 mt-1">
                Permite notificaciones del navegador para recibir recordatorios incluso cuando no estés en la app
              </p>
            </div>
            <Button onClick={requestPermission} className="bg-amber-600 hover:bg-amber-700">
              Activar
            </Button>
          </div>
        </Card>
      )}

      {/* Permission Status */}
      {permission === "granted" && (
        <Card className="p-4 border-0 shadow-sm bg-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                Notificaciones activas • {activeCount} recordatorios activos
                {smartCount > 0 && ` • ${smartCount} inteligentes`}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleTestNotification}>
              Probar notificación
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{reminders.length}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">Activos</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-500">Inteligentes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{smartCount}</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="scheduled">Programados</TabsTrigger>
          <TabsTrigger value="smart">
            <Sparkles className="w-3 h-3 mr-1" />
            Inteligentes
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reminders List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : filteredReminders.length === 0 ? (
          <Card className="p-12 border-0 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No hay recordatorios</h3>
            <p className="text-gray-500 mt-1">
              {activeTab === "smart" 
                ? "Configura recordatorios inteligentes basados en tu progreso"
                : "Crea tu primer recordatorio para mantener tus hábitos"
              }
            </p>
            {activeTab === "smart" && (
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => setShowSmartSetup(true)}
              >
                <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                Configurar inteligentes
              </Button>
            )}
          </Card>
        ) : (
          filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </div>

      {/* Smart Setup Dialog */}
      <Dialog open={showSmartSetup} onOpenChange={setShowSmartSetup}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <SmartReminderSetup 
            existingReminders={reminders}
            onSave={handleSmartSetupSave}
            onSkip={() => setShowSmartSetup(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}