import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Footprints, 
  Flame, 
  Moon, 
  Droplets,
  Heart,
  Scale,
  Smile,
  Meh,
  Frown
} from "lucide-react";

import MetricCard from "@/components/dashboard/MetricCard";
import QuickActions from "@/components/dashboard/QuickActions";
import ActivityChart from "@/components/dashboard/ActivityChart";
import RecentActivities from "@/components/dashboard/RecentActivities";
import WaterTracker from "@/components/dashboard/WaterTracker";
import ProgressNotifier from "@/components/reminders/ProgressNotifier";
import { useNotifications } from "@/components/reminders/NotificationService";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { checkSmartReminders } = useNotifications();
  const today = format(new Date(), "yyyy-MM-dd");
  const [chartPeriod, setChartPeriod] = useState("week");
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [showStepsDialog, setShowStepsDialog] = useState(false);
  const [stepsInput, setStepsInput] = useState("");
  const [previousMetrics, setPreviousMetrics] = useState(null);

  // Check smart reminders on mount
  useEffect(() => {
    checkSmartReminders();
  }, [checkSmartReminders]);

  // Fetch today's metrics
  const { data: todayMetrics } = useQuery({
    queryKey: ["metrics", today],
    queryFn: async () => {
      const metrics = await base44.entities.HealthMetric.filter({ date: today });
      return metrics[0] || null;
    }
  });

  // Fetch goals
  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.filter({ is_active: true })
  });

  // Fetch recent activities
  const { data: recentActivities = [] } = useQuery({
    queryKey: ["activities", "recent"],
    queryFn: () => base44.entities.Activity.list("-date", 10)
  });

  // Fetch week metrics for chart
  const { data: weekMetrics = [] } = useQuery({
    queryKey: ["metrics", "week"],
    queryFn: async () => {
      const startDate = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const metrics = await base44.entities.HealthMetric.filter({
        date: { $gte: startDate }
      });
      return metrics;
    }
  });

  // Track previous values for progress notifications
  useEffect(() => {
    if (todayMetrics) {
      setPreviousMetrics(prev => prev || {
        steps: todayMetrics.steps,
        water_ml: todayMetrics.water_ml,
        calories_burned: todayMetrics.calories_burned
      });
    }
  }, [todayMetrics]);

  // Mutations
  const updateMetricMutation = useMutation({
    mutationFn: async (data) => {
      // Save previous values before update
      setPreviousMetrics({
        steps: todayMetrics?.steps || 0,
        water_ml: todayMetrics?.water_ml || 0,
        calories_burned: todayMetrics?.calories_burned || 0
      });
      
      if (todayMetrics?.id) {
        return base44.entities.HealthMetric.update(todayMetrics.id, data);
      } else {
        return base44.entities.HealthMetric.create({ date: today, ...data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    }
  });

  // Get goal values
  const getGoal = (type) => {
    const goal = goals.find(g => g.type === type);
    return goal?.target_value || null;
  };

  // Chart data
  const chartData = React.useMemo(() => {
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    return days.map((day, index) => {
      const date = format(addDays(startDate, index), "yyyy-MM-dd");
      const metric = weekMetrics.find(m => m.date === date);
      return {
        day,
        steps: metric?.steps || 0,
        calories: metric?.calories_burned || 0
      };
    });
  }, [weekMetrics]);

  // Handlers
  const handleQuickAction = (action, page) => {
    switch (action) {
      case "mood":
        setShowMoodDialog(true);
        break;
      case "steps":
        setShowStepsDialog(true);
        break;
      default:
        navigate(createPageUrl(page));
    }
  };

  const handleAddWater = (amount) => {
    const newAmount = (todayMetrics?.water_ml || 0) + amount;
    updateMetricMutation.mutate({ water_ml: newAmount });
  };

  const handleRemoveWater = (amount) => {
    const newAmount = Math.max(0, (todayMetrics?.water_ml || 0) - amount);
    updateMetricMutation.mutate({ water_ml: newAmount });
  };

  const handleMoodSelect = (mood) => {
    updateMetricMutation.mutate({ mood });
    setShowMoodDialog(false);
  };

  const handleStepsSubmit = () => {
    const steps = parseInt(stepsInput);
    if (!isNaN(steps) && steps >= 0) {
      updateMetricMutation.mutate({ steps });
      setShowStepsDialog(false);
      setStepsInput("");
    }
  };

  const moodOptions = [
    { value: "great", icon: "😄", label: "Excelente", color: "bg-emerald-100 text-emerald-700" },
    { value: "good", icon: "🙂", label: "Bien", color: "bg-green-100 text-green-700" },
    { value: "neutral", icon: "😐", label: "Normal", color: "bg-yellow-100 text-yellow-700" },
    { value: "bad", icon: "😔", label: "Mal", color: "bg-orange-100 text-orange-700" },
    { value: "terrible", icon: "😢", label: "Terrible", color: "bg-red-100 text-red-700" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
        {todayMetrics?.mood && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm">
            <span className="text-2xl">
              {moodOptions.find(m => m.value === todayMetrics.mood)?.icon || "😐"}
            </span>
            <span className="text-sm text-gray-600">Tu estado de hoy</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Footprints}
          title="Pasos"
          value={todayMetrics?.steps || 0}
          target={getGoal("steps") || 10000}
          color="emerald"
          trend={todayMetrics?.steps > 5000 ? "up" : "neutral"}
          onClick={() => setShowStepsDialog(true)}
        />
        <MetricCard
          icon={Flame}
          title="Calorías quemadas"
          value={todayMetrics?.calories_burned || 0}
          unit="kcal"
          target={getGoal("calories_burn")}
          color="orange"
        />
        <MetricCard
          icon={Moon}
          title="Horas de sueño"
          value={todayMetrics?.sleep_hours || 0}
          unit="hrs"
          target={getGoal("sleep") || 8}
          color="purple"
          onClick={() => navigate(createPageUrl("Sleep"))}
        />
        <MetricCard
          icon={Heart}
          title="Ritmo cardíaco"
          value={todayMetrics?.heart_rate_avg || "--"}
          unit="bpm"
          color="pink"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart 
            data={chartData} 
            period={chartPeriod} 
            onPeriodChange={setChartPeriod}
          />
        </div>
        <div className="space-y-6">
          <WaterTracker
            current={todayMetrics?.water_ml || 0}
            target={getGoal("water") || 2000}
            onAdd={handleAddWater}
            onRemove={handleRemoveWater}
          />
        </div>
      </div>

      {/* Recent Activities */}
      <RecentActivities 
        activities={recentActivities}
        onViewAll={() => navigate(createPageUrl("Activities"))}
      />

      {/* Progress Notifiers - These components track progress and show notifications */}
      <ProgressNotifier
        type="steps"
        currentValue={todayMetrics?.steps || 0}
        targetValue={getGoal("steps") || 10000}
        previousValue={previousMetrics?.steps}
      />
      <ProgressNotifier
        type="water"
        currentValue={todayMetrics?.water_ml || 0}
        targetValue={getGoal("water") || 2000}
        previousValue={previousMetrics?.water_ml}
      />
      <ProgressNotifier
        type="calories_burn"
        currentValue={todayMetrics?.calories_burned || 0}
        targetValue={getGoal("calories_burn")}
        previousValue={previousMetrics?.calories_burned}
      />

      {/* Mood Dialog */}
      <Dialog open={showMoodDialog} onOpenChange={setShowMoodDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>¿Cómo te sientes hoy?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-2 py-4">
            {moodOptions.map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 ${
                  todayMetrics?.mood === mood.value ? mood.color : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span className="text-3xl">{mood.icon}</span>
                <span className="text-xs font-medium">{mood.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Steps Dialog */}
      <Dialog open={showStepsDialog} onOpenChange={setShowStepsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pasos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Número de pasos</Label>
              <Input
                type="number"
                placeholder="Ej: 8500"
                value={stepsInput}
                onChange={(e) => setStepsInput(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              {[5000, 7500, 10000].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setStepsInput(preset.toString())}
                >
                  {preset.toLocaleString()}
                </Button>
              ))}
            </div>
            <Button 
              onClick={handleStepsSubmit} 
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}