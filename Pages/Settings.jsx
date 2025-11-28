import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  LogOut,
  Save,
  Camera,
  Target,
  Moon,
  Sun
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Settings() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: () => base44.auth.me()
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.filter({ is_active: true })
  });

  const [profileData, setProfileData] = useState({
    full_name: "",
    height_cm: "",
    birth_date: "",
    gender: ""
  });

  const [preferences, setPreferences] = useState({
    notifications_enabled: true,
    daily_reminder: true,
    reminder_time: "09:00",
    weekly_report: true,
    theme: "light",
    units: "metric"
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || "",
        height_cm: user.height_cm?.toString() || "",
        birth_date: user.birth_date || "",
        gender: user.gender || ""
      });
      if (user.preferences) {
        setPreferences(prev => ({ ...prev, ...user.preferences }));
      }
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Perfil actualizado correctamente");
    }
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      ...profileData,
      height_cm: parseInt(profileData.height_cm) || null,
      preferences
    });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const getGoalValue = (type) => {
    const goal = goals.find(g => g.type === type);
    return goal?.target_value || "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-500 mt-1">Personaliza tu experiencia en HealthTrack</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="p-4 border-0 shadow-sm h-fit lg:sticky lg:top-24">
          <nav className="space-y-1">
            {[
              { id: "profile", label: "Perfil", icon: User },
              { id: "goals", label: "Metas por defecto", icon: Target },
              { id: "notifications", label: "Notificaciones", icon: Bell },
              { id: "appearance", label: "Apariencia", icon: Palette },
              { id: "privacy", label: "Privacidad", icon: Shield }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          
          <Separator className="my-4" />
          
          <Button 
            variant="ghost" 
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "profile" && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Información personal</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{user?.full_name || "Usuario"}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Nombre completo</Label>
                  <Input
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Altura (cm)</Label>
                  <Input
                    type="number"
                    value={profileData.height_cm}
                    onChange={(e) => setProfileData({ ...profileData, height_cm: e.target.value })}
                    className="mt-1"
                    placeholder="175"
                  />
                </div>
                <div>
                  <Label>Fecha de nacimiento</Label>
                  <Input
                    type="date"
                    value={profileData.birth_date}
                    onChange={(e) => setProfileData({ ...profileData, birth_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Género</Label>
                  <Select
                    value={profileData.gender}
                    onValueChange={(value) => setProfileData({ ...profileData, gender: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Femenino</SelectItem>
                      <SelectItem value="other">Otro</SelectItem>
                      <SelectItem value="prefer_not_say">Prefiero no decir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveProfile} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar cambios
                </Button>
              </div>
            </Card>
          )}

          {activeTab === "goals" && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Metas por defecto</h2>
              <p className="text-gray-500 text-sm mb-6">
                Estas son las metas que se usarán por defecto. Puedes personalizarlas en la sección de Metas.
              </p>

              <div className="space-y-4">
                {[
                  { type: "steps", label: "Pasos diarios", unit: "pasos", default: 10000 },
                  { type: "water", label: "Agua diaria", unit: "ml", default: 2000 },
                  { type: "sleep", label: "Horas de sueño", unit: "horas", default: 8 },
                  { type: "calories_burn", label: "Calorías a quemar", unit: "kcal", default: 500 },
                  { type: "exercise_minutes", label: "Minutos de ejercicio", unit: "min", default: 30 }
                ].map((goal) => (
                  <div key={goal.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{goal.label}</p>
                      <p className="text-sm text-gray-500">
                        Actual: {getGoalValue(goal.type) || goal.default} {goal.unit}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notificaciones</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Activar notificaciones</p>
                    <p className="text-sm text-gray-500">Recibe recordatorios y actualizaciones</p>
                  </div>
                  <Switch
                    checked={preferences.notifications_enabled}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, notifications_enabled: checked })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Recordatorio diario</p>
                    <p className="text-sm text-gray-500">Te recordamos registrar tu actividad</p>
                  </div>
                  <Switch
                    checked={preferences.daily_reminder}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, daily_reminder: checked })}
                    disabled={!preferences.notifications_enabled}
                  />
                </div>

                {preferences.daily_reminder && (
                  <div>
                    <Label>Hora del recordatorio</Label>
                    <Input
                      type="time"
                      value={preferences.reminder_time}
                      onChange={(e) => setPreferences({ ...preferences, reminder_time: e.target.value })}
                      className="mt-1 w-40"
                    />
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Reporte semanal</p>
                    <p className="text-sm text-gray-500">Recibe un resumen de tu semana</p>
                  </div>
                  <Switch
                    checked={preferences.weekly_report}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, weekly_report: checked })}
                    disabled={!preferences.notifications_enabled}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveProfile} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar cambios
                </Button>
              </div>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Apariencia</h2>

              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Tema</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "light", label: "Claro", icon: Sun },
                      { value: "dark", label: "Oscuro", icon: Moon }
                    ].map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <button
                          key={theme.value}
                          onClick={() => setPreferences({ ...preferences, theme: theme.value })}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                            preferences.theme === theme.value
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-gray-200 hover:border-gray-300"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{theme.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Sistema de unidades</Label>
                  <Select
                    value={preferences.units}
                    onValueChange={(value) => setPreferences({ ...preferences, units: value })}
                  >
                    <SelectTrigger className="mt-1 w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Métrico (kg, km)</SelectItem>
                      <SelectItem value="imperial">Imperial (lb, mi)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveProfile} className="bg-emerald-600 hover:bg-emerald-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar cambios
                </Button>
              </div>
            </Card>
          )}

          {activeTab === "privacy" && (
            <Card className="p-6 border-0 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Privacidad y seguridad</h2>

              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900 mb-2">Tus datos están seguros</p>
                  <p className="text-sm text-gray-500">
                    Toda tu información de salud está encriptada y almacenada de forma segura.
                    Solo tú tienes acceso a tus datos.
                  </p>
                </div>

                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <p className="font-medium text-red-700 mb-2">Zona de peligro</p>
                  <p className="text-sm text-red-600 mb-4">
                    Estas acciones son permanentes y no se pueden deshacer.
                  </p>
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
                    Eliminar todos mis datos
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}