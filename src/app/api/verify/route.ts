// src/app/api/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem, decodeEventLog } from "viem";
import { baseSepolia } from "viem/chains";
import { getServerRpcUrl } from "@/lib/chain";
import { getUsdcAddress, USDC_DECIMALS } from "@/lib/usdc";

// ✅ Client Viem côté serveur pour vérifier onchain
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(getServerRpcUrl()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { txHash, expectedAmount, expectedRecipient, invoiceId } = body;

    // Validation des entrées
    if (!txHash || !expectedAmount || !expectedRecipient || !invoiceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ ÉTAPE 1: Récupérer le receipt de la transaction
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    // Vérifier que la transaction a réussi
    if (receipt.status !== "success") {
      return NextResponse.json(
        { error: "Transaction failed onchain" },
        { status: 400 }
      );
    }

    // ✅ ÉTAPE 2: Vérifier que la transaction cible le bon contrat USDC
    const usdcAddress = getUsdcAddress();
    if (receipt.to?.toLowerCase() !== usdcAddress.toLowerCase()) {
      return NextResponse.json(
        { error: `Transaction does not target USDC contract. Expected: ${usdcAddress}, Got: ${receipt.to}` },
        { status: 400 }
      );
    }

    // ✅ ÉTAPE 3: Parser les logs pour trouver l'événement Transfer
    const transferEvent = parseAbiItem(
      "event Transfer(address indexed from, address indexed to, uint256 value)"
    );

    const logs = receipt.logs;
    let transferFound = false;
    let actualRecipient: string | null = null;
    let actualAmount: bigint | null = null;

    for (const log of logs) {
      try {
        // Vérifier si c'est le contrat USDC
        if (log.address.toLowerCase() !== usdcAddress.toLowerCase()) {
          continue;
        }

        // Décoder le log avec decodeEventLog
        const decoded = decodeEventLog({
          abi: [transferEvent],
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === "Transfer") {
          const args = decoded.args as {
            from: `0x${string}`;
            to: `0x${string}`;
            value: bigint;
          };

          actualRecipient = args.to;
          actualAmount = args.value;
          transferFound = true;
          break;
        }
      } catch (e) {
        // Ignorer les logs qui ne matchent pas
        continue;
      }
    }

    if (!transferFound) {
      return NextResponse.json(
        { error: "No USDC Transfer event found in transaction logs" },
        { status: 400 }
      );
    }

    // ✅ ÉTAPE 4: Vérifier le destinataire
    if (actualRecipient?.toLowerCase() !== expectedRecipient.toLowerCase()) {
      return NextResponse.json(
        {
          error: `Recipient mismatch. Expected: ${expectedRecipient}, Got: ${actualRecipient}`,
        },
        { status: 400 }
      );
    }

    // ✅ ÉTAPE 5: Vérifier le montant
    const expectedAmountBigInt = BigInt(expectedAmount);
    if (actualAmount !== expectedAmountBigInt) {
      return NextResponse.json(
        {
          error: `Amount mismatch. Expected: ${expectedAmountBigInt.toString()}, Got: ${actualAmount?.toString()}`,
        },
        { status: 400 }
      );
    }

    // ✅ SUCCÈS: Toutes les vérifications passées
    // Ici, tu pourrais mettre à jour une DB pour marquer la facture comme PAID
    // Pour l'instant, on retourne juste la preuve
    return NextResponse.json(
      {
        success: true,
        verified: true,
        invoiceId,
        txHash,
        blockNumber: receipt.blockNumber.toString(),
        recipient: actualRecipient,
        amount: actualAmount.toString(),
        amountFormatted: (Number(actualAmount) / 10 ** USDC_DECIMALS).toFixed(USDC_DECIMALS),
        message: "Payment verified onchain successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      {
        error: "Internal server error during verification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
