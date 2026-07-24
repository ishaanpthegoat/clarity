import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { initStore } from "@/lib/store";
import ClarityApp from "@/components/clarity/ClarityApp";
import OnboardingStory from "./pages/OnboardingStory";
import UnlockFlow from "./pages/UnlockFlow";
import SettingsPage from "./pages/SettingsPage";
import Paywall from "./pages/Paywall";
import HistoryPage from "./pages/HistoryPage";
import ExplorePage from "./pages/ExplorePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Restore legacy MindLock state in the background (Clarity has its own store).
    // Never block first paint on it — errors here must not blank the app.
    initStore().catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <div className="bg-background min-h-[100dvh] flex justify-center">
              <Routes>
                <Route path="/" element={<ClarityApp />} />
                <Route path="/onboarding" element={<OnboardingStory />} />
                <Route path="/unlock" element={<UnlockFlow />} />
                <Route path="/home" element={<ClarityApp />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/paywall" element={<Paywall />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;

