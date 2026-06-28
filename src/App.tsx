import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/auth/AuthProvider";
import { RequireAuth } from "@/auth/RequireAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Barbers from "@/pages/Barbers";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route element={<RequireAuth />}>
                <Route path="/barbers" element={<Barbers />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
