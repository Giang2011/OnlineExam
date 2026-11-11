import { useState, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/lib/ui/tooltip';
import { Toaster } from '@/lib/ui/sonner';
import { createQueryClient } from '@/app/providers/query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
