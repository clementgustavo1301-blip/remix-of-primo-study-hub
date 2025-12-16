import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateFlashcards } from "@/services/aiService";
import PremiumGuard from "@/components/PremiumGuard";
import { Brain, Plus, Sparkles, RotateCcw, Check, X, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  next_review: string;
  interval: number;
}

const Flashcards = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  const fetchCards = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", user.id)
      .lte("next_review", today)
      .order("next_review", { ascending: true });

    if (!error && data) {
      setCards(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  const handleCreateCard = async () => {
    if (!newFront.trim() || !newBack.trim()) {
      toast.error("Preencha ambos os lados do card");
      return;
    }

    const { error } = await supabase.from("flashcards").insert({
      user_id: user!.id,
      front: newFront,
      back: newBack,
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
        const cardsToInsert = result.data.map(card => ({
          user_id: user!.id,
          front: card.front,
          back: card.back,
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

  const handleAnswer = async (quality: 'easy' | 'hard' | 'wrong') => {
    const card = cards[currentIndex];
    if (!card) return;

    let newInterval = card.interval;
    const today = new Date();

    switch (quality) {
      case 'easy':
        newInterval = Math.round(card.interval * 2.5);
        break;
      case 'hard':
        newInterval = Math.round(card.interval * 1.2);
        break;
      case 'wrong':
        newInterval = 1;
        break;
    }

    const nextReview = new Date(today);
    nextReview.setDate(nextReview.getDate() + newInterval);

    await supabase
      .from("flashcards")
      .update({
        interval: newInterval,
        next_review: nextReview.toISOString().split('T')[0],
      })
      .eq("id", card.id);

    setIsFlipped(false);
    
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast.success("Parabéns! Você revisou todos os cards de hoje!");
      fetchCards();
      setCurrentIndex(0);
    }
  };

  const currentCard = cards[currentIndex];

  return (
    <PremiumGuard featureName="Flashcards Ilimitados">
      <div className="space-y-4 md:space-y-6 slide-up px-2 md:px-0">
        {/* Header - Responsive */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
              <Brain className="h-6 w-6 md:h-7 md:w-7 text-secondary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Smart Flashcards</h1>
              <p className="text-sm md:text-base text-muted-foreground">Memorização com repetição espaçada</p>
            </div>
          </div>

          <div className="flex gap-2 md:gap-3">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="glass glass-hover rounded-xl flex-1 md:flex-none text-sm md:text-base py-2 px-3 md:px-4">
                  <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Criar </span>Manual
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong border-white/20 mx-4 max-w-[calc(100vw-2rem)] md:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Novo Flashcard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Frente</label>
                    <Input
                      value={newFront}
                      onChange={(e) => setNewFront(e.target.value)}
                      placeholder="Pergunta ou conceito"
                      className="input-glass"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Verso</label>
                    <Input
                      value={newBack}
                      onChange={(e) => setNewBack(e.target.value)}
                      placeholder="Resposta ou explicação"
                      className="input-glass"
                    />
                  </div>
                  <Button onClick={handleCreateCard} className="w-full btn-primary">
                    <Plus className="h-5 w-5 mr-2" />
                    Criar Card
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary flex-1 md:flex-none text-sm md:text-base py-2 px-3 md:px-4">
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Gerar com </span>IA
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong border-white/20 mx-4 max-w-[calc(100vw-2rem)] md:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Gerar Flashcards com IA</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Tema</label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ex: Revolução Francesa, Mitose..."
                      className="input-glass"
                    />
                  </div>
                  <Button 
                    onClick={handleGenerateCards} 
                    disabled={generating}
                    className="w-full btn-primary"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Gerar 5 Flashcards
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Study Area */}
        <div className="flex flex-col items-center">
          {loading ? (
            <div className="glass rounded-2xl md:rounded-3xl p-8 md:p-12 text-center">
              <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-primary mx-auto" />
            </div>
          ) : cards.length === 0 ? (
            <div className="glass rounded-2xl md:rounded-3xl p-8 md:p-12 text-center max-w-md w-full">
              <Brain className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-base md:text-lg font-medium text-foreground mb-2">
                Nenhum card para revisar
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Crie novos flashcards ou aguarde os próximos para revisar
              </p>
            </div>
          ) : currentCard ? (
            <>
              <div className="mb-3 md:mb-4 text-sm md:text-base text-muted-foreground">
                Card {currentIndex + 1} de {cards.length}
              </div>

              {/* Flashcard */}
              <div 
                className={cn(
                  "relative w-full max-w-lg h-56 md:h-80 cursor-pointer perspective-1000",
                  "transition-transform duration-500"
                )}
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ perspective: '1000px' }}
              >
                <div 
                  className={cn(
                    "absolute inset-0 transition-transform duration-500",
                    "preserve-3d"
                  )}
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                {/* Front */}
                  <div 
                    className="absolute inset-0 glass rounded-2xl md:rounded-3xl p-6 md:p-8 flex items-center justify-center text-center backface-hidden select-none"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground mb-3 md:mb-4 block">
                        Clique para virar
                      </span>
                      <p className="text-lg md:text-xl font-medium text-foreground">{currentCard.front}</p>
                    </div>
                  </div>

                  {/* Back */}
                  <div 
                    className="absolute inset-0 glass-strong rounded-2xl md:rounded-3xl p-6 md:p-8 flex items-center justify-center text-center backface-hidden select-none"
                    style={{ 
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div>
                      <span className="text-xs uppercase tracking-wider text-primary mb-3 md:mb-4 block">
                        Resposta
                      </span>
                      <p className="text-lg md:text-xl font-medium text-foreground">{currentCard.back}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer Buttons - Responsive */}
              {isFlipped && (
                <div className="flex flex-wrap justify-center gap-2 md:gap-4 mt-6 md:mt-8 slide-up w-full max-w-lg">
                  <Button
                    onClick={() => handleAnswer('wrong')}
                    className="bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30 rounded-xl px-4 md:px-6 py-2 text-sm md:text-base flex-1 min-w-[90px] md:flex-none"
                  >
                    <X className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                    Errei
                  </Button>
                  <Button
                    onClick={() => handleAnswer('hard')}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-xl px-4 md:px-6 py-2 text-sm md:text-base flex-1 min-w-[90px] md:flex-none"
                  >
                    <Clock className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                    Difícil
                  </Button>
                  <Button
                    onClick={() => handleAnswer('easy')}
                    className="bg-success/20 hover:bg-success/30 text-success border border-success/30 rounded-xl px-4 md:px-6 py-2 text-sm md:text-base flex-1 min-w-[90px] md:flex-none"
                  >
                    <Check className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                    Fácil
                  </Button>
                </div>
              )}

              <Button 
                variant="ghost" 
                className="mt-3 md:mt-4 text-muted-foreground text-sm md:text-base"
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex((currentIndex + 1) % cards.length);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Pular
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </PremiumGuard>
  );
};

export default Flashcards;
