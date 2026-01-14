// src/app/page.tsx
import { InvoiceCard } from "@/components/InvoiceCard";
import { listInvoices } from "@/lib/invoices";
import { usdcExplorerUrl } from "@/lib/usdc";

export default function HomePage() {
  const invoices = listInvoices();
  const stats = {
    total: invoices.length,
    due: invoices.filter(i => i.status === "DUE").length,
    paid: invoices.filter(i => i.status === "PAID").length,
  };

  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 gradient-text">
              💎 Invoices Onchain
            </h1>
            <p className="text-xl text-blue-200/80 mb-6">
              Pay your invoices with USDC on Base Sepolia
            </p>
            <a
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200 hover:bg-blue-500/20 transition-all text-sm"
              href={usdcExplorerUrl()}
              target="_blank"
              rel="noreferrer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View USDC on BaseScan
            </a>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="glass rounded-xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-300/70 mb-1">Total Invoices</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-300/70 mb-1">Due</p>
                  <p className="text-3xl font-bold text-white">{stats.due}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-2xl">⏰</span>
                </div>
              </div>
            </div>
            
            <div className="glass rounded-xl p-6 card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-300/70 mb-1">Paid</p>
                  <p className="text-3xl font-bold text-white">{stats.paid}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">📄</span>
              Your Invoices
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {invoices.map((inv) => (
                <InvoiceCard key={inv.id} invoice={inv} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
