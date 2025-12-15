import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { correctEssay, EssayFeedback } from "@/services/aiService";
import PremiumGuard from "@/components/PremiumGuard";
import { FileText, Send, Loader2, Trophy, Target } from "lucide-react";
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
  const [content, setContent] = useState("");
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null);

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
        
        // Save to database
        await supabase.from("essays").insert([{
          user_id: user!.id,
          content,
          score: result.data.score,
          feedback: JSON.parse(JSON.stringify(result.data)),
        }]);

        toast.success("Redação corrigida com sucesso!");
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
    if (percentage >= 0.8) return "text-success";
    if (percentage >= 0.6) return "text-amber-400";
    return "text-destructive";
  };

  return (
    <PremiumGuard featureName="Correção de Redação com IA">
      <div className="space-y-6 slide-up">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Corretor de Redação</h1>
            <p className="text-muted-foreground">Avaliação nas 5 competências do ENEM</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
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
                className="input-glass min-h-[400px] resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {content.length} caracteres • Mínimo recomendado: 1800
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || content.length < 100}
              className="w-full btn-primary"
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

          {/* Feedback */}
          <div className="space-y-4">
            {feedback ? (
              <>
                {/* Score Display */}
                <div className="glass rounded-3xl p-8 text-center scale-in">
                  <div className="relative inline-flex items-center justify-center">
                    {/* Animated ring */}
                    <svg className="absolute w-40 h-40 -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        className="text-white/10"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        strokeWidth="6"
                        strokeLinecap="round"
                        className={`${feedback.score >= 800 ? 'text-success' : feedback.score >= 600 ? 'text-amber-400' : 'text-destructive'} transition-all duration-1000`}
                        style={{
                          strokeDasharray: `${(feedback.score / 1000) * 283} 283`,
                          stroke: 'currentColor',
                        }}
                      />
                    </svg>
                    <div className="flex flex-col items-center">
                      <div className={`text-5xl font-bold ${getScoreColor(feedback.score, 1000)}`}>
                        {feedback.score}
                      </div>
                      <Trophy className="h-6 w-6 text-amber-400 mt-1" />
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4">de 1000 pontos</p>
                </div>

                {/* Competencies */}
                <div className="glass rounded-3xl p-6 space-y-4 relative overflow-hidden">
                  <Watermark />
                  <div className="relative z-10 select-none">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Avaliação por Competência
                    </h3>
                  
                  {Object.entries(feedback.competencies).map(([key, comp]) => (
                    <div key={key} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-foreground">
                          {competencyNames[key as keyof typeof competencyNames]}
                        </span>
                        <span className={`font-bold ${getScoreColor(comp.score)}`}>
                          {comp.score}/200
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${(comp.score / 200) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">{comp.feedback}</p>
                    </div>
                  ))}
                  </div>
                </div>

                {/* General Feedback */}
                <div className="glass rounded-3xl p-6 select-none">
                  <h3 className="font-semibold text-foreground mb-3">Feedback Geral</h3>
                  <p className="text-muted-foreground">{feedback.generalFeedback}</p>
                </div>
              </>
            ) : (
              <div className="glass rounded-3xl p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Aguardando sua redação
                </h3>
                <p className="text-muted-foreground">
                  Escreva ou cole sua redação e clique em "Corrigir" para receber feedback detalhado
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
