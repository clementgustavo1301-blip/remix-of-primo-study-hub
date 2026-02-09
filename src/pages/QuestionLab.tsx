import { useState } from "react";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateStreak } from "@/services/streakService";
import { Brain, ChevronRight, CheckCircle2, CheckCircle, XCircle, AlertCircle, Loader2, Search, Sparkles, Flame, BookmarkPlus, ArrowLeft } from "lucide-react";
import Watermark from "@/components/Watermark";
import { generateAndCacheQuestions } from "@/services/questionService";

const subjects = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Português", "Literatura", "Filosofia", "Sociologia"];

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

import { useProfile } from "@/hooks/useProfile";

const QuestionLab = () => {
  const { user } = useAuth();
  const { addXP } = useProfile();
  const { saveQuestion } = useSavedQuestions();

  // Navigation State
  const [mode, setMode] = useState<'initial' | 'bank' | 'generator'>('initial');

  // Question State
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState<'all' | 'ai' | 'official'>('all'); // Bank filter
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [fromPool, setFromPool] = useState(false);

  // Bank Logic
  const searchPool = async () => {
    if (!subject) return toast.error("Selecione uma matéria");
    setLoading(true);
    try {
      let query = supabase.from("questions_pool").select("*").eq("subject", subject);
      if (topic) query = query.ilike("topic", `%${topic}%`);

      // Source Filter Logic (Mocked for now as we don't strictly have 'source' column yet beyond created_by)
      // If we wanted to filter only AI, we could filter by specific users or metadata if available.
      // For now, we just search everything.

      const { data } = await query.limit(20);

      if (data && data.length > 0) {
        const random = data[Math.floor(Math.random() * data.length)];

        // Handle both older array format and newer object format if needed
        let content = random.content;
        if (Array.isArray(content)) content = content[0];

        setQuestion(content as unknown as Question);
        setFromPool(true);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        toast.info("Nenhuma questão encontrada no banco com esses filtros.");
      }
    } catch (e) { toast.error("Erro ao buscar"); }
    setLoading(false);
  };

  // AI Generator Logic
  const generateWithAI = async (hard = false) => {
    if (!subject) return toast.error("Selecione uma matéria");
    setLoading(true);
    setQuestion(null); // Clear previous to show loading state clearly

    try {
      const { data: { user } } = await supabase.auth.getUser();
      // ALWAYS Bypass Cache in Generator Mode to avoid "same question" bug
      const questions = await generateAndCacheQuestions(
        subject,
        topic || "",
        hard ? 'hard' : 'medium',
        user?.id,
        true // bypassCache = true
      );

      if (questions && Array.isArray(questions) && questions.length > 0) {
        setQuestion(questions[0] as unknown as Question);
        setFromPool(false);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        throw new Error("Formato inválido retornado pela IA");
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar questão");
      console.error(e);
    }
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
        await addXP(10);
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

  const handleNext = () => {
    if (mode === 'bank') {
      searchPool();
    } else {
      // In generator mode, 'next' means generate another one with same settings
      generateWithAI(false); // We can't know if it was hard or not easily without state, defaulting to medium or we could add 'difficulty' state.
      // Ideally we should track 'lastDifficulty'
    }
  };

  const resetState = () => {
    setQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setTopic("");
    // We keep subject as it might be annoying to re-select
  };

  // Views
  if (mode === 'initial') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 slide-up p-4">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Laboratório de Questões
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha como você quer estudar hoje. Explore nosso banco comunitário ou utilize nossa IA para criar desafios personalizados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {/* Bank Option */}
          <button
            onClick={() => { setMode('bank'); resetState(); }}
            className="group relative h-64 rounded-3xl overflow-hidden glass hover:bg-white/5 transition-all duration-500 border border-white/10 hover:border-primary/50 text-left p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="p-3 bg-blue-500/20 w-fit rounded-xl">
                <Search className="h-8 w-8 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors">Banco de Questões</h3>
                <p className="text-muted-foreground">
                  Acesse milhares de questões de provas anteriores e simulados compartilhados pela comunidade.
                </p>
              </div>
              <div className="flex items-center text-blue-400 font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                Acessar Banco <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          </button>

          {/* AI Option */}
          <button
            onClick={() => { setMode('generator'); resetState(); }}
            className="group relative h-64 rounded-3xl overflow-hidden glass hover:bg-white/5 transition-all duration-500 border border-white/10 hover:border-purple-500/50 text-left p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="p-3 bg-purple-500/20 w-fit rounded-xl">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">Gerador IA</h3>
                <p className="text-muted-foreground">
                  Crie questões inéditas e personalizadas instantaneamente com nossa Inteligência Artificial.
                </p>
              </div>
              <div className="flex items-center text-purple-400 font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                Criar Questões <ChevronRight className="ml-1 h-4 w-4" />
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 slide-up">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => setMode('initial')} className="rounded-full hover:bg-white/10">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'bank' ? 'Banco de Questões' : 'Gerador IA'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'bank' ? 'Filtrar por matéria e tópico' : 'Configure sua questão personalizada'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="glass rounded-3xl p-6 space-y-4 transition-all duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="input-glass"><SelectValue placeholder="Selecione a Matéria" /></SelectTrigger>
            <SelectContent className="glass border-white/20">
              {subjects.map((s) => <SelectItem key={s} value={s} className="focus:bg-white/10">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={mode === 'bank' ? "Filtrar tópico (ex: Citologia)" : "Sobre o que você quer estudar?"}
            className="input-glass"
          />
        </div>

        {mode === 'bank' && (
          <div className="flex gap-4 pt-2">
            {/* Source Filter Placeholder - Functionality to be expanded */}
            <div className="flex bg-black/20 p-1 rounded-xl w-fit">
              {(['all', 'official', 'ai'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${source === s ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'
                    }`}
                >
                  {s === 'all' ? 'Todas' : s === 'official' ? 'Provas' : 'IA'}
                </button>
              ))}
            </div>
            <Button onClick={searchPool} disabled={loading} className="btn-primary flex-1 ml-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-2" />Buscar</>}
            </Button>
          </div>
        )}

        {mode === 'generator' && (
          <div className="flex gap-3 pt-2">
            <Button onClick={() => generateWithAI(false)} disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4 mr-2" />Gerar Normal</>}
            </Button>
            <Button onClick={() => generateWithAI(true)} disabled={loading} className="btn-streak flex-1 bg-gradient-to-r from-orange-500 to-red-600 border-none">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Flame className="h-4 w-4 mr-2" />Modo Hard</>}
            </Button>
          </div>
        )}
      </div>

      {/* Question Card */}
      {question && (
        <div className="glass rounded-3xl p-6 space-y-6 scale-in relative overflow-hidden min-h-[400px]">
          <Watermark />
          <div className="relative z-10 select-none">
            {fromPool && <span className="text-xs bg-secondary/30 text-secondary px-3 py-1 rounded-full mb-4 inline-block">Questão do Banco</span>}
            {!fromPool && <span className="text-xs bg-purple-500/30 text-purple-300 px-3 py-1 rounded-full mb-4 inline-block">Gerada por IA</span>}

            <p className="text-lg text-foreground leading-relaxed whitespace-pre-line">{question.question}</p>

            <div className="space-y-3 mt-6">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-300 group ${showResult
                    ? idx === question.correctAnswer
                      ? "bg-emerald-500/20 border border-emerald-500/50"
                      : idx === selectedAnswer
                        ? "bg-rose-500/20 border border-rose-500/50"
                        : "glass-subtle opacity-50"
                    : "glass glass-hover hover:border-primary/30"
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${showResult
                      ? idx === question.correctAnswer ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20 text-muted-foreground'
                      : 'border-white/20 group-hover:border-primary/50 group-hover:text-primary'
                      }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm md:text-base">{opt}</span>
                  </div>
                </button>
              ))}
            </div>

            {showResult && (
              <div className="space-y-4 fade-in mt-6 pt-6 border-t border-white/10">
                <div className={`flex items-center gap-2 text-lg ${selectedAnswer === question.correctAnswer ? "text-emerald-400" : "text-rose-400"}`}>
                  {selectedAnswer === question.correctAnswer ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                  <span className="font-bold">{selectedAnswer === question.correctAnswer ? "Resposta Correta!" : "Resposta Incorreta"}</span>
                </div>

                <div className="glass-subtle rounded-xl p-5 border-l-4 border-primary/50">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-bold flex items-center gap-2">
                    <Brain className="h-3 w-3" /> Explicação Detalhada
                  </p>
                  <p className="text-foreground leading-relaxed">{question.explanation}</p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleSave} className="btn-glass flex-1">
                    <BookmarkPlus className="h-4 w-4 mr-2" />Salvar na Biblioteca
                  </Button>
                  <Button onClick={() => mode === 'bank' ? searchPool() : generateWithAI(false)} className="btn-primary flex-1">
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
