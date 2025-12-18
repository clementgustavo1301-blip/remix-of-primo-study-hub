import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { correctEssay, EssayFeedback } from "@/services/aiService";
import { updateStreak } from "@/services/streakService";
import PremiumGuard from "@/components/PremiumGuard";
import { FileText, Send, Loader2, Trophy, Target, Sparkles } from "lucide-react";
import Watermark from "@/components/Watermark";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const competencyNames = {
  c1: "Domínio da Norma Culta",
  c2: "Compreensão do Tema",
  c3: "Organização de Informações",
  c4: "Mecanismos Linguísticos",
  c5: "Proposta de Intervenção",
};

const Essay = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("essays")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setHistory(data);
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleSubmit = async () => {
    if (!content.trim() || content.length < 100) {
      toast.error("A redação deve ter pelo menos 100 caracteres");
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const result = await correctEssay(content, theme || undefined);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        setFeedback(result.data);

        // Update Streak
        if (user) {
          await updateStreak(user.id);
          window.dispatchEvent(new Event("profile_updated"));
        }

        toast.success("Correção concluída!");

        // Save to database
        const { error } = await supabase.from("essays").insert([{
          user_id: user!.id,
          content,
          score: result.data.score,
          feedback: JSON.parse(JSON.stringify(result.data)),
        }]);

        if (!error) {
          // Cleanup: Keep only last 5
          const { data: allEssays } = await supabase
            .from("essays")
            .select("id")
            .eq("user_id", user!.id)
            .order("created_at", { ascending: false });

          if (allEssays && allEssays.length > 5) {
            const toDelete = allEssays.slice(5).map(e => e.id);
            await supabase.from("essays").delete().in("id", toDelete);
          }

          fetchHistory();
        }
      }
    } catch (error) {
      console.error("Error correcting essay:", error);
      toast.error("Erro ao corrigir redação");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, max: number = 200) => {
    const percentage = score / max;
    if (percentage >= 0.8) return "text-emerald-400";
    if (percentage >= 0.6) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <PremiumGuard featureName="Correção de Redação com IA">
      <div className="space-y-6 slide-up">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Corretor de Redação</h1>
            <p className="text-muted-foreground">Avaliação nas 5 competências do ENEM</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 w-full">
          {/* Esquerda: Editor e Histórico */}
          <div className="space-y-6">
            {/* Editor */}
            <div className="glass rounded-3xl p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tema da Redação (opcional)
                </label>
                <Input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: A democratização do acesso à internet no Brasil"
                  className="input-glass"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Sua Redação
                </label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Cole ou escreva sua redação aqui..."
                  className="input-glass min-h-[400px] resize-none font-mono text-sm leading-relaxed"
                />
                <p className="text-xs text-muted-foreground mt-2 flex justify-between">
                  <span>{content.length} caracteres</span>
                  <span>Mínimo recomendado: 1800</span>
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading || content.length < 100}
                className="w-full btn-primary h-12 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Corrigindo...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Corrigir Redação
                  </>
                )}
              </Button>
            </div>

            {/* Histórico Recente */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Histórico Recente
              </h3>

              {history.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center text-muted-foreground text-sm">
                  Nenhuma redação corrigida ainda.
                </div>
              ) : (
                <div className="grid gap-3">
                  {history.map((item) => (
                    <div key={item.id} className="glass glass-hover rounded-xl p-4 flex items-center justify-between transition-all">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="font-medium truncate text-foreground/90 max-w-[200px]">
                          {item.content ? item.content.slice(0, 30) + "..." : "Redação sem título"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          <span>•</span>
                          {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`font-bold text-lg ${getScoreColor(item.score || 0, 1000)}`}>
                        {item.score || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Direita: Feedback */}
          <div className="space-y-6">
            {feedback ? (
              <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">

                {/* Score Card - FIXED CSS */}
                <div className="glass rounded-3xl p-8 flex flex-col items-center justify-center gap-6 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

                  {/* Circle Container */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      {/* Background Track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-white/5"
                      />
                      {/* Progress */}
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className={`${getScoreColor(feedback.score, 1000)} transition-all duration-1000 ease-out`}
                        style={{
                          strokeDasharray: 283,
                          strokeDashoffset: 283 - ((feedback.score / 1000) * 283),
                          stroke: 'currentColor',
                        }}
                      />
                    </svg>

                    {/* Score Text Centered */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Trophy className="h-6 w-6 text-amber-400 mb-1" />
                      <span className={`text-4xl font-bold ${getScoreColor(feedback.score, 1000)}`}>
                        {feedback.score}
                      </span>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider mt-4">
                    Nota Final do ENEM
                  </p>
                </div>

                {/* Competencies */}
                <div className="glass rounded-3xl p-6 space-y-5">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-primary" />
                    Avaliação por Competência
                  </h3>

                  {Object.entries(feedback.competencias).map(([key, score]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {competencyNames[key as keyof typeof competencyNames]}
                        </span>
                        <span className={`font-bold ${getScoreColor(score)}`}>
                          {score}/200
                        </span>
                      </div>
                      <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(score).replace('text-', 'bg-')}`}
                          style={{ width: `${(score / 200) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback Text */}
                <div className="glass rounded-3xl p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Análise Geral
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {feedback.feedback}
                    </p>
                  </div>

                  {feedback.melhorias && feedback.melhorias.length > 0 && (
                    <div className="pt-4 border-t border-white/5">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Target className="h-4 w-4 text-rose-400" />
                        Pontos de Atenção
                      </h3>
                      <ul className="space-y-2.5">
                        {feedback.melhorias.map((dica, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-3 bg-white/5 p-3 rounded-lg">
                            <div className="min-w-[6px] h-[6px] rounded-full bg-rose-400 mt-1.5" />
                            <span>{dica}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              // Empty State
              <div className="h-full flex flex-col items-center justify-center glass rounded-3xl p-12 text-center text-muted-foreground min-h-[500px]">
                <FileText className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-semibold mb-2 text-foreground/80">Aguardando Redação</h3>
                <p className="max-w-xs mx-auto">
                  Escreva seu texto ao lado e clique em corrigir para receber uma avaliação detalhada.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PremiumGuard>
  );
};

export default Essay;
