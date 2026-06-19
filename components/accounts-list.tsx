import React from "react";
import { Button } from "./ui/button";
import { PlusIcon, RefreshCw, Send, History, Coins, Copy } from "lucide-react";
import { TokenIcon } from "@web3icons/react";
import { Account } from "@/types/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import ToggleText from "./toggle-text";
import { copyToClipboard } from "@/lib/utils";

type AccountListProps = {
  accounts: Account[];
  generateAccounts: (type: "BTC" | "ETH" | "SOL") => void;
  balances: Record<string, number>;
  loadingBalances: Record<string, boolean>;
  fetchBalance: (address: string) => void;
  requestAirdrop: (address: string) => void;
  airdropLoading: Record<string, boolean>;
  network: "mainnet-beta" | "devnet" | "testnet";
  onSendClick: (account: Account) => void;
  onTxHistoryClick: (account: Account) => void;
};

const AccountsList = ({
  accounts,
  generateAccounts,
  balances,
  loadingBalances,
  fetchBalance,
  requestAirdrop,
  airdropLoading,
  network,
  onSendClick,
  onTxHistoryClick,
}: AccountListProps) => {
  const [open, setOpen] = React.useState<boolean>(false);

  // Gradient and design configuration based on coin type
  const cardThemes = {
    SOL: {
      grad: "from-purple-600/10 via-emerald-500/5 to-purple-900/10",
      border: "border-purple-500/20 hover:border-emerald-500/40",
      accent: "from-purple-500 to-emerald-400",
      shadow: "shadow-emerald-500/5",
      btnAccent: "hover:bg-purple-500/20 hover:text-purple-300 border-purple-500/30",
    },
    ETH: {
      grad: "from-blue-600/10 via-indigo-500/5 to-sky-900/10",
      border: "border-blue-500/20 hover:border-indigo-500/40",
      accent: "from-blue-500 to-indigo-400",
      shadow: "shadow-indigo-500/5",
      btnAccent: "hover:bg-blue-500/20 hover:text-blue-300 border-blue-500/30",
    },
    BTC: {
      grad: "from-amber-600/10 via-yellow-500/5 to-amber-900/10",
      border: "border-amber-500/20 hover:border-yellow-500/40",
      accent: "from-amber-500 to-yellow-400",
      shadow: "shadow-yellow-500/5",
      btnAccent: "hover:bg-amber-500/20 hover:text-amber-300 border-amber-500/30",
    },
  };

  return (
    <div className="max-w-5xl container flex flex-col items-center mt-12 px-2">
      <div className="container flex items-center justify-between">
        <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text">
          Your Accounts
        </span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 hover:bg-secondary border-primary/20 hover:border-primary/50 transition-all duration-300">
              <PlusIcon className="size-4" />
              <span>Add Account</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogTitle className="text-xl font-bold">
              Choose Blockchain
            </DialogTitle>
            <DialogDescription>
              Select a blockchain to derive a new deterministic account.
            </DialogDescription>
            <div className="space-y-3 mt-2">
              {(["BTC", "ETH", "SOL"] as const).map((type) => (
                <button
                  key={type}
                  className="flex w-full items-center justify-between bg-secondary/60 hover:bg-secondary/100 border border-muted-foreground/10 hover:border-muted-foreground/30 p-4 rounded-lg transition-all duration-200 group text-left"
                  onClick={() => {
                    generateAccounts(type);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <TokenIcon
                      symbol={type.toLowerCase()}
                      variant="branded"
                      size="40"
                    />
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">
                        {type === "BTC"
                          ? "Bitcoin (BTC)"
                          : type === "ETH"
                          ? "Ethereum (ETH)"
                          : "Solana (SOL)"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {type === "SOL"
                          ? "Ed25519 Curve • Path: m/44'/501'/0'/i'"
                          : type === "ETH"
                          ? "secp256k1 Curve • Path: m/44'/60'/0'/0/i"
                          : "secp256k1 Curve • Path: m/44'/0'/0'/0/i"}
                      </span>
                    </div>
                  </div>
                  <PlusIcon className="size-5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="container flex flex-col gap-6 mt-8">
        {accounts.length !== 0 ? (
          accounts.map((account, index) => {
            const { type, privateKey, publicKey } = account;
            const theme = cardThemes[type] || cardThemes.SOL;
            const formattedBalance =
              type === "SOL"
                ? balances[publicKey] !== undefined
                  ? `${balances[publicKey].toFixed(4)} SOL`
                  : "0.0000 SOL"
                : `0.0000 ${type}`;

            return (
              <div
                key={index}
                className={`container flex flex-col rounded-xl p-6 border transition-all duration-300 hover:shadow-lg backdrop-blur-md bg-gradient-to-br ${theme.grad} ${theme.border} ${theme.shadow}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-background/80 p-2 rounded-lg border border-muted-foreground/10">
                      <TokenIcon
                        symbol={type.toLowerCase()}
                        variant="branded"
                        size="28"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {type === "BTC"
                          ? "Bitcoin"
                          : type === "ETH"
                          ? "Ethereum"
                          : "Solana"}{" "}
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-muted-foreground/15">
                          Index {account.index}
                        </span>
                      </h2>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Account #{index + 1}
                      </p>
                    </div>
                  </div>

                  {/* Balance Section */}
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-muted-foreground font-medium">
                      Balance
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-extrabold tracking-tight">
                        {type === "SOL" && loadingBalances[publicKey] ? (
                          <span className="inline-block h-5 w-16 bg-muted animate-pulse rounded"></span>
                        ) : (
                          formattedBalance
                        )}
                      </span>
                      {type === "SOL" && (
                        <button
                          onClick={() => fetchBalance(publicKey)}
                          disabled={loadingBalances[publicKey]}
                          className="p-1 rounded-md hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                          title="Refresh Balance"
                        >
                          <RefreshCw
                            className={`size-3.5 ${
                              loadingBalances[publicKey] ? "animate-spin" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="opacity-40 my-2" />

                {/* Keys Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {/* Public Key */}
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      Public Address
                    </span>
                    <div className="flex items-center justify-between bg-background/50 hover:bg-background/80 border border-muted-foreground/10 px-3 py-2 rounded-lg transition-all">
                      <ToggleText secret={publicKey} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(publicKey)}
                        title="Copy Address"
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Private Key */}
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      Private Key
                    </span>
                    <div className="flex items-center justify-between bg-background/50 hover:bg-background/80 border border-muted-foreground/10 px-3 py-2 rounded-lg transition-all">
                      <ToggleText secret={privateKey} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(privateKey)}
                        title="Copy Private Key"
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Solana Specific Actions */}
                {type === "SOL" && (
                  <div className="flex flex-wrap gap-2.5 mt-6 justify-end">
                    {network !== "mainnet-beta" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => requestAirdrop(publicKey)}
                        disabled={airdropLoading[publicKey]}
                        className={`flex items-center gap-1.5 transition-all text-xs ${theme.btnAccent}`}
                      >
                        <Coins className="size-3.5" />
                        <span>
                          {airdropLoading[publicKey]
                            ? "Airdropping..."
                            : "Faucet Airdrop"}
                        </span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTxHistoryClick(account)}
                      className={`flex items-center gap-1.5 transition-all text-xs ${theme.btnAccent}`}
                    >
                      <History className="size-3.5" />
                      <span>History</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendClick(account)}
                      className={`flex items-center gap-1.5 transition-all text-xs ${theme.btnAccent}`}
                    >
                      <Send className="size-3.5" />
                      <span>Send SOL</span>
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="container flex flex-col items-center justify-center p-12 border border-dashed border-muted-foreground/20 rounded-xl bg-secondary/20">
            <Coins className="size-12 text-muted-foreground/45 mb-4 stroke-[1.5]" />
            <h3 className="font-bold text-lg mb-1">No Accounts Generated</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Please generate or import mnemonics, and click &quot;Add Account&quot; to create your blockchain addresses.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsList;
