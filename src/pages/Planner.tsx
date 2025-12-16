import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
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
  ArrowLeft
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
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

const getSubjectColor = (subject: string) => {
  for (const [key, value] of Object.entries(subjectColors)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return "bg-primary/30 border-primary/50 text-primary";
};

const Planner = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [generating, setGenerating] = useState(false);

  const today = startOfDay(new Date());
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    const startDate = format(today, "yyyy-MM-dd");
    const endDate = format(addDays(today, 7), "yyyy-MM-dd");
    
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
      setTasks(data || []);
    }
    setLoading(false);
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

  const getTasksForDay = (day: Date) => 
    tasks.filter(t => t.date && isSameDay(new Date(t.date + "T12:00:00"), day));

  const completedTasks = tasks.filter(t => t.is_done).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleGeneratePlan = async (hours: number, focus: string, weakness: string) => {
    if (!user) return;
    
    setGenerating(true);
    setShowWizard(false);
    
    try {
      const result = await createStudyPlan(hours, focus, weakness, 7);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data && result.data.length > 0) {
        // Clear existing tasks for this week
        await supabase
          .from("study_tasks")
          .delete()
          .eq("user_id", user.id)
          .gte("date", format(today, "yyyy-MM-dd"))
          .lte("date", format(addDays(today, 7), "yyyy-MM-dd"));

        // Insert new tasks
        const tasksToInsert = result.data.map((task) => ({
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

        await fetchTasks();
        toast.success("Cronograma gerado com sucesso! 🚀");
      }
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error("Erro ao gerar cronograma. Tente novamente.");
    } finally {
      setGenerating(false);
    }
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

  return (
    <div className="space-y-6 slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Planner Inteligente</h1>
          <p className="text-muted-foreground mt-1">Organize sua semana com ajuda da IA</p>
        </div>
        
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
            <Calendar className="h-10 w-10 text-primary" />
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
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-3 min-w-max lg:min-w-0 lg:grid lg:grid-cols-7">
            {weekDays.map((day, index) => {
              const dayTasks = getTasksForDay(day);
              const isToday = isSameDay(day, today);
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`flex-shrink-0 w-[200px] lg:w-auto ${isToday ? 'lg:min-w-[180px]' : ''}`}
                >
                  <div className={`glass rounded-2xl p-3 h-full min-h-[300px] ${isToday ? 'ring-2 ring-primary/50' : ''}`}>
                    {/* Day Header */}
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

                    {/* Tasks */}
                    <div className="space-y-2">
                      {dayTasks.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4 opacity-50">
                          Sem tarefas
                        </p>
                      )}
                      {dayTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => toggleTask(task.id, task.is_done)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            task.is_done 
                              ? 'bg-white/5 border-white/10 opacity-60' 
                              : `${getSubjectColor(task.subject)} hover:scale-[1.02]`
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {task.is_done ? (
                              <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-60" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${task.is_done ? 'line-through' : ''}`}>
                                {task.subject}
                              </p>
                              {task.topic && (
                                <p className={`text-[10px] opacity-80 line-clamp-2 mt-0.5 ${task.is_done ? 'line-through' : ''}`}>
                                  {task.topic}
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
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      <WizardModal 
        open={showWizard} 
        onOpenChange={setShowWizard} 
        onGenerate={handleGeneratePlan} 
      />
    </div>
  );
};

interface WizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (hours: number, focus: string, weakness: string) => void;
}

const WizardModal = ({ open, onOpenChange, onGenerate }: WizardModalProps) => {
  const [step, setStep] = useState(1);
  const [hours, setHours] = useState(4);
  const [focus, setFocus] = useState("");
  const [weakness, setWeakness] = useState("");

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!focus.trim()) {
      toast.error("Informe seu foco principal");
      return;
    }
    onGenerate(hours, focus, weakness);
    // Reset
    setStep(1);
    setHours(4);
    setFocus("");
    setWeakness("");
  };

  const canProceed = () => {
    if (step === 1) return true;
    if (step === 2) return focus.trim().length > 0;
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

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`w-2 h-2 rounded-full transition-all ${
                s === step ? 'bg-primary w-6' : s < step ? 'bg-primary/50' : 'bg-white/20'
              }`} 
            />
          ))}
        </div>

        <div className="py-4 min-h-[200px]">
          {/* Step 1: Hours */}
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

          {/* Step 2: Focus */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <Target className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Foco Principal</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Qual é seu objetivo ou curso desejado?
                </p>
              </div>
              
              <div className="px-4">
                <Input
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Ex: Medicina na USP, Direito na FGV..."
                  className="input-glass text-center"
                />
              </div>
            </div>
          )}

          {/* Step 3: Weakness */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Pontos Fracos</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Quais matérias você tem mais dificuldade? (Opcional)
                </p>
              </div>
              
              <div className="px-4">
                <Input
                  value={weakness}
                  onChange={(e) => setWeakness(e.target.value)}
                  placeholder="Ex: Física, Matemática, Redação..."
                  className="input-glass text-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="flex-1 border-white/20 hover:bg-white/10"
            >
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
              className="flex-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white"
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

export default Planner;
