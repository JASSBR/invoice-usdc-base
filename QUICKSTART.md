# 🚀 Quick Start Guide

## Installation Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) 🎉

---

## ⚡ Premiers Pas

### 1. Préparer votre Wallet

#### Ajouter Base Sepolia à MetaMask

Paramètres réseau :
- **Nom** : Base Sepolia
- **RPC URL** : `https://sepolia.base.org`
- **Chain ID** : `84532`
- **Symbole** : ETH
- **Explorer** : `https://sepolia.basescan.org`

#### Obtenir des tokens de test

1. **ETH** : [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. **USDC** : Contrat `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### 2. Tester un Paiement

1. Connecter votre wallet sur l'app
2. Choisir une facture
3. Cliquer sur "Payer X USDC"
4. Confirmer dans MetaMask
5. Observer les états :
   - ⏳ Transaction envoyée
   - ✅ Transaction confirmée
   - 🔍 Vérification serveur
   - ✅ Paiement vérifié !

---

## 📚 Documentation Complète

- **[README.md](README.md)** - Documentation technique complète
- **[TESTING.md](TESTING.md)** - Guide de test détaillé
- **[CHANGELOG.md](CHANGELOG.md)** - Détails d'implémentation

---

## 🛠️ Commandes Utiles

```bash
# Développement
npm run dev

# Build production
npm run build

# Démarrer en production
npm start

# Linter
npm run lint
```

---

## 🔍 Architecture en 3 Couches

```
┌─────────────────────┐
│   1. FRONTEND       │  → wagmi + React hooks
│   (PayInvoiceButton)│  → useWriteContract, useWaitForTransactionReceipt
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   2. API ROUTE      │  → POST /api/verify
│   (Verification)    │  → Viem publicClient
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   3. BLOCKCHAIN     │  → Base Sepolia
│   (Source Vérité)   │  → Transaction Receipt + Logs
└─────────────────────┘
```

---

## ⚠️ Important

**Source de vérité : Vérification onchain serveur**

❌ Ne JAMAIS faire confiance au frontend uniquement  
✅ Toujours vérifier côté serveur avec Viem

Le succès d'une transaction frontend **n'est pas suffisant** pour valider un paiement. L'API `/api/verify` est **obligatoire**.

---

## 🆘 Besoin d'Aide ?

### Problèmes Courants

**"Transaction failed"**
- Vérifiez votre balance USDC
- Vérifiez que vous êtes sur Base Sepolia

**"Verification failed"**
- Attendez quelques secondes de plus
- Vérifiez sur BaseScan que la transaction est confirmée

**"Wrong contract"**
- Vérifiez que l'adresse USDC est correcte dans .env

---

## 🎯 Prochaines Étapes

Après avoir testé avec succès :

1. ✅ Lire [README.md](README.md) pour comprendre l'architecture
2. ✅ Tester tous les scénarios dans [TESTING.md](TESTING.md)
3. ✅ Consulter [CHANGELOG.md](CHANGELOG.md) pour les détails techniques
4. 🚀 Ajouter une base de données pour persister les paiements
5. 🚀 Déployer sur Vercel

---

**Bon développement ! 🎉**
