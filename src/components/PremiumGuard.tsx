import { ReactNode, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Crown, Sparkles, Brain, Calendar, FileText, Zap, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PremiumGuardProps {
  children: ReactNode;
  featureName?: string;
}

const benefits = [
  { icon: FileText, label: "Correção de Redação com IA", description: "Avaliação nas 5 competências do ENEM" },
  { icon: Brain, label: "Flashcards Ilimitados", description: "Geração automática com IA" },
  { icon: Calendar, label: "Cronograma Inteligente", description: "IA cria sua rotina de estudos" },
  { icon: Zap, label: "Prioridade no Servidor", description: "Respostas mais rápidas" },
];

const PremiumGuard = ({ children, featureName = "esta funcionalidade" }: PremiumGuardProps) => {
  const { profile, updateProfile } = useProfile();
  const [showModal, setShowModal] = useState(false);
  const isPro = true; // profile?.is_pro === true; // BYPASS FOR TESTING

  const handleUpgrade = async () => {
    // Simulating upgrade - in production, this would integrate with Stripe
    await updateProfile({ is_pro: true });
    toast.success("Parabéns! Você agora é Nexus Pro! 🎉");
    setShowModal(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isPro) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    }
  };

  // If user is pro, render children normally
  if (isPro) {
    return <>{children}</>;
  }

  // If not pro, wrap children with click interceptor
  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        {children}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-strong border-white/20 sm:max-w-lg">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-foreground">
              Desbloqueie o Nexus Pro
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Acesse {featureName} e muito mais com o Plano Semestral
            </DialogDescription>
          </DialogHeader>

          {/* Price Highlight */}
          <div className="text-center py-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground line-through text-lg">R$ 97,00</span>
              <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full">-71%</span>
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold text-foreground">R$ 27,90</span>
              <span className="text-muted-foreground">/semestre</span>
            </div>
            <p className="text-sm text-primary font-medium">
              Equivalente a apenas R$ 4,65/mês
            </p>
          </div>

          <div className="space-y-3 my-4">
            {benefits.map((benefit, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5"
              >
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">{benefit.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-2xl text-lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Garantir 6 Meses de Acesso
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Cancele quando quiser. Sem compromisso.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PremiumGuard;
