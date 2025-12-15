import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import QuestionLab from "./pages/QuestionLab";
import Planner from "./pages/Planner";
import Essay from "./pages/Essay";
import Flashcards from "./pages/Flashcards";
import Chat from "./pages/Chat";
import FocusRoom from "./pages/FocusRoom";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Allow context menu on inputs and textareas
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }
    e.preventDefault();
    import("sonner").then(({ toast }) => {
      toast.info("O conteúdo do Nexus é protegido ©");
    });
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="lab" element={<QuestionLab />} />
              <Route path="planner" element={<Planner />} />
              <Route path="essay" element={<Essay />} />
              <Route path="flashcards" element={<Flashcards />} />
              <Route path="chat" element={<Chat />} />
              <Route path="focus" element={<FocusRoom />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </div>
  );
};

export default App;
