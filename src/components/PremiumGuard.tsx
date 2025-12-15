import { ReactNode } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Crown, Sparkles, Brain, Calendar, FileText, Zap } from "lucide-react";
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
  const isPro = profile?.is_pro === true;

  const handleUpgrade = async () => {
    // Simulating upgrade - in production, this would integrate with Stripe
    await updateProfile({ is_pro: true });
    toast.success("Parabéns! Você agora é Nexus Pro! 🎉");
  };

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <Dialog open={true}>
      <DialogContent className="glass-strong border-white/20 sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Desbloqueie o Nexus Pro
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Acesse {featureName} e muito mais com o plano Pro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-6">
          {benefits.map((benefit, i) => (
            <div 
              key={i} 
              className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <benefit.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{benefit.label}</p>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-2xl"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Assinar Nexus Pro - R$29/mês
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Cancele quando quiser. Sem compromisso.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumGuard;
