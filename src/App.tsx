import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const NeonSnake = lazy(() => import("./games/NeonSnake"));
const ColorMatch = lazy(() => import("./games/ColorMatch"));
const MemoryCards = lazy(() => import("./games/MemoryCards"));
const CrashGame = lazy(() => import("./games/CrashGame"));
const CaseOpener = lazy(() => import("./games/CaseOpener"));
const TurboTrader = lazy(() => import("./games/TurboTrader"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-2xl font-mono text-primary animate-pulse-neon">Loading...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/snake" element={<NeonSnake />} />
            <Route path="/colormatch" element={<ColorMatch />} />
            <Route path="/memory" element={<MemoryCards />} />
            <Route path="/crash" element={<CrashGame />} />
            <Route path="/cases" element={<CaseOpener />} />
            <Route path="/trader" element={<TurboTrader />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
