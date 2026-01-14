// src/components/InvoiceCard.tsx
import Link from "next/link";
import type { Invoice } from "@/lib/invoices";
import { formatUsdc } from "@/lib/usdc";

function badgeClass(status: Invoice["status"]) {
  switch (status) {
    case "PAID":
      return "bg-green-500/20 text-green-300 border border-green-500/30";
    case "DUE":
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
    case "INVALID":
      return "bg-red-500/20 text-red-300 border border-red-500/30";
    case "PENDING_VERIFY":
      return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
}

function statusIcon(status: Invoice["status"]) {
  switch (status) {
    case "PAID": return "✅";
    case "DUE": return "⏰";
    case "INVALID": return "❌";
    case "PENDING_VERIFY": return "🔍";
    default: return "📄";
  }
}

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  return (
    <Link href={`/invoice/${invoice.id}`}>
      <div className="group relative glass rounded-2xl p-6 card-hover cursor-pointer overflow-hidden">
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-blue-500/5 transition-all duration-500" />
        
        <div className="relative flex items-start justify-between gap-6">
          {/* Left side */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{statusIcon(invoice.status)}</span>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors">
                  {invoice.reference}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${badgeClass(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-300/70">🏢</span>
                <span className="text-blue-200/80">{invoice.vendorName}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-300/70">📅</span>
                <span className="text-blue-200/80">Due: {invoice.dueDate}</span>
              </div>

              <p className="text-sm text-blue-100/60 line-clamp-2 mt-3">
                {invoice.description}
              </p>
            </div>
          </div>

          {/* Right side - Amount */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30">
              <div className="text-xs text-blue-300/70 mb-1 text-center">Amount</div>
              <div className="font-bold text-2xl text-white tabular-nums flex items-center gap-1">
                {formatUsdc(invoice.amountUsdc)}
                <span className="text-sm text-blue-300/70">{invoice.currency}</span>
              </div>
              <div className="text-xs text-blue-200/50 tabular-nums text-center mt-1">
                ≈ ${invoice.amountUsd}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-blue-300/70 mt-3">
              <span>View details</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
