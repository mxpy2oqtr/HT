import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { 
  TrendingUp, 
  Calendar, 
  Award,
  Footprints,
  Flame,
  Droplets,
  Moon,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

import CorrelationChart from "@/components/progress/CorrelationChart";
import ActivityHeatmap from "@/components/progress/ActivityHeatmap";
import TrendAnalysis from "@/components/progress/TrendAnalysis";
import DataExport from "@/components/progress/DataExport";

const metrics = [
  { key: "steps", label: "Pasos", icon: Footprints, color: "#10B981", unit: "" },
  { key: "calories_burned", label: "Calorías", icon: Flame, color: "#F59E0B", unit: "kcal" },
  { key: "water_ml", label: "Agua", icon: Droplets, color: "#06B6D4", unit: "ml" },
  { key: "sleep_hours", label: "Sueño", icon: Moon, color: "#8B5CF6", unit: "hrs" }
];

export default function Progress() {
  const [selectedMetric, setSelectedMetric] = useState("steps");
  const [period, setPeriod] = useState("week");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Calculate date range based on period
  const getDateRange = () => {
    const today = new Date();
    switch (period) {
      case "week":
        return { start: subDays(today, 6), end: today };
      case "month":
        return { start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) };
      case "year":
        return { start: subDays(today, 364), end: today };
      default:
        return { start: subDays(today, 6), end: today };
    }
  };

  const dateRange = getDateRange();

  const { data: healthMetrics = [] } = useQuery({
    queryKey: ["metrics", "progress", format(dateRange.start, "yyyy-MM-dd"), format(dateRange.end, "yyyy-MM-dd")],
    queryFn: () => base44.entities.HealthMetric.filter({
      date: { 
        $gte: format(dateRange.start, "yyyy-MM-dd"),
        $lte: format(dateRange.end, "yyyy-MM-dd")
      }
    })
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", "progress", format(dateRange.start, "yyyy-MM-dd")],
    queryFn: () => base44.entities.Activity.filter({
      date: { 
        $gte: format(dateRange.start, "yyyy-MM-dd"),
        $lte: format(dateRange.end, "yyyy-MM-dd")
      }
    })
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals"],
    queryFn: () => base44.entities.Goal.filter({ is_active: true })
  });

  // Fetch all historical data for advanced analysis
  const { data: allMetrics = [] } = useQuery({
    queryKey: ["metrics", "all"],
    queryFn: () => base44.entities.HealthMetric.list("-date", 365),
    enabled: showAdvanced
  });

  const { data: allActivities = [] } = useQuery({
    queryKey: ["activities", "all"],
    queryFn: () => base44.entities.Activity.list("-date", 500),
    enabled: showAdvanced
  });

  const { data: allMeals = [] } = useQuery({
    queryKey: ["meals", "all"],
    queryFn: () => base44.entities.Meal.list("-date", 500),
    enabled: showAdvanced
  });

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    
    return days.map(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const metric = healthMetrics.find(m => m.date === dateStr);
      
      return {
        date: format(day, period === "year" ? "MMM" : "d MMM", { locale: es }),
        fullDate: dateStr,
        steps: metric?.steps || 0,
        calories_burned: metric?.calories_burned || 0,
        water_ml: metric?.water_ml || 0,
        sleep_hours: metric?.sleep_hours || 0
      };
    });
  }, [healthMetrics, dateRange, period]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const values = chartData.map(d => d[selectedMetric]).filter(v => v > 0);
    const total = values.reduce((sum, v) => sum + v, 0);
    const avg = values.length > 0 ? total / values.length : 0;
    const max = Math.max(...values, 0);
    const min = values.length > 0 ? Math.min(...values) : 0;
    
    // Days on target
    const goal = goals.find(g => {
      if (selectedMetric === "steps") return g.type === "steps";
      if (selectedMetric === "calories_burned") return g.type === "calories_burn";
      if (selectedMetric === "water_ml") return g.type === "water";
      if (selectedMetric === "sleep_hours") return g.type === "sleep";
      return false;
    });
    
    const daysOnTarget = goal 
      ? values.filter(v => v >= goal.target_value).length 
      : 0;
    
    return { total, avg, max, min, daysOnTarget, daysTracked: values.length };
  }, [chartData, selectedMetric, goals]);

  const currentMetric = metrics.find(m => m.key === selectedMetric);

  const changeMonth = (direction) => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setSelectedMonth(newMonth);
  };

  // Calculate correlations for scatter plots
  const correlationData = React.useMemo(() => {
    if (!showAdvanced || allMetrics.length < 5) return [];
    
    // Sleep vs Next Day Steps
    const sleepStepsData = [];
    for (let i = 0; i < allMetrics.length - 1; i++) {
      const today = allMetrics[i];
      const nextDay = allMetrics.find(m => {
        const d1 = new Date(today.date);
        const d2 = new Date(m.date);
        d1.setDate(d1.getDate() + 1);
        return format(d1, "yyyy-MM-dd") === m.date;
      });
      if (nextDay && today.sleep_hours > 0 && nextDay.steps > 0) {
        sleepStepsData.push({ x: today.sleep_hours, y: nextDay.steps });
      }
    }

    // Water vs Calories
    const waterCaloriesData = allMetrics
      .filter(m => m.water_ml > 0 && m.calories_burned > 0)
      .map(m => ({ x: m.water_ml, y: m.calories_burned }));

    return { sleepStepsData, waterCaloriesData };
  }, [allMetrics, showAdvanced]);

  // Calculate Pearson correlation coefficient
  const calculateCorrelation = (data) => {
    if (!data || data.length < 3) return 0;
    const n = data.length;
    const sumX = data.reduce((s, d) => s + d.x, 0);
    const sumY = data.reduce((s, d) => s + d.y, 0);
    const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
    const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
    const sumY2 = data.reduce((s, d) => s + d.y * d.y, 0);
    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return den === 0 ? 0 : num / den;
  };

  // Calculate trend analysis
  const trendAnalysis = React.useMemo(() => {
    if (!showAdvanced || allMetrics.length < 14) return [];
    
    const lastWeek = allMetrics.slice(0, 7);
    const prevWeek = allMetrics.slice(7, 14);

    const calcAvg = (data, key) => {
      const values = data.filter(d => d[key] > 0).map(d => d[key]);
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    };

    const trends = [
      {
        label: "Pasos",
        icon: Footprints,
        bgColor: "bg-emerald-100",
        iconColor: "text-emerald-600",
        currentValue: Math.round(calcAvg(lastWeek, "steps")),
        previousValue: Math.round(calcAvg(prevWeek, "steps")),
        change: prevWeek.length > 0 ? ((calcAvg(lastWeek, "steps") - calcAvg(prevWeek, "steps")) / (calcAvg(prevWeek, "steps") || 1)) * 100 : 0
      },
      {
        label: "Sueño",
        icon: Moon,
        bgColor: "bg-purple-100",
        iconColor: "text-purple-600",
        currentValue: calcAvg(lastWeek, "sleep_hours").toFixed(1),
        previousValue: calcAvg(prevWeek, "sleep_hours").toFixed(1),
        change: prevWeek.length > 0 ? ((calcAvg(lastWeek, "sleep_hours") - calcAvg(prevWeek, "sleep_hours")) / (calcAvg(prevWeek, "sleep_hours") || 1)) * 100 : 0
      },
      {
        label: "Hidratación",
        icon: Droplets,
        bgColor: "bg-cyan-100",
        iconColor: "text-cyan-600",
        currentValue: Math.round(calcAvg(lastWeek, "water_ml")),
        previousValue: Math.round(calcAvg(prevWeek, "water_ml")),
        change: prevWeek.length > 0 ? ((calcAvg(lastWeek, "water_ml") - calcAvg(prevWeek, "water_ml")) / (calcAvg(prevWeek, "water_ml") || 1)) * 100 : 0
      },
      {
        label: "Calorías quemadas",
        icon: Flame,
        bgColor: "bg-orange-100",
        iconColor: "text-orange-600",
        currentValue: Math.round(calcAvg(lastWeek, "calories_burned")),
        previousValue: Math.round(calcAvg(prevWeek, "calories_burned")),
        change: prevWeek.length > 0 ? ((calcAvg(lastWeek, "calories_burned") - calcAvg(prevWeek, "calories_burned")) / (calcAvg(prevWeek, "calories_burned") || 1)) * 100 : 0
      }
    ];

    return trends;
  }, [allMetrics, showAdvanced]);

  // Heatmap data preparation
  const heatmapData = React.useMemo(() => {
    return allMetrics.map(m => ({
      date: m.date,
      steps: m.steps || 0,
      water_ml: m.water_ml || 0,
      sleep_hours: m.sleep_hours || 0,
      calories_burned: m.calories_burned || 0
    }));
  }, [allMetrics]);

  const getTargetValue = () => {
    const goal = goals.find(g => {
      if (selectedMetric === "steps") return g.type === "steps";
      if (selectedMetric === "water_ml") return g.type === "water";
      if (selectedMetric === "sleep_hours") return g.type === "sleep";
      if (selectedMetric === "calories_burned") return g.type === "calories_burn";
      return false;
    });
    return goal?.target_value;
  };

  // Activity heatmap for the month
  const getActivityIntensity = (date) => {
    const metric = healthMetrics.find(m => m.date === date);
    if (!metric) return 0;
    const value = metric[selectedMetric] || 0;
    const goal = goals.find(g => {
      if (selectedMetric === "steps") return g.type === "steps";
      if (selectedMetric === "water_ml") return g.type === "water";
      if (selectedMetric === "sleep_hours") return g.type === "sleep";
      return false;
    });
    if (!goal) return value > 0 ? 2 : 0;
    return value >= goal.target_value ? 4 : value > goal.target_value * 0.5 ? 2 : value > 0 ? 1 : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progreso</h1>
          <p className="text-gray-500 mt-1">Analiza tu evolución a lo largo del tiempo</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showAdvanced ? "default" : "outline"}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={showAdvanced ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Análisis avanzado
          </Button>
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mes</TabsTrigger>
              <TabsTrigger value="year">Año</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Metric Selector */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const isSelected = selectedMetric === metric.key;
            return (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap",
                  isSelected
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Icon className="w-4 h-4" />
                {metric.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-sm text-gray-500">Promedio</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.avg.toFixed(selectedMetric === "sleep_hours" ? 1 : 0)}
            <span className="text-sm font-normal text-gray-500 ml-1">{currentMetric?.unit}</span>
          </p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-gray-500">Máximo</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.max.toLocaleString()}
            <span className="text-sm font-normal text-gray-500 ml-1">{currentMetric?.unit}</span>
          </p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-500">Días registrados</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.daysTracked}</p>
        </Card>
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-500">Días en meta</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.daysOnTarget}</p>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="p-5 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentMetric?.label} - {period === "week" ? "Última semana" : period === "month" ? format(selectedMonth, "MMMM yyyy", { locale: es }) : "Último año"}
          </h3>
          {period === "month" && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">
                {format(selectedMonth, "MMMM yyyy", { locale: es })}
              </span>
              <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={`color-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentMetric?.color} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={currentMetric?.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                interval={period === "year" ? 1 : "preserveStartEnd"}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
                formatter={(value) => [
                  `${value.toLocaleString()} ${currentMetric?.unit}`,
                  currentMetric?.label
                ]}
              />
              <Area
                type="monotone"
                dataKey={selectedMetric}
                stroke={currentMetric?.color}
                strokeWidth={2}
                fill={`url(#color-${selectedMetric})`}
                dot={{ fill: currentMetric?.color, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: currentMetric?.color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Activity Summary */}
      <Card className="p-5 border-0 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de actividades</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total actividades", value: activities.length, icon: Activity, color: "purple" },
            { label: "Minutos totales", value: activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0), icon: Calendar, color: "blue" },
            { label: "Calorías quemadas", value: activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0), icon: Flame, color: "orange" },
            { label: "Distancia (km)", value: activities.reduce((sum, a) => sum + (a.distance_km || 0), 0).toFixed(1), icon: Footprints, color: "emerald" }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="p-4 rounded-xl bg-gray-50">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                  stat.color === "purple" && "bg-purple-100",
                  stat.color === "blue" && "bg-blue-100",
                  stat.color === "orange" && "bg-orange-100",
                  stat.color === "emerald" && "bg-emerald-100"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    stat.color === "purple" && "text-purple-600",
                    stat.color === "blue" && "text-blue-600",
                    stat.color === "orange" && "text-orange-600",
                    stat.color === "emerald" && "text-emerald-600"
                  )} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Advanced Analysis Section */}
      {showAdvanced && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Análisis Avanzado</h2>
              <p className="text-sm text-gray-500">Tendencias a largo plazo, correlaciones y patrones</p>
            </div>
          </div>

          {/* Trend Analysis */}
          {trendAnalysis.length > 0 && (
            <TrendAnalysis trends={trendAnalysis} />
          )}

          {/* Correlations */}
          <div className="grid md:grid-cols-2 gap-6">
            {correlationData.sleepStepsData?.length > 5 && (
              <CorrelationChart
                data={correlationData.sleepStepsData}
                xMetric="sleep_hours"
                yMetric="steps"
                correlation={calculateCorrelation(correlationData.sleepStepsData)}
              />
            )}
            {correlationData.waterCaloriesData?.length > 5 && (
              <CorrelationChart
                data={correlationData.waterCaloriesData}
                xMetric="water_ml"
                yMetric="calories_burned"
                correlation={calculateCorrelation(correlationData.waterCaloriesData)}
              />
            )}
          </div>

          {/* Activity Heatmap */}
          {heatmapData.length > 0 && (
            <ActivityHeatmap
              data={heatmapData}
              selectedMonth={selectedMonth}
              onMonthChange={changeMonth}
              metricKey={selectedMetric}
              targetValue={getTargetValue()}
            />
          )}

          {/* Data Export */}
          <DataExport
            healthMetrics={allMetrics}
            activities={allActivities}
            meals={allMeals}
          />

          {/* Insights Card */}
          <Card className="p-5 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-purple-100">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Insights personalizados</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  {correlationData.sleepStepsData?.length > 5 && calculateCorrelation(correlationData.sleepStepsData) > 0.3 && (
                    <li>💡 Tus pasos aumentan cuando duermes mejor. Prioriza el descanso.</li>
                  )}
                  {trendAnalysis.find(t => t.label === "Pasos")?.change > 10 && (
                    <li>🎯 ¡Excelente! Tus pasos han aumentado esta semana.</li>
                  )}
                  {trendAnalysis.find(t => t.label === "Sueño")?.change < -10 && (
                    <li>😴 Tu sueño ha disminuido. Intenta acostarte más temprano.</li>
                  )}
                  {trendAnalysis.find(t => t.label === "Hidratación")?.change < 0 && (
                    <li>💧 Tu hidratación bajó esta semana. Pon recordatorios para beber agua.</li>
                  )}
                  {allMetrics.length < 14 && (
                    <li>📊 Registra más datos para obtener insights más precisos.</li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}