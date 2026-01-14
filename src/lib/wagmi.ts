// src/lib/wagmi.ts
"use client";

import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { getClientRpcUrl } from "@/lib/chain";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(getClientRpcUrl()),
  },
  ssr: true,
});
