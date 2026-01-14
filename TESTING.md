# Guide de Test - Invoice USDC Payment

## 🧪 Prérequis pour tester

### 1. Obtenir des tokens de test

#### ETH Base Sepolia
1. Aller sur [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Connecter votre wallet MetaMask
3. Demander des ETH de test (0.05 ETH par jour)

#### USDC Base Sepolia
Le contrat USDC sur Base Sepolia : `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

Options pour obtenir des USDC de test :
1. **Swap depuis ETH** : Utiliser un DEX testnet (Uniswap, etc.)
2. **Bridge** : Bridge depuis Sepolia vers Base Sepolia
3. **Faucet communautaire** : Chercher sur Discord/Twitter de Base

### 2. Configurer MetaMask

1. Ajouter le réseau Base Sepolia :
   - Nom du réseau : Base Sepolia
   - RPC URL : `https://sepolia.base.org`
   - Chain ID : `84532`
   - Symbole : ETH
   - Block Explorer : `https://sepolia.basescan.org`

2. Importer le token USDC :
   - Adresse : `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Symbole : USDC
   - Décimales : 6

---

## 🔍 Scénarios de Test

### Test 1 : Paiement Réussi

**Objectif** : Vérifier le cycle complet de paiement

1. Lancer l'app : `npm run dev`
2. Aller sur http://localhost:3000
3. Cliquer sur une facture (ex: "Acme Logistics - $125.50")
4. Cliquer sur "Connect Wallet"
5. Approuver la connexion dans MetaMask
6. Cliquer sur "💳 Payer 125.50 USDC"
7. **Observer les états** :
   - "Envoi en cours..." → Confirmation dans le wallet
   - "⏳ Transaction envoyée" → En attente de block
   - "🔍 Vérification serveur..." → API appelle Viem
   - "✅ Paiement vérifié onchain !" → Succès

**Résultat attendu** :
- ✅ Status "PAID" affiché
- ✅ Montant vérifié correct
- ✅ Hash de transaction affiché
- ✅ Lien vers BaseScan fonctionnel

---

### Test 2 : Vérifier l'Échec si Mauvais Destinataire

**Objectif** : Prouver que la vérification serveur détecte une fraude

**Note** : Ce test nécessite de modifier temporairement le code pour simulation

1. Dans [PayInvoiceButton.tsx](src/components/PayInvoiceButton.tsx), ligne ~74 :
```typescript
// Modification temporaire pour test
writeContract({
  address: getUsdcAddress(),
  abi: erc20Abi,
  functionName: "transfer",
  args: [
    "0x0000000000000000000000000000000000000000", // ❌ Mauvaise adresse
    invoice.amountUsdc
  ],
});
```

2. Effectuer un paiement
3. Observer que la transaction est confirmée onchain
4. **Observer que la vérification serveur échoue** avec :
   - ❌ "Échec de vérification"
   - ❌ "Recipient mismatch"

**Résultat attendu** :
- ❌ Status reste "DUE"
- ❌ Message d'erreur clair
- ✅ Prouve que le serveur ne fait pas confiance au frontend

---

### Test 3 : Vérifier l'Échec si Montant Incorrect

1. Modifier temporairement le montant :
```typescript
args: [
  invoice.vendorAddress,
  BigInt(1000000) // ❌ 1 USDC au lieu du montant attendu
],
```

2. Effectuer un paiement
3. Observer que la vérification serveur échoue avec :
   - ❌ "Amount mismatch"

---

### Test 4 : Transaction vers Mauvais Contrat

1. Modifier temporairement l'adresse du contrat :
```typescript
writeContract({
  address: "0x1111111111111111111111111111111111111111", // ❌ Pas USDC
  // ...
});
```

2. Observer que la vérification échoue avec :
   - ❌ "Transaction does not target USDC contract"

---

## 📊 Points de Vérification API

### Endpoint : POST /api/verify

**Request Body** :
```json
{
  "txHash": "0x...",
  "expectedAmount": "125500000",
  "expectedRecipient": "0x1111111111111111111111111111111111111111",
  "invoiceId": "inv_001"
}
```

**Success Response (200)** :
```json
{
  "success": true,
  "verified": true,
  "invoiceId": "inv_001",
  "txHash": "0x...",
  "blockNumber": "12345678",
  "recipient": "0x1111111111111111111111111111111111111111",
  "amount": "125500000",
  "amountFormatted": "125.500000",
  "message": "Payment verified onchain successfully"
}
```

**Error Response (400)** :
```json
{
  "error": "Recipient mismatch. Expected: 0x1111..., Got: 0x0000..."
}
```

---

## 🔧 Debugging

### Vérifier les Logs Serveur

```bash
# Terminal où tourne `npm run dev`
# Observer les logs de l'API Route
```

### Vérifier la Transaction sur BaseScan

1. Copier le hash de transaction
2. Aller sur https://sepolia.basescan.org/tx/HASH
3. Vérifier :
   - Status : Success ✅
   - To : `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
   - Logs : Event "Transfer" présent
   - Decoded Input : Fonction "transfer" appelée

### Erreurs Communes

#### "Transaction failed onchain"
- Vérifier que vous avez assez de USDC
- Vérifier que le montant ne dépasse pas votre balance

#### "No USDC Transfer event found"
- Vérifier que la transaction cible bien le contrat USDC
- Vérifier que la fonction `transfer` a été appelée

#### "Recipient mismatch"
- Ne pas modifier le destinataire dans le code
- Utiliser l'adresse de la facture

---

## 📈 Métriques de Performance

### Temps de Vérification Attendu

1. **Transaction envoyée** : ~2-5 secondes (confirmation wallet)
2. **Confirmation onchain** : ~2-4 secondes (block time Base)
3. **Vérification serveur** : ~1-2 secondes (appel RPC + parsing)
4. **Total** : ~5-11 secondes

### Optimisations Possibles

- Utiliser un RPC privé plus rapide (Alchemy, Infura)
- Implémenter un cache pour les receipts déjà vérifiés
- Utiliser des webhooks au lieu de polling

---

## ✅ Checklist Finale

Avant de considérer le projet terminé :

- [ ] Transaction USDC réussie sur Base Sepolia
- [ ] États "Transaction envoyée" → "Confirmée" → "Vérifiée" affichés
- [ ] API /api/verify retourne un succès
- [ ] Status "PAID" affiché avec toutes les infos
- [ ] Lien BaseScan fonctionnel
- [ ] Test d'échec avec mauvais destinataire
- [ ] Test d'échec avec mauvais montant
- [ ] README technique lu et compris

---

## 🎯 Prochaines Étapes

Une fois les tests passés, considérez :

1. **Ajouter une base de données** pour persister les statuts
2. **Implémenter un système de notifications** (email, webhook)
3. **Créer un dashboard admin** pour gérer les factures
4. **Déployer sur Vercel** avec variables d'environnement
5. **Passer en production sur Base Mainnet** (après audits de sécurité)

---

**🔒 Rappel Sécurité** : Toujours vérifier côté serveur. Le frontend est modifiable par l'utilisateur et ne doit jamais être la source de vérité pour les paiements.
