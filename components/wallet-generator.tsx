"use client";
import React from "react";
import Navbar from "./navbar";
import { Button } from "@/components/ui/button";
import AccountsList from "./accounts-list";
import { Dialog, DialogTitle } from "@radix-ui/react-dialog";
import {
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import MnemonicsDialog from "./mnemonics-dialog";
import { toast } from "sonner";
import type { Account } from "@/types/utils";
import nacl from "tweetnacl";
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  Keypair,
  type ConfirmedSignatureInfo,
} from "@solana/web3.js";
import bs58 from "bs58";
import { HDNodeWallet, sha256, ripemd160, getBytes } from "ethers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, RefreshCw, Send, ArrowUpRight, CheckCircle2, XCircle, History } from "lucide-react";

// Helper function to derive a legacy Bitcoin address from secp256k1 public key
const deriveBitcoinAddress = (publicKeyHex: string) => {
  const pubKeyBytes = getBytes(publicKeyHex);
  const sha256Hash = sha256(pubKeyBytes);
  const ripemd160Hash = ripemd160(sha256Hash);

  const ripemdBytes = getBytes(ripemd160Hash);
  const versionedPayload = new Uint8Array(1 + ripemdBytes.length);
  versionedPayload[0] = 0x00; // version byte for Bitcoin Mainnet legacy address (1...)
  versionedPayload.set(ripemdBytes, 1);

  const firstSha = getBytes(sha256(versionedPayload));
  const secondSha = getBytes(sha256(firstSha));
  const checksum = secondSha.slice(0, 4);

  const finalPayload = new Uint8Array(versionedPayload.length + 4);
  finalPayload.set(versionedPayload, 0);
  finalPayload.set(checksum, versionedPayload.length);

  return bs58.encode(finalPayload);
};

const WalletGenerator = () => {
  const [mnemonicWords, setMnemonicWords] = React.useState<string[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [network, setNetwork] = React.useState<"mainnet-beta" | "devnet" | "testnet">("devnet");
  const [balances, setBalances] = React.useState<Record<string, number>>({});
  const [loadingBalances, setLoadingBalances] = React.useState<Record<string, boolean>>({});
  const [airdropLoading, setAirdropLoading] = React.useState<Record<string, boolean>>({});

  // Dialog State: Sending SOL
  const [sendingAccount, setSendingAccount] = React.useState<Account | null>(null);
  const [recipientAddress, setRecipientAddress] = React.useState("");
  const [sendAmount, setSendAmount] = React.useState("");
  const [sendingTx, setSendingTx] = React.useState(false);

  // Dialog State: Transaction History
  const [viewingTxAccount, setViewingTxAccount] = React.useState<Account | null>(null);
  const [txHistory, setTxHistory] = React.useState<ConfirmedSignatureInfo[]>([]);
  const [loadingTx, setLoadingTx] = React.useState(false);

  const btcAc = React.useRef(0);
  const solAc = React.useRef(0);
  const ethAc = React.useRef(0);

  // Create Solana connection based on network
  const connection = React.useMemo(() => {
    return new Connection(clusterApiUrl(network), "confirmed");
  }, [network]);

  // Load from local storage
  React.useEffect(() => {
    const storedWords = localStorage.getItem("mnemonics");
    const storedAccounts = localStorage.getItem("accounts");
    const storedNetwork = localStorage.getItem("network") as "mainnet-beta" | "devnet" | "testnet" | null;

    if (storedNetwork) {
      setNetwork(storedNetwork);
    }

    let parsedAccounts: Account[] = [];
    if (storedAccounts) {
      try {
        parsedAccounts = JSON.parse(storedAccounts);
      } catch {
        parsedAccounts = [];
      }
    }

    const solAccounts = parsedAccounts.filter((acc: Account) => acc.type === "SOL");
    const ethAccounts = parsedAccounts.filter((acc: Account) => acc.type === "ETH");
    const btcAccounts = parsedAccounts.filter((acc: Account) => acc.type === "BTC");

    btcAc.current = btcAccounts.length;
    solAc.current = solAccounts.length;
    ethAc.current = ethAccounts.length;

    if (storedWords) {
      setMnemonicWords(JSON.parse(storedWords));
      setAccounts(parsedAccounts);
    }
  }, []);

  // Sync network choice to localStorage
  const handleNetworkChange = (val: "mainnet-beta" | "devnet" | "testnet") => {
    setNetwork(val);
    localStorage.setItem("network", val);
    toast.success(`Switched to Solana ${val === "mainnet-beta" ? "Mainnet" : val === "devnet" ? "Devnet" : "Testnet"}`);
  };

  // Fetch balance for a specific address
  const fetchBalance = React.useCallback(
    async (address: string) => {
      setLoadingBalances((prev) => ({ ...prev, [address]: true }));
      try {
        const pubKey = new PublicKey(address);
        const lamports = await connection.getBalance(pubKey);
        const sol = lamports / LAMPORTS_PER_SOL;
        setBalances((prev) => ({ ...prev, [address]: sol }));
      } catch (error) {
        console.error("Error fetching balance:", error);
        toast.error(`Failed to load balance for ${address.slice(0, 4)}...`);
      } finally {
        setLoadingBalances((prev) => ({ ...prev, [address]: false }));
      }
    },
    [connection]
  );

  // Fetch balances when accounts or network change
  React.useEffect(() => {
    accounts.forEach((acc) => {
      if (acc.type === "SOL") {
        fetchBalance(acc.publicKey);
      }
    });
  }, [accounts, network, fetchBalance]);

  // Request Airdrop on Devnet/Testnet
  const requestAirdrop = async (address: string) => {
    setAirdropLoading((prev) => ({ ...prev, [address]: true }));
    try {
      const pubKey = new PublicKey(address);
      const signature = await connection.requestAirdrop(pubKey, 1 * LAMPORTS_PER_SOL);
      
      const latestBlockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: signature,
        },
        "confirmed"
      );

      toast.success("Airdrop of 1.0 SOL succeeded!");
      fetchBalance(address);
    } catch (error) {
      console.error("Airdrop error:", error);
      const errMessage = error instanceof Error ? error.message : String(error);
      const isRateLimitOrInternal = 
        errMessage.includes("429") || 
        errMessage.toLowerCase().includes("rate limit") || 
        errMessage.toLowerCase().includes("internal error") ||
        errMessage.toLowerCase().includes("faucet");

      if (isRateLimitOrInternal) {
        toast.error(
          <div className="flex flex-col gap-1 text-left">
            <span className="font-semibold text-sm">Faucet Request Failed</span>
            <span className="text-xs text-muted-foreground">
              The public Solana faucet is currently rate-limited or experiencing issues.
            </span>
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1 font-semibold"
            >
              Go to Solana Faucet Web App <ExternalLink className="size-3" />
            </a>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.error(`Airdrop request failed: ${errMessage}`);
      }
    } finally {
      setAirdropLoading((prev) => ({ ...prev, [address]: false }));
    }
  };

  // Fetch transaction history
  const fetchTxHistory = React.useCallback(
    async (address: string) => {
      setLoadingTx(true);
      try {
        const pubKey = new PublicKey(address);
        const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 5 });
        setTxHistory(signatures);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to fetch transaction history");
      } finally {
        setLoadingTx(false);
      }
    },
    [connection]
  );

  React.useEffect(() => {
    if (viewingTxAccount) {
      fetchTxHistory(viewingTxAccount.publicKey);
    }
  }, [viewingTxAccount, fetchTxHistory]);

  // Send SOL Transaction
  const handleSendTransaction = async () => {
    if (!sendingAccount) return;
    if (!recipientAddress) {
      toast.error("Recipient address is required");
      return;
    }
    if (!sendAmount || isNaN(Number(sendAmount)) || Number(sendAmount) <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    setSendingTx(true);
    try {
      const senderPubKey = new PublicKey(sendingAccount.publicKey);
      const recipientPubKey = new PublicKey(recipientAddress.trim());
      const amountLamports = Number(sendAmount) * LAMPORTS_PER_SOL;

      // Validate address
      if (!PublicKey.isOnCurve(recipientPubKey.toBuffer())) {
        throw new Error("Invalid destination address (off-curve)");
      }

      // Check balance
      const currentBalance = balances[sendingAccount.publicKey] || 0;
      if (Number(sendAmount) > currentBalance) {
        throw new Error("Insufficient SOL balance");
      }

      const secretKey = bs58.decode(sendingAccount.privateKey);
      const keypair = Keypair.fromSecretKey(secretKey);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderPubKey,
          toPubkey: recipientPubKey,
          lamports: amountLamports,
        })
      );

      transaction.feePayer = senderPubKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      const signature = await connection.sendTransaction(transaction, [keypair]);
      
      toast.promise(
        connection.confirmTransaction({
          blockhash,
          lastValidBlockHeight,
          signature,
        }, "confirmed"),
        {
          loading: "Confirming transaction on-chain...",
          success: () => {
            fetchBalance(sendingAccount.publicKey);
            setSendingAccount(null);
            setRecipientAddress("");
            setSendAmount("");
            return (
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-sm">Transaction Confirmed!</span>
                <a
                  href={`https://explorer.solana.com/tx/${signature}?cluster=${network}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                >
                  View on Solana Explorer <ExternalLink className="size-3" />
                </a>
              </div>
            );
          },
          error: "Transaction confirmation failed",
        }
      );
    } catch (error) {
      console.error("Send SOL transaction error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Transaction failed: ${errorMessage}`);
    } finally {
      setSendingTx(false);
    }
  };

  // Deterministically generate accounts from mnemonic words
  const generateAccounts = (type: "BTC" | "ETH" | "SOL") => {
    const mnemonics = mnemonicWords.join(" ").trim();
    if (!mnemonics) {
      toast.error("No mnemonics found. Generate or import a phrase first.");
      return;
    }

    let privateKey = "";
    let publicKey = "";
    let acIdx = 0;

    try {
      if (type === "SOL") {
        const seed = mnemonicToSeedSync(mnemonics);
        const path = `m/44'/501'/0'/${solAc.current}'`;
        acIdx = solAc.current;
        solAc.current++;

        const derived = derivePath(path, seed.toString("hex")).key;
        const { secretKey } = nacl.sign.keyPair.fromSeed(derived);
        const keyPair = Keypair.fromSecretKey(secretKey);
        privateKey = bs58.encode(secretKey);
        publicKey = keyPair.publicKey.toBase58();
      } else if (type === "ETH") {
        const path = `m/44'/60'/0'/0/${ethAc.current}`;
        acIdx = ethAc.current;
        ethAc.current++;

        const wallet = HDNodeWallet.fromPhrase(mnemonics, undefined, path);
        privateKey = wallet.privateKey;
        publicKey = wallet.address;
      } else if (type === "BTC") {
        const path = `m/44'/0'/0'/0/${btcAc.current}`;
        acIdx = btcAc.current;
        btcAc.current++;

        const wallet = HDNodeWallet.fromPhrase(mnemonics, undefined, path);
        privateKey = wallet.privateKey;
        publicKey = deriveBitcoinAddress(wallet.signingKey.publicKey);
      } else {
        toast.error("Account type is not defined");
        return;
      }

      const newAccount: Account = {
        type,
        publicKey,
        privateKey,
        index: acIdx,
      };
      const updatedAccounts = [...accounts, newAccount];
      setAccounts(updatedAccounts);
      localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
      toast.success(`${type} account derived successfully!`);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      toast.error(`Key derivation failed: ${errorMessage}`);
    }
  };

  // Reset wallet state completely
  const clearWallet = () => {
    localStorage.removeItem("mnemonics");
    localStorage.removeItem("accounts");
    setMnemonicWords([]);
    setAccounts([]);
    setBalances({});
    btcAc.current = 0;
    solAc.current = 0;
    ethAc.current = 0;
    toast.success("Wallet wiped successfully.");
  };

  return (
    <div className="flex flex-col min-h-screen items-center bg-background text-foreground transition-all duration-300">
      <header className="container w-full flex flex-col items-center">
        <Navbar />
      </header>
      <main className="max-w-5xl container flex flex-col items-center p-4 md:p-6 w-full">
        {/* Top bar with Welcome and Controls */}
        <div className="container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 mb-8">
          <div className="flex flex-col items-start justify-center">
            <h1 className="leading-8 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              Tree Ledger Dashboard
            </h1>
            <span className="leading-6 text-sm text-muted-foreground font-medium mt-1">
              Hierarchical Deterministic Wallet Generator & Explorer
            </span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Solana Network Selector */}
            <Select value={network} onValueChange={handleNetworkChange}>
              <SelectTrigger className="w-[150px] bg-secondary/50 border-muted-foreground/10 hover:border-muted-foreground/30 transition-all font-semibold">
                <SelectValue placeholder="Network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mainnet-beta" className="font-medium">Mainnet Beta</SelectItem>
                <SelectItem value="devnet" className="font-medium">Devnet</SelectItem>
                <SelectItem value="testnet" className="font-medium">Testnet</SelectItem>
              </SelectContent>
            </Select>

            {/* Mnemonic Manage Trigger */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-muted-foreground/10 hover:border-muted-foreground/30 bg-secondary/40 font-semibold transition-all">
                  {mnemonicWords.length === 0 ? "Setup Wallet" : "Mnemonic Phrase"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogTitle className="text-xl font-bold tracking-tight">
                  {mnemonicWords.length === 0 ? "Initialize Wallet Seed" : "Your Mnemonic Phrase"}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Your seed phrase acts as the root of your wallet hierarchy. Keep it private.
                </DialogDescription>
                <MnemonicsDialog
                  mnemonicsWords={mnemonicWords}
                  setMnemonicWords={setMnemonicWords}
                  clearWallet={clearWallet}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* List of Derived Accounts */}
        <div className="container w-full">
          <AccountsList
            accounts={accounts}
            generateAccounts={generateAccounts}
            balances={balances}
            loadingBalances={loadingBalances}
            fetchBalance={fetchBalance}
            requestAirdrop={requestAirdrop}
            airdropLoading={airdropLoading}
            network={network}
            onSendClick={setSendingAccount}
            onTxHistoryClick={setViewingTxAccount}
          />
        </div>
      </main>

      {/* Sending Dialog */}
      <Dialog
        open={sendingAccount !== null}
        onOpenChange={(open) => !open && setSendingAccount(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Send className="size-5 text-primary" />
            <span>Send SOL</span>
          </DialogTitle>
          <DialogDescription>
            Send Solana from your derived address to another recipient on {network === "mainnet-beta" ? "Mainnet" : network}.
          </DialogDescription>
          {sendingAccount && (
            <div className="space-y-4 my-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="sender" className="text-xs font-semibold text-muted-foreground">
                  Sender Address (Index {sendingAccount.index})
                </Label>
                <Input
                  id="sender"
                  value={sendingAccount.publicKey}
                  readOnly
                  className="bg-secondary/40 font-mono text-xs border-muted-foreground/10"
                />
                <span className="text-[10px] text-muted-foreground/80 self-end mt-0.5">
                  Available: {balances[sendingAccount.publicKey]?.toFixed(5) || "0.00000"} SOL
                </span>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="recipient" className="text-xs font-semibold text-muted-foreground">
                  Recipient SOL Address
                </Label>
                <Input
                  id="recipient"
                  placeholder="Paste destination public key..."
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="font-mono text-xs border-muted-foreground/20"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground">
                  Amount (SOL)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  step="any"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="border-muted-foreground/20"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setSendingAccount(null);
                setRecipientAddress("");
                setSendAmount("");
              }}
              disabled={sendingTx}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTransaction}
              disabled={sendingTx}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-1.5"
            >
              {sendingTx ? "Sending..." : "Send Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction History Dialog */}
      <Dialog
        open={viewingTxAccount !== null}
        onOpenChange={(open) => !open && setViewingTxAccount(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <History className="size-5 text-primary" />
            <span>Transaction History</span>
          </DialogTitle>
          <DialogDescription>
            Displaying the last 5 confirmed signatures on Solana {network === "mainnet-beta" ? "Mainnet" : network}.
          </DialogDescription>
          
          <div className="my-3 space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {loadingTx ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-3">
                <RefreshCw className="size-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground font-medium">Fetching signatures...</span>
              </div>
            ) : txHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-secondary/15 rounded-lg border border-dashed border-muted-foreground/10">
                <span className="text-sm font-semibold text-muted-foreground mb-1">No Transactions Found</span>
                <span className="text-xs text-muted-foreground/80 max-w-[250px]">
                  This account has no recent transaction history on this cluster.
                </span>
              </div>
            ) : (
              txHistory.map((tx, idx) => {
                const isFailed = tx.err !== null;
                const formattedTime = tx.blockTime
                  ? new Date(tx.blockTime * 1000).toLocaleString()
                  : "Pending/Unknown";

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 bg-secondary/30 rounded-lg border border-muted-foreground/10 hover:border-muted-foreground/25 transition-all group"
                  >
                    <div className="flex items-start gap-2.5">
                      {isFailed ? (
                        <XCircle className="size-4.5 text-rose-500 mt-0.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="size-4.5 text-emerald-500 mt-0.5 shrink-0" />
                      )}
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {tx.signature.slice(0, 10)}...{tx.signature.slice(-10)}
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {formattedTime} • Slot {tx.slot}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=${network}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-all"
                      title="View on Explorer"
                    >
                      <ArrowUpRight className="size-4" />
                    </a>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewingTxAccount(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletGenerator;
