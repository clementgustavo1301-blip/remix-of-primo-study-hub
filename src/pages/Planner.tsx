import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { format, addDays, isSameDay, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Circle,
  Calendar,
  Brain,
  Target,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Plus,
  BookOpen,
  GraduationCap,
  Trash2,
  MapPin
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createStudyPlan } from "@/services/aiService";
import PremiumGuard from "@/components/PremiumGuard";
import confetti from "canvas-confetti";

interface StudyTask {
  id: string;
  subject: string;
  topic: string | null;
  date: string | null;
  is_done: boolean | null;
  duration_minutes: number | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  type: string | null;
}

const subjectColors: Record<string, string> = {
  "Matemática": "bg-blue-500/30 border-blue-500/50 text-blue-300",
  "Física": "bg-cyan-500/30 border-cyan-500/50 text-cyan-300",
  "Química": "bg-green-500/30 border-green-500/50 text-green-300",
  "Biologia": "bg-emerald-500/30 border-emerald-500/50 text-emerald-300",
  "Português": "bg-amber-500/30 border-amber-500/50 text-amber-300",
  "Redação": "bg-orange-500/30 border-orange-500/50 text-orange-300",
  "Literatura": "bg-rose-500/30 border-rose-500/50 text-rose-300",
  "História": "bg-yellow-500/30 border-yellow-500/50 text-yellow-300",
  "Geografia": "bg-lime-500/30 border-lime-500/50 text-lime-300",
  "Filosofia": "bg-purple-500/30 border-purple-500/50 text-purple-300",
  "Sociologia": "bg-pink-500/30 border-pink-500/50 text-pink-300",
  "Inglês": "bg-indigo-500/30 border-indigo-500/50 text-indigo-300",
};

const eventTypeColors: Record<string, string> = {
  "prova": "bg-red-500/30 border-red-500/50 text-red-300",
  "simulado": "bg-purple-500/30 border-purple-500/50 text-purple-300",
  "trabalho": "bg-amber-500/30 border-amber-500/50 text-amber-300",
  "aula": "bg-blue-500/30 border-blue-500/50 text-blue-300",
  "outro": "bg-gray-500/30 border-gray-500/50 text-gray-300",
};

const eventTypeLabels: Record<string, string> = {
  "prova": "Prova",
  "simulado": "Simulado",
  "trabalho": "Trabalho",
  "aula": "Aula Extra",
  "outro": "Outro",
};

const getSubjectColor = (subject: string) => {
  for (const [key, value] of Object.entries(subjectColors)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return "bg-primary/30 border-primary/50 text-primary";
};

const getEventColor = (type: string | null) => {
  return eventTypeColors[type || "outro"] || eventTypeColors["outro"];
};

const Planner = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("cronograma");

  // Day Details Modal State
  const [selectedDayTasks, setSelectedDayTasks] = useState<StudyTask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<Date | null>(null);

  const today = startOfDay(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  useEffect(() => {
    if (user) {
      console.log("Initial fetch for user:", user.id);
      fetchTasks();
      fetchEvents();
    }
  }, [user]);

  const fetchTasks = async () => {
    // Widen range to handle timezone edge cases
    const startDate = format(addDays(today, -1), "yyyy-MM-dd");
    const endDate = format(addDays(today, 8), "yyyy-MM-dd");

    console.log(`Fetching tasks from ${startDate} to ${endDate}...`);

    const { data, error } = await supabase
      .from("study_tasks")
      .select("*")
      .eq("user_id", user?.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Erro ao carregar tarefas");
    } else {
      console.log("Tasks fetched:", data);
      setTasks((data || []) as StudyTask[]);
    }
    setLoading(false);
  };

  const fetchEvents = async () => {
    const startDate = format(today, "yyyy-MM-dd");
    const endDate = format(addDays(today, 30), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user?.id)
      .gte("start_time", startDate)
      .lte("start_time", endDate + "T23:59:59")
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
  };

  const toggleTask = async (taskId: string, currentState: boolean | null) => {
    const newState = !currentState;

    const { error } = await supabase
      .from("study_tasks")
      .update({ is_done: newState })
      .eq("id", taskId);

    if (error) {
      toast.error("Erro ao atualizar tarefa");
      return;
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_done: newState } : t));

    if (newState) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#8b5cf6', '#a855f7']
      });
      toast.success("+10 XP! Tarefa concluída! 🎉");
    }
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", eventId);

    if (error) {
      toast.error("Erro ao excluir evento");
      return;
    }

    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success("Evento excluído");
  };

  // Helper for Area Colors
  const getAreaColor = (tag: string) => {
    if (tag.includes("Natureza")) return "border-l-4 border-l-green-400";
    if (tag.includes("Humanas")) return "border-l-4 border-l-rose-400";
    if (tag.includes("Matemática")) return "border-l-4 border-l-yellow-400";
    if (tag.includes("Linguagens")) return "border-l-4 border-l-blue-400";
    if (tag.includes("Redação")) return "border-l-4 border-l-purple-400";
    return "";
  };

  // Debug check
  const debugLog = (msg: string, data: any) => {
    // console.log(`[DEBUG] ${msg}`, data); 
  };

  const getTasksForDay = (day: Date) => {
    // Robust comparison: Slice first 10 chars (YYYY-MM-DD) to ignore time/timezone shifts
    const targetDate = format(day, "yyyy-MM-dd");

    return tasks.filter(t => {
      if (!t.date) return false;
      const taskDate = t.date.substring(0, 10); // Handle both "2024-12-18" and "2024-12-18T10:00:00"
      return taskDate === targetDate;
    });
  };

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(parseISO(e.start_time), day));

  const completedTasks = tasks.filter(t => t.is_done).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Render Loop Check
  // console.log("Tasks in Component:", tasks); 

  const handleDayClick = (day: Date) => {
    const dayTasks = getTasksForDay(day);
    setSelectedDayTasks(dayTasks);
    setActiveDay(day);
    setIsModalOpen(true);
  };

  const handleGeneratePlan = async (hours: number, university: string, course: string, weaknesses: string[]) => {
    if (!user) return;

    setGenerating(true);
    setShowWizard(false);

    try {
      // API now returns { summary: string, tasks: StudyTask[] }
      const result = await createStudyPlan(hours, university, course, weaknesses, 7);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        // Safe access with fallback
        const tasksToSave = result.data.tasks || [];

        if (!Array.isArray(tasksToSave) || tasksToSave.length === 0) {
          toast.error("A IA não gerou tarefas válidas. Tente novamente.");
          return;
        }

        // 1. Strict Reset: Delete ALL existing tasks/events for this user
        console.log("Resetting planner for user:", user.id);

        await supabase.from("study_tasks").delete().eq("user_id", user.id);
        await supabase.from("events").delete().eq("user_id", user.id);

        // 2. Insert new tasks
        const tasksToInsert = tasksToSave.map((task) => ({
          user_id: user.id,
          subject: task.subject,
          topic: task.topic,
          date: task.date,
          duration_minutes: task.duration_minutes,
          is_done: false
        }));

        const { error: insertError } = await supabase
          .from("study_tasks")
          .insert(tasksToInsert);

        if (insertError) throw insertError;

        // 3. Refresh UI immediately
        await fetchTasks();
        await fetchEvents();

        // Show Strategy Summary!
        toast.success("Estratégia SISU Gerada! 🚀");
        if (result.data.summary) {
          toast(result.data.summary, {
            duration: 8000,
            icon: '🧠',
            style: {
              background: '#1e1e2e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)'
            }
          });
        }
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error("Erro ao gerar cronograma. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddEvent = async (eventData: { title: string; date: string; time: string; type: string; location: string }) => {
    if (!user) return;

    const startTime = `${eventData.date}T${eventData.time}:00`;

    const { error } = await supabase
      .from("events")
      .insert({
        user_id: user.id,
        title: eventData.title,
        start_time: startTime,
        type: eventData.type,
        location: eventData.location || null
      });

    if (error) {
      toast.error("Erro ao adicionar evento");
      return;
    }

    await fetchEvents();
    setShowEventModal(false);
    toast.success("Evento adicionado! 📅");
  };

  if (loading || generating) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            {generating ? "A IA está organizando sua rotina..." : "Carregando planner..."}
          </p>
          {generating && (
            <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
          )}
        </div>
      </div>
    );
  }

  console.log("Tarefas no Estado:", tasks);

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planner de Estudos</h1>
          <p className="text-muted-foreground mt-1">Organize sua semana e compromissos</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass w-full sm:w-auto grid grid-cols-2 gap-1 p-1">
          <TabsTrigger
            value="cronograma"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Brain className="h-4 w-4 mr-2" />
            Cronograma IA
          </TabsTrigger>
          <TabsTrigger
            value="agenda"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Agenda Manual
          </TabsTrigger>
        </TabsList>

        {/* Cronograma IA Tab */}
        <TabsContent value="cronograma" className="mt-6 space-y-6">
          {/* Action Button */}
          <div className="flex justify-end">
            {profile?.is_pro ? (
              <Button onClick={() => setShowWizard(true)} className="btn-primary group">
                <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                Criar Novo Cronograma
              </Button>
            ) : (
              <PremiumGuard featureName="o Planner Inteligente">
                <Button className="btn-primary">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Criar Novo Cronograma
                </Button>
              </PremiumGuard>
            )}
          </div>

          {/* Progress Bar */}
          {totalTasks > 0 && (
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Progresso da Semana</span>
                <span className="text-sm text-muted-foreground">{completedTasks}/{totalTasks} tarefas</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-right text-sm text-primary mt-1 font-medium">{progressPercent}%</p>
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="glass rounded-3xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum cronograma ativo</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Deixe a IA criar um plano de estudos personalizado para sua semana.
                Basta informar sua disponibilidade e objetivos.
              </p>
              {profile?.is_pro ? (
                <Button onClick={() => setShowWizard(true)} className="btn-primary">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Criar Primeiro Cronograma
                </Button>
              ) : (
                <PremiumGuard featureName="o Planner Inteligente">
                  <Button className="btn-primary">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Criar Primeiro Cronograma
                  </Button>
                </PremiumGuard>
              )}
            </div>
          )}

          {/* Weekly Kanban View */}
          {tasks.length > 0 && (
            <div className="pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {weekDays.map((day) => {
                  const dayTasks = getTasksForDay(day);
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={day.toISOString()}
                      className="flex-shrink-0"
                    >
                      <div
                        onClick={() => handleDayClick(day)}
                        className={`glass rounded-2xl p-4 h-full min-h-[280px] cursor-pointer transition-all hover:bg-white/5 hover:scale-[1.02] hover:shadow-xl border border-white/5 ${isToday ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
                      >
                        <div className={`text-center mb-3 pb-2 border-b border-white/10 ${isToday ? 'border-primary/30' : ''}`}>
                          <p className={`text-xs uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                            {format(day, "EEE", { locale: ptBR })}
                          </p>
                          <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                            {format(day, "d")}
                          </p>
                          {isToday && (
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Hoje
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 pointer-events-none">
                          {dayTasks.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4 opacity-50">
                              Sem tarefas
                            </p>
                          )}
                          {dayTasks.map((task) => (
                            <div
                              key={task.id}
                              className={`w-full text-left p-3 rounded-xl border transition-all ${task.is_done
                                ? 'bg-white/5 border-white/10 opacity-60'
                                : `${getSubjectColor(task.subject)}`
                                }`}
                            >
                              <div className="flex items-start gap-2">
                                {task.is_done ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-60" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-semibold leading-snug ${task.is_done ? 'line-through opacity-70' : ''}`}>
                                    {task.topic || task.subject}
                                  </p>
                                  {(task.topic || task.subject) && (
                                    <p className={`text-xs opacity-80 mt-1 leading-relaxed ${task.is_done ? 'line-through' : ''}`}>
                                      {task.subject}
                                    </p>
                                  )}
                                  {task.duration_minutes && (
                                    <div className="flex items-center gap-1 mt-1 opacity-60">
                                      <Clock className="h-3 w-3" />
                                      <span className="text-[10px]">{task.duration_minutes}min</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Agenda Manual Tab */}
        <TabsContent value="agenda" className="mt-6 space-y-6">
          {/* Action Button */}
          <div className="flex justify-end">
            <Button onClick={() => setShowEventModal(true)} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Evento
            </Button>
          </div>

          {/* Empty State */}
          {events.length === 0 && (
            <div className="glass rounded-3xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum evento cadastrado</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Adicione suas provas, simulados e outros compromissos da escola ou cursinho.
              </p>
              <Button onClick={() => setShowEventModal(true)} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Evento
              </Button>
            </div>
          )}

          {/* Events Weekly View */}
          {events.length > 0 && (
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-3 min-w-max lg:min-w-0 lg:grid lg:grid-cols-7">
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`flex-shrink-0 w-[200px] lg:w-auto ${isToday ? 'lg:min-w-[180px]' : ''}`}
                    >
                      <div className={`glass rounded-2xl p-3 h-full min-h-[300px] ${isToday ? 'ring-2 ring-primary/50' : ''}`}>
                        <div className={`text-center mb-3 pb-2 border-b border-white/10 ${isToday ? 'border-primary/30' : ''}`}>
                          <p className={`text-xs uppercase tracking-wide ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                            {format(day, "EEE", { locale: ptBR })}
                          </p>
                          <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                            {format(day, "d")}
                          </p>
                          {isToday && (
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              Hoje
                            </span>
                          )}
                        </div>

                        <div className="space-y-2">
                          {dayEvents.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4 opacity-50">
                              Sem eventos
                            </p>
                          )}
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={`w-full text-left p-3 rounded-xl border transition-all ${getEventColor(event.type)} hover:scale-[1.02] group relative`}
                            >
                              <button
                                onClick={() => deleteEvent(event.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                              <div className="flex items-start gap-2">
                                {event.type === "prova" ? (
                                  <BookOpen className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                ) : event.type === "simulado" ? (
                                  <GraduationCap className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Calendar className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate">
                                    {event.title}
                                  </p>
                                  <p className="text-[10px] opacity-80 mt-0.5">
                                    {eventTypeLabels[event.type || "outro"]}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1 opacity-60">
                                    <Clock className="h-3 w-3" />
                                    <span className="text-[10px]">
                                      {format(parseISO(event.start_time), "HH:mm")}
                                    </span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1 mt-0.5 opacity-60">
                                      <MapPin className="h-3 w-3" />
                                      <span className="text-[10px] truncate">{event.location}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upcoming Events List */}
          {events.length > 0 && (
            <div className="glass rounded-2xl p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Próximos Eventos
              </h3>
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-4 p-3 rounded-xl border ${getEventColor(event.type)}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold">{format(parseISO(event.start_time), "d")}</span>
                      <span className="text-[10px] uppercase">{format(parseISO(event.start_time), "MMM", { locale: ptBR })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{event.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(parseISO(event.start_time), "HH:mm")}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10">
                      {eventTypeLabels[event.type || "outro"]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Wizard Modal */}
      <WizardModal
        open={showWizard}
        onOpenChange={setShowWizard}
        onGenerate={handleGeneratePlan}
      />

      {/* Add Event Modal */}
      <AddEventModal
        open={showEventModal}
        onOpenChange={setShowEventModal}
        onAdd={handleAddEvent}
      />
    </div>
  );
};

interface WizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (hours: number, university: string, course: string, weaknesses: string[]) => void;
}

const WizardModal = ({ open, onOpenChange, onGenerate }: WizardModalProps) => {
  const [step, setStep] = useState(1);
  const [hours, setHours] = useState(4);
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [customWeakness, setCustomWeakness] = useState("");

  const commonSubjects = [
    "Matemática", "Física", "Química", "Biologia",
    "História", "Geografia", "Português", "Redação",
    "Filosofia", "Sociologia", "Inglês"
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleWeakness = (subject: string) => {
    setWeaknesses(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const addCustomWeakness = () => {
    if (customWeakness.trim() && !weaknesses.includes(customWeakness.trim())) {
      setWeaknesses([...weaknesses, customWeakness.trim()]);
      setCustomWeakness("");
    }
  };

  const handleSubmit = () => {
    if (!course.trim() || !university.trim()) {
      toast.error("Preencha o curso e a faculdade");
      return;
    }
    // Simple persistence for UX
    localStorage.setItem("user_SISU_university", university);
    localStorage.setItem("user_SISU_course", course);

    onGenerate(hours, university, course, weaknesses);
    setStep(1);
    setHours(4);
    // Keep university/course filled? User requested persistence.
    // We will reset them here but next open could read them.
    // For now, let's reset to keep it clean, but initial state should load from storage.
    setWeaknesses([]);
  };

  useEffect(() => {
    // Load persisted data on mount
    const savedUni = localStorage.getItem("user_SISU_university");
    const savedCourse = localStorage.getItem("user_SISU_course");
    if (savedUni) setUniversity(savedUni);
    if (savedCourse) setCourse(savedCourse);
  }, [open]);


  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return university.trim().length > 0 && course.trim().length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/20 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Criar Cronograma Inteligente
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Passo {step} de 3
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${s === step ? 'bg-primary w-6' : s < step ? 'bg-primary/50' : 'bg-white/20'
                }`}
            />
          ))}
        </div>

        <div className="py-4 min-h-[200px]">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Disponibilidade</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Quantas horas você pode estudar por dia?
                </p>
              </div>

              <div className="space-y-4 px-4">
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">{hours}</span>
                  <span className="text-xl text-muted-foreground ml-1">horas</span>
                </div>
                <Slider
                  value={[hours]}
                  onValueChange={(v) => setHours(v[0])}
                  min={1}
                  max={12}
                  step={1}
                  className="py-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1h</span>
                  <span>12h</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <Target className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Foco Principal</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Qual é seu objetivo no SISU?
                </p>
              </div>

              <div className="px-4 space-y-4">
                <div className="space-y-2">
                  <Label>Curso Desejado</Label>
                  <Input
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="Ex: Medicina, Direito, Engenharia..."
                    className="input-glass"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Faculdade / Universidade</Label>
                  <Input
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Ex: USP, UFRJ, UFMG..."
                    className="input-glass"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Dificuldades Específicas</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Quais matérias ou assuntos te dão mais trabalho?
                </p>
              </div>

              <div className="px-2">
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {commonSubjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => toggleWeakness(subject)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${weaknesses.includes(subject)
                        ? "bg-amber-500/20 border-amber-500 text-amber-300"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                        }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    value={customWeakness}
                    onChange={(e) => setCustomWeakness(e.target.value)}
                    placeholder="Ex: Logaritmos, Eletrodinâmica..."
                    className="input-glass h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addCustomWeakness()}
                  />
                  <Button size="sm" variant="ghost" onClick={addCustomWeakness} className="h-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  A IA vai cruzar isso com os Pesos do SISU.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 btn-primary"
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 btn-primary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Cronograma
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: { title: string; date: string; time: string; type: string; location: string }) => void;
}

const AddEventModal = ({ open, onOpenChange, onAdd }: AddEventModalProps) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [type, setType] = useState("prova");
  const [location, setLocation] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !date) {
      toast.error("Preencha o título e a data");
      return;
    }
    onAdd({ title, date, time, type, location });
    setTitle("");
    setDate("");
    setTime("08:00");
    setType("prova");
    setLocation("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-white/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Adicionar Evento
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Cadastre provas, simulados ou outros compromissos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Título do Evento</Label>
            <Input
              id="event-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Prova de Matemática, Simulado ENEM..."
              className="input-glass"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-type">Tipo de Evento</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="input-glass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-strong border-white/20">
                <SelectItem value="prova">📝 Prova</SelectItem>
                <SelectItem value="simulado">🎯 Simulado</SelectItem>
                <SelectItem value="trabalho">📚 Trabalho</SelectItem>
                <SelectItem value="aula">👨‍🏫 Aula Extra</SelectItem>
                <SelectItem value="outro">📌 Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-date">Data</Label>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-time">Horário</Label>
              <Input
                id="event-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-glass"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-location">Local (opcional)</Label>
            <Input
              id="event-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Sala 201, Cursinho, Escola..."
              className="input-glass"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1 btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Planner;
