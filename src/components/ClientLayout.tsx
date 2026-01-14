// src/components/ClientLayout.tsx
"use client";

import { ThemeProvider } from "@/components/ThemeProvider";
import { WagmiProvider } from "@/components/WagmiProvider";
import { Header } from "@/components/Header";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <WagmiProvider>
        <Header />
        {children}
      </WagmiProvider>
    </ThemeProvider>
  );
}
