# Tree Ledger: Hierarchical Deterministic (HD) Multi-Chain Wallet

Tree Ledger is a Hierarchical Deterministic (HD) wallet project designed for Solana, Ethereum, and Bitcoin. Built using Next.js, React, Tailwind CSS, and cryptographic standards, this application enables users to manage their digital assets, derive accounts from a single mnemonic seed phrase, query real-time balances, request faucets, and execute secure on-chain transfers.

---

## 🌟 Key Features

### 🔑 Cryptographic Key Derivation
* **BIP39 Mnemonic Seed Phrase**: Generate secure 12-word seed phrases or import existing ones to initialize the master seed.
* **Multi-Chain Support**: Derives addresses for multiple blockchains from a single root seed using standard derivation paths:
  * **Solana (SOL)**: `m/44'/501'/0'/i'` (using Ed25519 curve)
  * **Ethereum (ETH)**: `m/44'/60'/0'/0/i` (using secp256k1 curve)
  * **Bitcoin (BTC)**: `m/44'/0'/0'/0/i` (using secp256k1 curve and encoding to legacy Mainnet addresses)

### ⛓️ Solana On-Chain Integration
* **Multi-Cluster Support**: Easily switch between Solana **Devnet**, **Testnet**, and **Mainnet Beta**.
* **Real-Time Balances**: Automatically query and display current balances for all derived Solana addresses.
* **Devnet/Testnet Faucet (Airdrop)**: Request faucet tokens (1.0 SOL) directly within the dashboard (with failover guidance to web faucets).
* **Secure Transfer**: Send SOL transactions on-chain by entering a destination address and amount, utilizing client-side keypairs for signing transactions securely.
* **Transaction Signature History**: Inspect the 5 most recent transaction signatures for any derived Solana address.

---

## 🛠️ Tech Stack & Dependencies

* **Framework**: [Next.js](https://nextjs.org/) (App Router) & [React](https://react.dev/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Radix UI primitives](https://www.radix-ui.com/)
* **Solana Interface**: [@solana/web3.js](https://solana-labs.github.io/solana-web3.js/)
* **Cryptography & Encoding**:
  * `bip39` (Mnemonic phrase generation and validation)
  * `ed25519-hd-key` (Ed25519 derivation path helper)
  * `tweetnacl` (Signature library for Solana keys)
  * `ethers` (secp256k1 public key derivation for Bitcoin/Ethereum)
  * `bs58` (Base58 encoding/decoding)
* **Icons & UI Feedback**: `lucide-react`, `@web3icons/react`, and `sonner` toasts

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v20+ recommended) and `npm` installed.

### ⚙️ Installation

1. Clone the repository and navigate to the project root directory:
   ```bash
   cd treeledger
   ```

2. Install the package dependencies:
   ```bash
   npm install
   ```

### 💻 Running the Development Server
Start the local server to run the application in development mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### 📦 Building for Production
To compile and build an optimized production version of the application:
```bash
npm run build
```
To run the production build locally:
```bash
npm run start
```

---

## 🔍 How It Works

1. **Root Mnemonic Setup**: The user generates a new 12-word seed phrase or imports an existing valid BIP39 phrase. The mnemonic is stored securely in the browser's local storage for session persistence.
2. **Deterministic Derivation**:
   * For **Solana**, the seed is passed to `derivePath` with the Solana path (`m/44'/501'/0'/i'`). A 32-byte seed is derived, from which `tweetnacl` generates the key pair.
   * For **Ethereum/Bitcoin**, standard `ethers.HDNodeWallet` path derivation is applied.
3. **Solana RPC Calls**:
   * Connection handles RPC communication with public Solana cluster endpoints.
   * On-chain transactions are signed using the private key (`Keypair.fromSecretKey`) client-side before sending the raw transaction to the RPC node.
