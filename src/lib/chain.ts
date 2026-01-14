// src/lib/chain.ts
export const BASE_SEPOLIA = {
  chainId: 84532,
  name: "Base Sepolia",
  nativeCurrencySymbol: "ETH",
  explorerBaseUrl: "https://sepolia.basescan.org",
  // RPC public (Base) — override possible via env
  defaultRpcUrl: "https://sepolia.base.org",
} as const;

export const baseSepoliaChainId = BASE_SEPOLIA.chainId;

export function getClientRpcUrl() {
  return (
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || BASE_SEPOLIA.defaultRpcUrl
  );
}

export function getServerRpcUrl() {
  return (
    process.env.BASE_SEPOLIA_RPC_URL ||
    process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
    BASE_SEPOLIA.defaultRpcUrl
  );
}

export function txUrl(txHash: string) {
  return `${BASE_SEPOLIA.explorerBaseUrl}/tx/${txHash}`;
}

export function addressUrl(address: string) {
  return `${BASE_SEPOLIA.explorerBaseUrl}/address/${address}`;
}

export function tokenUrl(token: string) {
  return `${BASE_SEPOLIA.explorerBaseUrl}/token/${token}`;
}

