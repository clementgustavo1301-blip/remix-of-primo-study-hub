import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Brain, 
  Calendar, 
  FileText, 
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  MessageSquare,
  BookOpen,
  Menu,
  X,
  Headphones,
  Heart,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen gradient-bg-animated overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Nexus Study</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection("features")} className="text-muted-foreground hover:text-foreground transition-colors">
                Funcionalidades
              </button>
              <button onClick={() => scrollToSection("testimonials")} className="text-muted-foreground hover:text-foreground transition-colors">
                Depoimentos
              </button>
              <button onClick={() => scrollToSection("pricing")} className="text-muted-foreground hover:text-foreground transition-colors">
                Preço
              </button>
            </div>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Já tenho conta
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-xl">
                  Começar Grátis
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden glass border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection("features")} className="block w-full text-left py-2 text-muted-foreground hover:text-foreground">
                Funcionalidades
              </button>
              <button onClick={() => scrollToSection("testimonials")} className="block w-full text-left py-2 text-muted-foreground hover:text-foreground">
                Depoimentos
              </button>
              <button onClick={() => scrollToSection("pricing")} className="block w-full text-left py-2 text-muted-foreground hover:text-foreground">
                Preço
              </button>
              <div className="pt-3 border-t border-white/10 space-y-2">
                <Link to="/auth" className="block">
                  <Button variant="ghost" className="w-full justify-center">Já tenho conta</Button>
                </Link>
                <Link to="/auth" className="block">
                  <Button className="w-full bg-gradient-to-r from-primary to-secondary">Começar Grátis</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">Potencializado por IA</span>
            </motion.div>

            <motion.h1 
              variants={fadeUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            >
              Sua Aprovação no ENEM
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                Acelerada por IA
              </span>
              {" "}🚀
            </motion.h1>

            <motion.p 
              variants={fadeUp}
              className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Tenha um tutor pessoal 24h. Correção de redação instantânea, 
              cronogramas adaptativos e flashcards infinitos.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button className="relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-2xl px-8 py-6 text-lg font-semibold group">
                  <span className="relative z-10 flex items-center gap-2">
                    Testar Nexus Grátis
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
              </Link>
              <button 
                onClick={() => scrollToSection("features")}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
              >
                Ver funcionalidades
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>

          {/* Hero Visual - Dashboard Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-16 max-w-5xl mx-auto perspective-1000"
          >
            <div className="glass rounded-3xl p-2 shadow-2xl shadow-primary/10 transform hover:scale-[1.02] transition-transform duration-500">
              <div className="bg-background/80 rounded-2xl p-6 space-y-4">
                {/* Mock Dashboard Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Bem-vindo de volta!</p>
                      <p className="text-sm text-muted-foreground">Continue sua jornada</p>
                    </div>
                  </div>
                  <div className="streak-badge">
                    <Zap className="h-4 w-4" />
                    <span>7 dias</span>
                  </div>
                </div>
                {/* Mock Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-primary">847</p>
                    <p className="text-xs text-muted-foreground">XP Total</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-secondary">12</p>
                    <p className="text-xs text-muted-foreground">Redações</p>
                  </div>
                  <div className="glass rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-accent">85%</p>
                    <p className="text-xs text-muted-foreground">Acertos</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para
              <span className="text-primary"> passar</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-muted-foreground max-w-2xl mx-auto">
              Ferramentas de IA que transformam sua rotina de estudos
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {/* Large Card - Essay */}
            <motion.div 
              variants={fadeUp}
              className="lg:col-span-2 glass rounded-3xl p-8 hover:bg-white/[0.12] transition-all group"
            >
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    Correção de Redação com IA
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Correção nível ENEM em 3 segundos. Feedback detalhado nas 5 competências. 
                    Esqueça os cursinhos caros.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span>Nota de 0 a 1000 + dicas personalizadas</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Medium Card - Planner */}
            <motion.div 
              variants={fadeUp}
              className="glass rounded-3xl p-8 hover:bg-white/[0.12] transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4">
                <Calendar className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                Cronograma Inteligente
              </h3>
              <p className="text-muted-foreground text-sm">
                A IA monta sua rotina baseada nas suas dificuldades e disponibilidade.
              </p>
            </motion.div>

            {/* Small Card - Flashcards */}
            <motion.div 
              variants={fadeUp}
              className="glass rounded-3xl p-6 hover:bg-white/[0.12] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                    Flashcards Inteligentes
                  </h3>
                  <p className="text-sm text-muted-foreground">Revisão espaçada automática</p>
                </div>
              </div>
            </motion.div>

            {/* Small Card - Questions */}
            <motion.div 
              variants={fadeUp}
              className="glass rounded-3xl p-6 hover:bg-white/[0.12] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                    Banco de Questões
                  </h3>
                  <p className="text-sm text-muted-foreground">+500 questões + gerador IA</p>
                </div>
              </div>
            </motion.div>

            {/* Small Card - Chat */}
            <motion.div 
              variants={fadeUp}
              className="glass rounded-3xl p-6 hover:bg-white/[0.12] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                    Chat com IA
                  </h3>
                  <p className="text-sm text-muted-foreground">Tire dúvidas 24h</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Humanized Support Section - NEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="glass-strong rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-primary/20">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
              >
                <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-full px-4 py-2 mb-6">
                  <Heart className="h-4 w-4 text-pink-500" />
                  <span className="text-sm text-pink-500 font-medium">Cuidado Real</span>
                </motion.div>
                
                <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                  Suporte Humanizado
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500">
                    Disponível 24h
                  </span>
                </motion.h2>

                <motion.p variants={fadeUp} className="text-lg text-muted-foreground mb-8">
                  Sabemos que a IA é incrível, mas às vezes você precisa de um toque humano. 
                  Nossa equipe de monitores especialistas está pronta para te acolher e tirar 
                  suas dúvidas a qualquer hora do dia ou da noite.
                </motion.p>

                <motion.div variants={fadeUp} className="space-y-4">
                  {[
                    { icon: Headphones, text: "Atendimento em tempo real via chat" },
                    { icon: Users, text: "Monitores especialistas em cada matéria" },
                    { icon: Heart, text: "Acolhimento emocional e pedagógico" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center">
                        <item.icon className="h-5 w-5 text-pink-500" />
                      </div>
                      <span className="text-foreground font-medium">{item.text}</span>
                    </div>
                  ))}
                </motion.div>

                <motion.div variants={fadeUp} className="mt-8">
                  <Link to="/auth">
                    <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 text-white rounded-xl px-8 py-6 text-lg font-semibold shadow-lg shadow-pink-500/20">
                      Falar com um Monitor
                    </Button>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                 {/* Decorative elements representing connection */}
                 <div className="relative z-10 grid grid-cols-2 gap-4">
                    <div className="space-y-4 mt-8">
                      <div className="glass p-4 rounded-2xl animate-float">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                             <Users className="h-4 w-4 text-green-500" />
                           </div>
                           <span className="text-xs font-semibold">Monitor João</span>
                        </div>
                        <p className="text-xs text-muted-foreground">"Claro! Vamos resolver essa questão de Logaritmo juntos."</p>
                      </div>
                      <div className="glass p-4 rounded-2xl animate-float" style={{ animationDelay: "1.5s" }}>
                         <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                             <Users className="h-4 w-4 text-blue-500" />
                           </div>
                           <span className="text-xs font-semibold">Monitora Ana</span>
                        </div>
                        <p className="text-xs text-muted-foreground">"Não desanima! Faltam só 2 semanas."</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                       <div className="glass p-4 rounded-2xl animate-float" style={{ animationDelay: "0.5s" }}>
                         <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                             <Users className="h-4 w-4 text-purple-500" />
                           </div>
                           <span className="text-xs font-semibold">Monitor Pedro</span>
                        </div>
                        <p className="text-xs text-muted-foreground">"Sua redação evoluiu muito! Parabéns!"</p>
                      </div>
                       <div className="glass p-4 rounded-2xl animate-float" style={{ animationDelay: "2s" }}>
                         <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                             <Users className="h-4 w-4 text-orange-500" />
                           </div>
                           <span className="text-xs font-semibold">Suporte Téc.</span>
                        </div>
                        <p className="text-xs text-muted-foreground">"Resolvido! Pode acessar normalmente."</p>
                      </div>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Quem usa, <span className="text-primary">aprova</span>
            </motion.h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                name: "Maria Clara",
                course: "Aprovada em Medicina - UNICAMP",
                quote: "O corretor de redação me ajudou a sair de 600 para 920 pontos!"
              },
              {
                name: "João Pedro",
                course: "Aprovado em Direito - USP",
                quote: "O cronograma inteligente organizou meus estudos de um jeito que eu nunca consegui sozinho."
              },
              {
                name: "Ana Beatriz",
                course: "Aprovada em Engenharia - ITA",
                quote: "Os flashcards com repetição espaçada foram essenciais para memorizar fórmulas."
              }
            ].map((testimonial, i) => (
              <motion.div 
                key={i}
                variants={fadeUp}
                className="glass rounded-3xl p-6 hover:bg-white/[0.12] transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-primary">{testimonial.course}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Investimento de um lanche,
              <br />
              <span className="text-primary">resultado de um cursinho</span>
            </motion.h2>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass-strong rounded-3xl p-8 sm:p-10 max-w-lg mx-auto relative overflow-hidden"
          >
            {/* Popular Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-4 py-2 rounded-bl-2xl">
              MAIS POPULAR
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">Nexus Pro Semestral</h3>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-muted-foreground line-through text-xl">R$ 97,00</span>
                <span className="bg-destructive/20 text-destructive text-xs font-bold px-2 py-1 rounded-full">-71%</span>
              </div>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl sm:text-6xl font-bold text-foreground">R$ 27,90</span>
                <span className="text-muted-foreground">/semestre</span>
              </div>
              <p className="text-primary font-medium mt-2">Equivalente a apenas R$ 4,65/mês</p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                "Redações Ilimitadas com correção IA",
                "Cronograma IA Personalizado",
                "Flashcards Ilimitados",
                "Chat com IA 24h",
                "Banco de Questões Completo",
                "Renovação Automática (Cancele quando quiser)"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <Link to="/auth" className="block">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-6 rounded-2xl text-lg group relative overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Quero meu Acesso Agora
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </Button>
            </Link>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Garantia de 7 dias ou seu dinheiro de volta
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass rounded-3xl p-8 sm:p-12 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Pronto para acelerar seus estudos?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Junte-se a milhares de estudantes que já estão usando IA para estudar de forma mais inteligente.
          </p>
          <Link to="/auth">
            <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white rounded-2xl px-8 py-6 text-lg font-semibold">
              Começar Agora - É Grátis
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-foreground">Nexus Study</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Nexus Study. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Termos
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Privacidade
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
