import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ClarityApp from "@/components/clarity/ClarityApp";

// Clarity is one app in one shell — its own view state is the router, so there
// is no URL routing layer to keep in sync with it.
const App = () => (
  <TooltipProvider delayDuration={200}>
    <Sonner position="top-center" />
    <ClarityApp />
  </TooltipProvider>
);

export default App;
