// src/lib/invoices.ts
import { parseUsdc } from "@/lib/usdc";

export type InvoiceStatus = "DUE" | "PAID" | "INVALID" | "PENDING_VERIFY";

export type Invoice = {
  id: string;
  reference: string;
  vendorName: string;
  vendorAddress: `0x${string}`;
  amountUsd: string; // affichage humain
  amountUsdc: bigint; // base units (6 decimals)
  currency: "USDC";
  dueDate: string; // ISO date
  description: string;
  status: InvoiceStatus;
};

export const seededInvoices: Invoice[] = [
  {
    id: "inv_001",
    reference: "INV-2026-001",
    vendorName: "Acme Logistics",
    vendorAddress: "0x7e2E1261bb158005804274e6875dF921b219C678",
    amountUsd: "0.00001",
    amountUsdc: parseUsdc("0.00001"),
    currency: "USDC",
    dueDate: "2026-01-20",
    description: "Transport & livraison - Janvier",
    status: "DUE",
  },
  {
    id: "inv_002",
    reference: "INV-2026-002",
    vendorName: "Cloud Services Ltd",
    vendorAddress: "0x7e2E1261bb158005804274e6875dF921b219C678",
    amountUsd: "0.005",
    amountUsdc: parseUsdc("0.005"),
    currency: "USDC",
    dueDate: "2026-01-18",
    description: "Hébergement & stockage",
    status: "DUE",
  },
  {
    id: "inv_003",
    reference: "INV-2026-003",
    vendorName: "Design Studio",
    vendorAddress: "0x7e2E1261bb158005804274e6875dF921b219C678",
    amountUsd: "0.002",
    amountUsdc: parseUsdc("0.002"),
    currency: "USDC",
    dueDate: "2026-01-25",
    description: "Maquettes landing page",
    status: "DUE",
  },
];

export function listInvoices(): Invoice[] {
  return seededInvoices;
}

export function getInvoiceById(id: string): Invoice | undefined {
  return seededInvoices.find((inv) => inv.id === id);
}

export function updateInvoiceStatus(id: string, status: InvoiceStatus): boolean {
  const invoice = seededInvoices.find((inv) => inv.id === id);
  if (invoice) {
    invoice.status = status;
    return true;
  }
  return false;
}
