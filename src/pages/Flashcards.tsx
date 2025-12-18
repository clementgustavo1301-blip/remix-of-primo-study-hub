import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateFlashcards } from "@/services/aiService";
import { updateStreak } from "@/services/streakService";
import PremiumGuard from "@/components/PremiumGuard";
import { Brain, Plus, Sparkles, RotateCcw, Check, X, Clock, Loader2, Play, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string | null;
  next_review: string;
  interval: number;
}

const subjectsList = ["Matemática", "Física", "Química", "Biologia", "História", "Geografia", "Português", "Inglês", "Outros"];

const Flashcards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [studyingCards, setStudyingCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [view, setView] = useState<'decks' | 'study'>('decks');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Form States
  const [topic, setTopic] = useState("");
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newSubject, setNewSubject] = useState("Outros");
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  const fetchCards = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .order("next_review", { ascending: true });

    if (!error && data) {
      setCards(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  // Group cards by subject
  const decks = subjectsList.map(subj => {
    const subjectCards = cards.filter(c => (c.subject || "Outros") === subj);
    const dueCount = subjectCards.filter(c => new Date(c.next_review) <= new Date()).length;
    return { name: subj, total: subjectCards.length, due: dueCount };
  }).filter(d => d.total > 0);

  const startStudy = (subject: string) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Include all cards due till end of today

    const due = cards
      .filter(c => (c.subject || "Outros") === subject && new Date(c.next_review) <= today);

    if (due.length === 0) {
      toast.info("Nenhum card para revisar nesta matéria hoje! 🎉");
      return;
    }

    setStudyingCards(due);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedSubject(subject);
    setView('study');
  };

  const handleCreateCard = async () => {
    if (!newFront.trim() || !newBack.trim()) {
      toast.error("Preencha ambos os lados do card");
      return;
    }

    const { error } = await supabase.from("flashcards").insert({
      user_id: user!.id,
      front: newFront,
      back: newBack,
      subject: newSubject,
      interval: 1,
      next_review: new Date().toISOString().split('T')[0]
    });

    if (error) {
      toast.error("Erro ao criar flashcard");
      return;
    }

    toast.success("Flashcard criado!");
    setNewFront("");
    setNewBack("");
    setCreateOpen(false);
    fetchCards();
  };

  const handleGenerateCards = async () => {
    if (!topic.trim()) {
      toast.error("Digite um tema");
      return;
    }

    setGenerating(true);

    try {
      const result = await generateFlashcards(topic, 5);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        // Use selected subject or infer from topic if logical (here we rely on usage)
        const cardsToInsert = result.data.map(card => ({
          user_id: user!.id,
          front: card.front,
          back: card.back,
          subject: newSubject, // User selected subject in modal
          interval: 1,
          next_review: new Date().toISOString().split('T')[0]
        }));

        const { error } = await supabase.from("flashcards").insert(cardsToInsert);

        if (error) {
          toast.error("Erro ao salvar flashcards");
          return;
        }

        toast.success(`${result.data.length} flashcards criados!`);
        setTopic("");
        setGenerateOpen(false);
        fetchCards();
      }
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error("Erro ao gerar flashcards");
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = async (quality: 'easy' | 'medium' | 'hard') => {
    const card = studyingCards[currentIndex];
    if (!card) return;

    let newInterval = card.interval;
    const today = new Date();

    // SRS Logic
    switch (quality) {
      case 'easy':
        newInterval = 4; // Easy -> 4 days
        break;
      case 'medium': // Treat as 'Hard' in previous code or new medium logic
        newInterval = 2; // Medium -> 2 days
        break;
      case 'hard': // Treat as Wrong/Hard
        newInterval = 1; // Hard/Wrong -> 1 day
        break;
    }

    // Check for Deletion (Disposable Logic)
    if (newInterval > 7) {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", card.id);

      if (!error) {
        toast.success("Card dominado! Removido do baralho. 🎓");
      }
    } else {
      // Normal Update
      const nextReview = new Date(today);
      nextReview.setDate(nextReview.getDate() + newInterval);

      await supabase
        .from("flashcards")
        .update({
          interval: newInterval,
          next_review: nextReview.toISOString().split('T')[0],
        })
        .eq("id", card.id);
    }

    setIsFlipped(false);

    if (currentIndex < studyingCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast.success("Revisão concluída para esta matéria! 🚀");
      // Update Streak
      if (user) {
        await updateStreak(user.id);
        window.dispatchEvent(new Event("profile_updated"));
      }
      setView('decks');
      fetchCards();
    }
  };

  const currentCard = studyingCards[currentIndex];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PremiumGuard featureName="Flashcards Ilimitados">
      <div className="space-y-6 slide-up">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <Brain className="h-7 w-7 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
              <p className="text-muted-foreground">{view === 'decks' ? "Seus Baralhos de Estudo" : `Estudando: ${selectedSubject}`}</p>
            </div>
          </div>

          {view === 'decks' && (
            <div className="flex gap-3">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="glass glass-hover">
                    <Plus className="h-5 w-5 mr-2" />
                    Criar Manual
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-white/20">
                  <DialogHeader>
                    <DialogTitle>Novo Flashcard</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Matéria</label>
                      <Select value={newSubject} onValueChange={setNewSubject}>
                        <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                        <SelectContent className="glass">
                          {subjectsList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="Frente (Pergunta)" className="input-glass" />
                    <Input value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="Verso (Resposta)" className="input-glass" />
                    <Button onClick={handleCreateCard} className="w-full btn-primary">Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Gerar com IA
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-strong border-white/20">
                  <DialogHeader>
                    <DialogTitle>Gerar com IA</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Matéria</label>
                      <Select value={newSubject} onValueChange={setNewSubject}>
                        <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                        <SelectContent className="glass">
                          {subjectsList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: Termodinâmica, 2ª Guerra Mundial" className="input-glass" />
                    <Button onClick={handleGenerateCards} disabled={generating} className="w-full btn-primary">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                      Gerar Cards
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {view === 'decks' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {decks.length === 0 ? (
              <div className="col-span-3 glass rounded-3xl p-12 text-center">
                <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">Nenhum baralho criado</h3>
                <p className="text-muted-foreground mb-6">Comece criando manualmente ou use a IA para gerar cards instantaneamente.</p>
                <Button onClick={() => setGenerateOpen(true)} className="btn-primary"><Sparkles className="h-4 w-4 mr-2" />Gerar Agora</Button>
              </div>
            ) : (
              decks.map(deck => (
                <div key={deck.name} className="glass rounded-2xl p-6 flex flex-col justify-between hover:scale-[1.02] transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-primary/20 rounded-xl">
                        <Layers className="h-6 w-6 text-primary" />
                      </div>
                      {deck.due > 0 && (
                        <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                          {deck.due} para revisar
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-1">{deck.name}</h3>
                    <p className="text-muted-foreground text-sm">{deck.total} cards no total</p>
                  </div>
                  <Button
                    onClick={() => startStudy(deck.name)}
                    className="w-full mt-6 btn-glass group-hover:bg-primary/20"
                    disabled={deck.due === 0}
                  >
                    {deck.due > 0 ? (
                      <><Play className="h-4 w-4 mr-2" /> Começar Revisão</>
                    ) : (
                      <><Check className="h-4 w-4 mr-2" /> Tudo em dia!</>
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Study Mode */
          <div className="flex flex-col items-center max-w-2xl mx-auto">
            <div className="w-full flex justify-between items-center mb-6">
              <span className="text-muted-foreground">Card {currentIndex + 1} de {studyingCards.length}</span>
              <Button variant="ghost" size="sm" onClick={() => setView('decks')}><X className="h-4 w-4 mr-2" />Sair</Button>
            </div>

            <div
              className="relative w-full h-80 perspective-1000 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={cn(
                  "w-full h-full transition-transform duration-500 transform-style-3d",
                  isFlipped ? "rotate-y-180" : ""
                )}
                style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
              >
                {/* Front */}
                <div className="absolute inset-0 glass rounded-3xl p-8 flex flex-col items-center justify-center text-center backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Pergunta</span>
                  <p className="text-xl font-medium">{currentCard?.front}</p>
                  <span className="absolute bottom-6 text-xs text-muted-foreground opacity-50">Clique para ver a resposta</span>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 glass-strong border-primary/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center backface-hidden"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className="text-xs uppercase tracking-widest text-primary mb-4">Resposta</span>
                  <p className="text-xl font-medium">{currentCard?.back}</p>
                </div>
              </div>
            </div>

            {isFlipped && (
              <div className="grid grid-cols-3 gap-4 w-full mt-8 animate-in slide-in-from-bottom-4">
                <Button
                  onClick={() => handleAnswer('hard')}
                  className="h-14 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30 gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Difícil (1d)
                </Button>
                <Button
                  onClick={() => handleAnswer('medium')}
                  className="h-14 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30 gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Médio (2d)
                </Button>
                <Button
                  onClick={() => handleAnswer('easy')}
                  className="h-14 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30 gap-2"
                >
                  <Check className="h-4 w-4" />
                  Fácil (4d)
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </PremiumGuard>
  );
};

export default Flashcards;
