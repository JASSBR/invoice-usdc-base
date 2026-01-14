// src/components/PayInvoiceButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useChainId } from "wagmi";
import { type Invoice } from "@/lib/invoices";
import { updateInvoiceStatus } from "@/lib/invoices";
import { erc20Abi, getUsdcAddress } from "@/lib/usdc";
import { txUrl, baseSepoliaChainId } from "@/lib/chain";

interface PayInvoiceButtonProps {
  invoice: Invoice;
  onPaymentVerified?: (txHash: string) => void;
}

interface VerificationResult {
  verified: boolean;
  txHash: string;
  blockNumber: string;
  recipient: string;
  amount: string;
  amountFormatted: string;
  message: string;
}

export function PayInvoiceButton({ invoice, onPaymentVerified }: PayInvoiceButtonProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const isWrongNetwork = isConnected && chainId !== baseSepoliaChainId;

  const { 
    data: hash, 
    isPending: isWritePending, 
    writeContract,
    error: writeError 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Dès que la transaction est confirmée, on lance la vérification serveur
  const handleVerification = async (txHash: string) => {
    setIsVerifying(true);
    setVerificationError(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash,
          expectedAmount: invoice.amountUsdc.toString(),
          expectedRecipient: invoice.vendorAddress,
          invoiceId: invoice.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setVerificationResult(data);
      onPaymentVerified?.(txHash);
      
      // Mettre à jour automatiquement le statut de l'invoice
      updateInvoiceStatus(invoice.id, "PAID");
    } catch (error) {
      setVerificationError(
        error instanceof Error ? error.message : "Verification failed"
      );
    } finally {
      setIsVerifying(false);
    }
  };

  // Surveiller l'état de confirmation
  useEffect(() => {
    if (isConfirmed && hash && !isVerifying && !verificationResult && !verificationError) {
      handleVerification(hash);
    }
  }, [isConfirmed, hash, isVerifying, verificationResult, verificationError]);

  const handlePayment = () => {
    if (!isConnected || isWrongNetwork) return;

    writeContract({
      address: getUsdcAddress(),
      abi: erc20Abi,
      functionName: "transfer",
      args: [invoice.vendorAddress, invoice.amountUsdc],
    });
  };

  // État: Mauvais réseau
  if (isWrongNetwork) {
    return (
      <div className="space-y-4 p-6 glass rounded-xl border border-orange-500/30">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <p className="text-white font-semibold">Wrong Network</p>
            <p className="text-sm text-orange-200/70">
              You are on chain ID {chainId}. Please switch to Base Sepolia (84532)
            </p>
          </div>
        </div>
        <button
          onClick={() => switchChain({ chainId: baseSepoliaChainId })}
          className="w-full group relative px-6 py-4 rounded-xl font-semibold overflow-hidden transition-all hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative text-white flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Switch to Base Sepolia
          </span>
        </button>
      </div>
    );
  }

  // État: Non connecté
  if (!isConnected) {
    return (
      <div className="space-y-4 p-6 glass rounded-xl border border-yellow-500/20">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔌</span>
          <div>
            <p className="text-white font-semibold">Wallet Not Connected</p>
            <p className="text-sm text-blue-200/70">Connect your wallet to pay this invoice</p>
          </div>
        </div>
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect({ connector })}
            className="w-full group relative px-6 py-4 rounded-xl font-semibold overflow-hidden transition-all hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative text-white flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1M15 12H3m0 0l3-3m-3 3l3 3" />
              </svg>
              Connect Wallet
            </span>
          </button>
        ))}
      </div>
    );
  }

  // État: Transaction envoyée (pending)
  if (isWritePending) {
    return (
      <div className="space-y-3 p-6 glass rounded-xl border border-blue-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse">
            <span className="text-2xl">⏳</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">Sending Transaction...</p>
            <p className="text-sm text-blue-200/70">Please confirm in your wallet</p>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
        </div>
      </div>
    );
  }

  // État: Transaction confirmée (waiting for receipt)
  if (isConfirming) {
    return (
      <div className="space-y-4 p-6 glass rounded-xl border border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center animate-pulse">
            <span className="text-2xl">⏳</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">Transaction Sent!</p>
            <p className="text-sm text-yellow-200/80">Waiting for onchain confirmation...</p>
          </div>
        </div>
        {hash && (
          <div className="p-4 bg-black/20 rounded-lg border border-yellow-500/20">
            <p className="text-xs text-yellow-300/70 mb-2">Transaction Hash</p>
            <p className="font-mono text-xs text-yellow-200 break-all mb-3">{hash}</p>
            <a
              href={txUrl(hash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-yellow-300 hover:text-yellow-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View on BaseScan
            </a>
          </div>
        )}
      </div>
    );
  }

  // État: Vérification serveur en cours
  if (isVerifying) {
    return (
      <div className="space-y-4 p-6 glass rounded-xl border border-blue-500/30 bg-blue-500/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-2xl animate-spin">🔍</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">Server Verification</p>
            <p className="text-sm text-blue-200/80">Validating payment onchain...</p>
          </div>
        </div>
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <p className="text-xs text-blue-300/70 mb-2">⚙️ Verification Steps</p>
          <ul className="space-y-1 text-xs text-blue-200/80">
            <li>✓ Fetching transaction receipt</li>
            <li>✓ Parsing Transfer events</li>
            <li className="animate-pulse">→ Validating recipient & amount...</li>
          </ul>
        </div>
      </div>
    );
  }

  // État: Vérification réussie
  if (verificationResult && hash) {
    return (
      <div className="space-y-4 p-8 glass rounded-xl border-2 border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 animate-shimmer" />
        
        <div className="relative">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
              <span className="text-4xl">✅</span>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-white mb-2">Payment Verified!</p>
              <p className="text-green-200/80">
                {verificationResult.message}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-black/20 rounded-xl border border-green-500/20">
              <p className="text-xs text-green-300/70 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-600/30 text-green-200 rounded-lg text-sm font-bold border border-green-500/30">
                  PAID
                </span>
              </div>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-green-500/20">
              <p className="text-xs text-green-300/70 mb-1">Amount Verified</p>
              <p className="font-mono text-lg font-bold text-white">
                {verificationResult.amountFormatted} USDC
              </p>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-green-500/20">
              <p className="text-xs text-green-300/70 mb-1">Block Number</p>
              <p className="font-mono text-white">
                #{verificationResult.blockNumber}
              </p>
            </div>

            <div className="p-4 bg-black/20 rounded-xl border border-green-500/20">
              <p className="text-xs text-green-300/70 mb-1">Recipient</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(verificationResult.recipient);
                }}
                className="font-mono text-xs text-white break-all hover:text-green-300 transition-colors text-left w-full group"
                title="Click to copy full address"
              >
                <span className="group-hover:underline">{verificationResult.recipient}</span>
                <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">📋</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-black/30 rounded-xl border border-green-500/20">
            <p className="text-xs text-green-300/70 mb-2 flex items-center gap-2">
              <span>🔗</span> Transaction Hash
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-mono text-xs text-green-200 break-all flex-1">
                {hash}
              </p>
              <a
                href={txUrl(hash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm text-green-200 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on BaseScan
              </a>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-green-500/20">
            <p className="text-xs text-green-200/60 italic flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verified onchain by server - Not just frontend success
            </p>
          </div>
        </div>
      </div>
    );
  }

  // État: Erreur de vérification
  if (verificationError) {
    return (
      <div className="space-y-4 p-6 glass rounded-xl border-2 border-red-500/50 bg-red-500/5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <span className="text-2xl">❌</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-300 text-lg">Verification Failed</p>
            <p className="text-sm text-red-200/80 mt-1">{verificationError}</p>
          </div>
        </div>
        {hash && (
          <div className="p-4 bg-black/20 rounded-lg border border-red-500/20">
            <a
              href={txUrl(hash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-red-300 hover:text-red-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View transaction on BaseScan
            </a>
          </div>
        )}
      </div>
    );
  }

  // État: Erreur d'écriture
  if (writeError) {
    return (
      <div className="space-y-4 p-6 glass rounded-xl border border-red-500/30 bg-red-500/5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-red-300">Transaction Failed</p>
            <p className="text-sm text-red-200/80 mt-1">{writeError.name}</p>
          </div>
        </div>
        <button
          onClick={handlePayment}
          className="w-full group relative px-6 py-3 rounded-xl font-semibold overflow-hidden transition-all hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative text-white flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </span>
        </button>
      </div>
    );
  }

  // État: Prêt à payer
  return (
    <div className="space-y-4">
      <button
        onClick={handlePayment}
        className="w-full group relative px-8 py-4 rounded-xl font-bold text-lg overflow-hidden transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-size-200 animate-gradient" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative text-white flex items-center justify-center gap-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          Pay {invoice.amountUsd} USDC
        </span>
      </button>
      
      <div className="flex items-center justify-between text-xs p-4 glass rounded-lg">
        <div className="flex items-center gap-2 text-green-300/70">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>Connected:</span>
        </div>
        <span className="font-mono text-blue-200">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </div>
    </div>
  );
}
