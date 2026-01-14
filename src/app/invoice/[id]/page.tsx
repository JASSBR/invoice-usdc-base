// src/app/invoice/[id]/page.tsx
import Link from "next/link";
import { getInvoiceById } from "@/lib/invoices";
import { formatUsdc, usdcExplorerUrl } from "@/lib/usdc";
import { PayInvoiceButton } from "@/components/PayInvoiceButton";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = getInvoiceById(id);

  if (!invoice) {
    return (
      <div className="min-h-screen">
        <main className="max-w-4xl mx-auto p-6">
          <div className="glass rounded-2xl p-12 text-center">
            <span className="text-6xl mb-4 block">❌</span>
            <h1 className="text-2xl font-bold text-white mb-4">Invoice not found</h1>
            <Link 
              className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors" 
              href="/"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to invoices
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      
      <main className="max-w-4xl mx-auto p-6">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link 
            className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors text-sm" 
            href="/"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to invoices
          </Link>
        </div>

        {/* Invoice Header */}
        <div className="glass rounded-2xl p-8 mb-6">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="text-3xl">📄</span>
                {invoice.reference}
              </h1>
              <p className="text-blue-200/80 text-lg">{invoice.vendorName}</p>
            </div>
            
            <div className={`px-4 py-2 rounded-xl font-semibold text-sm ${
              invoice.status === "PAID" 
                ? "bg-green-500/20 text-green-300 border border-green-500/30" 
                : invoice.status === "DUE"
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            }`}>
              {invoice.status}
            </div>
          </div>

          {/* Amount Card - Prominent */}
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-2xl p-8 mb-6">
            <div className="text-center">
              <p className="text-blue-300/70 text-sm mb-2">Invoice Amount</p>
              <div className="text-6xl font-bold text-white mb-2 tabular-nums">
                {formatUsdc(invoice.amountUsdc)}
                <span className="text-3xl text-blue-300/70 ml-2">{invoice.currency}</span>
              </div>
              <p className="text-blue-200/50 text-lg">≈ ${invoice.amountUsd} USD</p>
            </div>
          </div>

          {/* Invoice Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <p className="text-blue-300/70 text-sm mb-1 flex items-center gap-2">
                  <span>📅</span> Due Date
                </p>
                <p className="text-white font-medium text-lg">{invoice.dueDate}</p>
              </div>

              <div>
                <p className="text-blue-300/70 text-sm mb-1 flex items-center gap-2">
                  <span>📝</span> Description
                </p>
                <p className="text-blue-100/80">{invoice.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-blue-300/70 text-sm mb-1 flex items-center gap-2">
                  <span>🏦</span> Vendor Address
                </p>
                <div className="bg-black/20 rounded-lg p-3 border border-blue-500/20">
                  <p className="font-mono text-xs text-blue-200 break-all">
                    {invoice.vendorAddress}
                  </p>
                </div>
              </div>

              <div>
                <a
                  className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors"
                  href={usdcExplorerUrl()}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View USDC token on BaseScan
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span>💳</span>
            Payment
          </h2>
          
          <PayInvoiceButton invoice={invoice} />

          <div className="mt-6 pt-6 border-t border-blue-500/20">
            <Link
              href={`/invoice/${invoice.id}/status`}
              className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              View payment status
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
