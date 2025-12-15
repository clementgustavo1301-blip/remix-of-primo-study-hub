import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { answerQuestion, ChatMessage } from "@/services/aiService";
import { MessageSquare, Send, Loader2, BookmarkPlus, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await answerQuestion(input, undefined, messages);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.data) {
        const assistantMessage: ChatMessage = { role: 'assistant', content: result.data };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error in chat:", error);
      toast.error("Erro ao processar mensagem");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const saveAsFlashcard = async (content: string) => {
    if (!user) return;

    // Extract first sentence as front, rest as back
    const sentences = content.split(/[.!?]/);
    const front = sentences[0]?.trim() || "Resumo";
    const back = content.slice(front.length + 1).trim() || content;

    const { error } = await supabase.from("flashcards").insert({
      user_id: user.id,
      front: front.slice(0, 200),
      back: back.slice(0, 500),
    });

    if (error) {
      toast.error("Erro ao criar flashcard");
      return;
    }

    toast.success("Flashcard criado!");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
          <MessageSquare className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nexus Chat</h1>
          <p className="text-muted-foreground">Seu tutor de estudos inteligente</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 glass rounded-3xl p-6 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Bot className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Olá! Sou seu tutor Nexus
            </h3>
            <p className="text-muted-foreground max-w-md">
              Faça perguntas sobre qualquer matéria, cole textos de apostilas para explicação,
              ou peça ajuda com exercícios. Estou aqui para te ajudar!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  msg.role === 'user' ? "bg-secondary/30" : "bg-primary/30"
                )}>
                  {msg.role === 'user' ? (
                    <User className="h-5 w-5 text-secondary" />
                  ) : (
                    <Bot className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[75%] p-4 rounded-2xl",
                  msg.role === 'user' 
                    ? "bg-secondary/20 border border-secondary/30" 
                    : "bg-white/5 border border-white/10"
                )}>
                {msg.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none select-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-foreground">{msg.content}</p>
                  )}
                  
                  {msg.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => saveAsFlashcard(msg.content)}
                    >
                      <BookmarkPlus className="h-4 w-4 mr-1" />
                      Salvar como Flashcard
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/30 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Pensando...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="glass rounded-2xl p-4 flex gap-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua pergunta ou cole um texto para estudo..."
          className="input-glass min-h-[60px] max-h-[120px] resize-none flex-1"
          disabled={loading}
        />
        <Button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="btn-primary self-end"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default Chat;
