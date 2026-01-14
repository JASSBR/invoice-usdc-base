# 🧾 Invoice USDC Payment System - Base Sepolia

## 📋 Vue d'ensemble

Application Next.js complète pour le paiement de factures en USDC sur Base Sepolia avec **vérification onchain côté serveur**.

### 🎯 Architecture de Vérification

**Source de vérité : Vérification onchain serveur** 

Ce projet implémente une architecture de paiement Web3 de niveau professionnel où la **vérification onchain côté serveur** est la source de vérité, et non le simple succès de la transaction frontend.

```
┌─────────────────┐
│   Frontend      │  1. Utilisateur paie avec Wallet
│   (wagmi)       │  2. Transaction envoyée
└────────┬────────┘  3. Confirmation onchain détectée
         │
         ▼
┌─────────────────┐
│  API Route      │  4. Vérification serveur déclenchée
│  /api/verify    │  5. Récupération du receipt via Viem
│  (viem)         │  6. Validation des logs Transfer
└────────┬────────┘  7. Vérification montant + destinataire
         │
         ▼
┌─────────────────┐
│  Blockchain     │  ✅ Source de vérité ultime
│  Base Sepolia   │  → Transaction hash
└─────────────────┘  → Logs d'événements
                     → Données immuables
```

---

## 🔐 Pourquoi la Vérification Serveur ?

### ❌ Ce que nous NE faisons PAS :

```typescript
// ⚠️ MAUVAIS : Faire confiance au frontend uniquement
const { isSuccess } = useWaitForTransactionReceipt({ hash });
if (isSuccess) {
  // ❌ Marquer comme payé directement
  markInvoiceAsPaid(invoiceId);
}
```

**Problème** : Un utilisateur malveillant pourrait :
- Modifier le code frontend
- Envoyer une transaction vers une mauvaise adresse
- Envoyer un montant incorrect
- Simuler un succès sans transaction réelle

### ✅ Ce que nous FAISONS :

```typescript
// ✅ BON : Vérification serveur avec Viem
const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

// 1. Transaction réussie ?
if (receipt.status !== "success") throw new Error("Transaction failed");

// 2. Contrat USDC correct ?
if (receipt.to !== USDC_ADDRESS) throw new Error("Wrong contract");

// 3. Event Transfer présent ?
const transferLog = parseEventLogs({ abi: [transferEvent], logs: receipt.logs });

// 4. Destinataire correct ?
if (transferLog.args.to !== expectedRecipient) throw new Error("Wrong recipient");

// 5. Montant correct ?
if (transferLog.args.value !== expectedAmount) throw new Error("Wrong amount");

// ✅ Toutes les vérifications passées → Paiement validé
```

---

## 🛠️ Stack Technique

- **Framework** : Next.js 16 (App Router)
- **Blockchain** : Base Sepolia (Testnet)
- **Token** : USDC (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`)
- **Web3 Frontend** : Wagmi + @tanstack/react-query
- **Web3 Backend** : Viem (publicClient)
- **Styling** : Tailwind CSS

---

## 📁 Structure du Projet

```
src/
├── app/
│   ├── api/
│   │   └── verify/
│   │       └── route.ts          # ✅ Vérification onchain serveur
│   ├── invoice/
│   │   └── [id]/
│   │       └── page.tsx          # Page de détail de facture
│   ├── layout.tsx                # Wagmi Provider global
│   └── page.tsx                  # Liste des factures
├── components/
│   ├── PayInvoiceButton.tsx      # Composant de paiement complet
│   └── WagmiProvider.tsx         # Configuration Wagmi
└── lib/
    ├── chain.ts                  # Configuration Base Sepolia
    ├── invoices.ts               # Données de test
    ├── usdc.ts                   # ABI ERC-20 + helpers
    └── wagmi.ts                  # Config Wagmi
```

---

## 🔄 Cycle de Paiement Complet

### 1️⃣ Frontend : Envoi de la Transaction

```typescript
// components/PayInvoiceButton.tsx
const { writeContract } = useWriteContract();

writeContract({
  address: USDC_ADDRESS,
  abi: erc20Abi,
  functionName: "transfer",
  args: [invoice.vendorAddress, invoice.amountUsdc],
});
```

### 2️⃣ Frontend : Attente de Confirmation

```typescript
const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

if (isLoading) {
  // Afficher "⏳ Transaction envoyée"
}

if (isSuccess) {
  // Déclencher la vérification serveur
  verifyPayment(hash);
}
```

### 3️⃣ Backend : Vérification Onchain

```typescript
// app/api/verify/route.ts
export async function POST(request: NextRequest) {
  const { txHash, expectedAmount, expectedRecipient } = await request.json();

  // Récupérer le receipt onchain
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });

  // Vérifications critiques
  if (receipt.status !== "success") return error("Transaction failed");
  if (receipt.to !== USDC_ADDRESS) return error("Wrong contract");

  // Parser les logs Transfer
  const transferLog = parseEventLogs({
    abi: [transferEvent],
    logs: receipt.logs,
  })[0];

  // Valider destinataire et montant
  if (transferLog.args.to !== expectedRecipient) return error("Wrong recipient");
  if (transferLog.args.value !== expectedAmount) return error("Wrong amount");

  // ✅ Succès : Toutes les vérifications passées
  return json({ verified: true, txHash, amount, recipient });
}
```

### 4️⃣ Frontend : Affichage de la Preuve

```typescript
// Une fois la vérification serveur réussie
<div className="bg-green-50 border-green-200">
  ✅ Paiement vérifié onchain !
  
  <div>
    <strong>Status:</strong> PAID
    <strong>Montant:</strong> {verifiedAmount} USDC
    <strong>Destinataire:</strong> {verifiedRecipient}
    <strong>Hash:</strong> {txHash}
    <strong>Block:</strong> {blockNumber}
  </div>

  <a href={basescanUrl}>🔍 Voir sur BaseScan</a>
</div>
```

---

## 🚀 Installation et Démarrage

### Prérequis

- Node.js 18+
- Un wallet MetaMask (ou compatible)
- Des ETH de test sur Base Sepolia ([Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
- Des USDC de test sur Base Sepolia

### Installation

```bash
npm install
```

### Configuration (Optionnel)

Créer un fichier `.env.local` :

```env
# RPC personnalisé (optionnel)
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://your-custom-rpc.com
BASE_SEPOLIA_RPC_URL=https://your-custom-rpc.com

# Adresse USDC custom (optionnel, par défaut: 0x036CbD53842c5426634e7929541eC2318f3dCF7e)
NEXT_PUBLIC_USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Démarrage

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 🧪 Tester le Paiement

1. **Obtenir des tokens de test** :
   - ETH Base Sepolia : [Faucet Coinbase](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
   - USDC Base Sepolia : Utiliser un service de swap ou faucet USDC

2. **Connecter votre wallet** :
   - Cliquer sur "Connect Wallet"
   - Approuver la connexion à Base Sepolia

3. **Sélectionner une facture** :
   - Cliquer sur une facture dans la liste
   - Cliquer sur "💳 Payer X USDC"

4. **Confirmer dans MetaMask** :
   - Vérifier le montant et l'adresse
   - Approuver la transaction

5. **Observer les états** :
   - ⏳ "Transaction envoyée" (pending)
   - ✅ "Transaction confirmée" (onchain)
   - 🔍 "Vérification serveur..." (API call)
   - ✅ "Paiement vérifié onchain !" (success)

---

## 🔍 Points Techniques Clés

### 1. ABI Minimal ERC-20

```typescript
// lib/usdc.ts
export const erc20Abi = [
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
] as const;
```

### 2. Parsing des Logs avec Viem

```typescript
import { parseAbiItem } from "viem";

const transferEvent = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

const decodedLogs = publicClient.parseEventLogs({
  abi: [transferEvent],
  logs: receipt.logs,
});

const { from, to, value } = decodedLogs[0].args;
```

### 3. Gestion des Décimales USDC

```typescript
// USDC = 6 décimales (pas 18 comme ETH)
const USDC_DECIMALS = 6;

// Pour 100.50 USDC
const amount = parseUnits("100.50", 6); // 100500000n
const formatted = formatUnits(amount, 6); // "100.5"
```

---

## 🎓 Concepts Web3 Avancés

### Event Logs vs Function Returns

```typescript
// ❌ Ne PAS faire confiance au return value uniquement
const success = await contract.transfer(to, amount);
// Un contrat malveillant peut return true sans faire le transfer

// ✅ Vérifier les event logs onchain
const receipt = await publicClient.getTransactionReceipt({ hash });
const transferEvent = parseEventLogs({ abi, logs: receipt.logs });
// Les events sont immuables et fiables
```

### Indexed vs Non-Indexed Parameters

```solidity
// Event Transfer dans le contrat USDC
event Transfer(
  address indexed from,   // ✅ Indexed : Filtrable
  address indexed to,     // ✅ Indexed : Filtrable
  uint256 value           // ❌ Non-indexed : Données uniquement
);
```

Les paramètres `indexed` permettent de filtrer les logs efficacement :

```typescript
const logs = await publicClient.getLogs({
  address: USDC_ADDRESS,
  event: transferEvent,
  args: {
    to: recipientAddress, // ✅ Possible car 'to' est indexed
  },
});
```

---

## 🔒 Sécurité

### ✅ Bonnes Pratiques Implémentées

1. **Vérification serveur obligatoire** : Aucun statut "PAID" sans validation API
2. **Validation du contrat cible** : On vérifie que `receipt.to === USDC_ADDRESS`
3. **Parsing des logs** : On ne fait pas confiance au return value
4. **Validation du destinataire** : On vérifie que `transferLog.args.to === expectedRecipient`
5. **Validation du montant** : On vérifie que `transferLog.args.value === expectedAmount`
6. **Gestion des erreurs** : Tous les cas d'échec sont gérés et loggés

### 🚨 Vulnérabilités Évitées

- ✅ **Pas de confiance frontend** : Le frontend ne décide pas du statut final
- ✅ **Pas de replay attacks** : Chaque hash est unique
- ✅ **Pas de montant incorrect** : Validé onchain côté serveur
- ✅ **Pas de destinataire incorrect** : Validé onchain côté serveur

---

## 📊 États de Transaction

| État Frontend | État Blockchain | Action Serveur | Statut Final |
|--------------|----------------|----------------|--------------|
| `isPending` | ⏳ Mempool | - | `PENDING` |
| `isConfirming` | ✅ Confirmé | 🔍 Vérification | `PENDING_VERIFY` |
| `isSuccess` + `verified` | ✅ Confirmé | ✅ Validé | `PAID` |
| `isSuccess` + `error` | ✅ Confirmé | ❌ Rejeté | `INVALID` |
| `error` | ❌ Failed | - | `DUE` |

---

## 🛣️ Roadmap / Améliorations Possibles

- [ ] **Base de données** : Persister les factures et statuts (Prisma + PostgreSQL)
- [ ] **Webhooks** : Notifier des systèmes externes lors des paiements
- [ ] **Multi-signatures** : Supporter les wallets multi-sig pour les entreprises
- [ ] **Récurrences** : Paiements automatiques récurrents
- [ ] **NFT Reçus** : Minter un NFT comme preuve de paiement
- [ ] **Support multi-tokens** : Accepter USDC, DAI, USDT
- [ ] **Mainnet** : Déployer sur Base mainnet

---

## 🤝 Contribution

Ce projet est un starter kit éducatif. N'hésitez pas à :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📚 Ressources

- [Base Docs](https://docs.base.org/)
- [Wagmi Docs](https://wagmi.sh/)
- [Viem Docs](https://viem.sh/)
- [USDC on Base](https://www.circle.com/en/usdc)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)

---

## 📝 Licence

MIT

---

## 🙏 Remerciements

- Circle pour USDC sur Base Sepolia
- L'équipe Base pour l'infrastructure
- La communauté Wagmi/Viem pour les outils incroyables

---

**🎯 Rappel Important** : Ce projet démontre que la **vérification onchain côté serveur** est la **source de vérité ultime** pour les paiements Web3. Le succès d'une transaction frontend n'est jamais suffisant pour valider un paiement en production.
