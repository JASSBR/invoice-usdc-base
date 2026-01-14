// app/invoice/[id]/status/page.tsx
import Link from "next/link";
import { getInvoiceById } from "@/lib/invoices";

export default async function InvoiceStatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = getInvoiceById(id);

  if (!invoice) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-xl font-semibold">Invoice not found</h1>
        <Link className="underline underline-offset-4" href="/">
          Back
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <Link className="underline underline-offset-4" href={`/invoice/${invoice.id}`}>
          ← Back to invoice
        </Link>
        <h1 className="text-2xl font-bold mt-3">Payment status</h1>
        <p className="text-gray-600 mt-1">{invoice.reference}</p>
      </header>

      <section className="rounded-xl border p-4">
        <div className="text-sm">
          <div className="text-gray-500">Current status</div>
          <div className="font-medium">{invoice.status}</div>
        </div>

        <div className="mt-4 text-sm text-gray-700">
          Receipt & onchain verification will appear here in later steps.
        </div>
      </section>
    </main>
  );
}
