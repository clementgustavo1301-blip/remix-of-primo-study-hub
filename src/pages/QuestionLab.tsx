import { useState } from "react";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateStreak } from "@/services/streakService";
import { Brain, ChevronRight, CheckCircle2, CheckCircle, XCircle, AlertCircle, Loader2, Search, Sparkles, Flame, BookmarkPlus } from "lucide-react";
import Watermark from "@/components/Watermark";
import { generateAndCacheQuestions } from "@/services/questionService";

const subjects = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Português", "Literatura", "Filosofia", "Sociologia"];

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const QuestionLab = () => {
  const { user } = useAuth();
  const { saveQuestion } = useSavedQuestions();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [fromPool, setFromPool] = useState(false);

  const searchPool = async () => {
    if (!subject) return toast.error("Selecione uma matéria");
    setLoading(true);
    try {
      let query = supabase.from("questions_pool").select("*").eq("subject", subject);
      if (topic) query = query.ilike("topic", `%${topic}%`);
      const { data } = await query.limit(10);
      if (data && data.length > 0) {
        const random = data[Math.floor(Math.random() * data.length)];
        setQuestion(random.content as unknown as Question);
        setFromPool(true);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        toast.info("Nenhuma questão encontrada. Tente gerar com IA!");
      }
    } catch (e) { toast.error("Erro ao buscar"); }
    setLoading(false);
  };

  const generateWithAI = async (hard = false) => {
    if (!subject) return toast.error("Selecione uma matéria");
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const questions = await generateAndCacheQuestions(
        subject,
        topic || "",
        hard ? 'hard' : 'medium',
        user?.id
      );

      if (questions && Array.isArray(questions) && questions.length > 0) {
        setQuestion(questions[0] as unknown as Question);
        setFromPool(false);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        throw new Error("Formato inválido retornado pela IA");
      }
    } catch (e) { toast.error("Erro ao gerar questão"); console.error(e); }
    setLoading(false);
  };

  const handleAnswer = async (idx: number) => {
    if (showResult) return;
    setSelectedAnswer(idx);
    setShowResult(true);

    if (question && idx === question.correctAnswer) {
      toast.success("Resposta Certa! 🎯");
      if (user) {
        await updateStreak(user.id);
        window.dispatchEvent(new Event("profile_updated"));
      }
    }
  };

  const handleSave = async () => {
    if (!question || selectedAnswer === null) return;
    await saveQuestion({
      content: question,
      subject,
      topic: topic || undefined,
      is_correct: selectedAnswer === question.correctAnswer
    });
  };

  const handleGenerateNext = () => {
    setQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    generateWithAI(false); // Default to 'medium' for speed/stability
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 slide-up">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Laboratório de Questões</h1>
        <p className="text-muted-foreground">Pratique com questões do banco ou geradas por IA</p>
      </div>

      {/* Controls */}
      <div className="glass rounded-3xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="input-glass"><SelectValue placeholder="Matéria" /></SelectTrigger>
            <SelectContent className="glass border-white/20">
              {subjects.map((s) => <SelectItem key={s} value={s} className="focus:bg-white/10">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Tópico (opcional)" className="input-glass" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={searchPool} disabled={loading} className="btn-glass flex-1 min-w-[140px]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" />Buscar no Banco</>}
          </Button>
          <Button onClick={() => generateWithAI(false)} disabled={loading} className="btn-primary flex-1 min-w-[140px]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" />Gerar com IA</>}
          </Button>
          <Button onClick={() => generateWithAI(true)} disabled={loading} className="btn-streak flex-1 min-w-[140px]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Flame className="h-4 w-4 mr-2" />Desafio Hard</>}
          </Button>
        </div>
      </div>

      {/* Question Card */}
      {question && (
        <div className="glass rounded-3xl p-6 space-y-6 scale-in relative overflow-hidden">
          <Watermark />
          <div className="relative z-10 select-none">
            {fromPool && <span className="text-xs bg-secondary/30 text-secondary px-3 py-1 rounded-full">Banco Comunitário</span>}
            <p className="text-lg text-foreground leading-relaxed">{question.question}</p>
            <div className="space-y-3">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${showResult
                    ? idx === question.correctAnswer
                      ? "bg-emerald-500/20 border border-emerald-500/50"
                      : idx === selectedAnswer
                        ? "bg-rose-500/20 border border-rose-500/50"
                        : "glass-subtle"
                    : "glass glass-hover"
                    }`}
                >
                  <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                </button>
              ))}
            </div>
            {showResult && (
              <div className="space-y-4 fade-in">
                <div className={`flex items-center gap-2 ${selectedAnswer === question.correctAnswer ? "text-emerald-400" : "text-rose-400"}`}>
                  {selectedAnswer === question.correctAnswer ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  <span className="font-medium">{selectedAnswer === question.correctAnswer ? "Parabéns! Você acertou!" : "Resposta incorreta"}</span>
                </div>
                <div className="glass-subtle rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Explicação:</p>
                  <p className="text-foreground">{question.explanation}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="btn-glass flex-1">
                    <BookmarkPlus className="h-4 w-4 mr-2" />Salvar
                  </Button>
                  <Button onClick={handleGenerateNext} className="btn-primary flex-1">
                    <ChevronRight className="h-4 w-4 mr-2" />Próxima Questão
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionLab;
