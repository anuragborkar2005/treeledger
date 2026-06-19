"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { generateMnemonic, validateMnemonic } from "bip39";
import { copyToClipboard } from "@/lib/utils";
import { toast } from "sonner";

type MnemonicsDisplayProps = {
  mnemonicsWords: string[];
  setMnemonicWords: (words: string[]) => void;
  clearWallet: () => void;
};

const MnemonicsDialog = ({
  mnemonicsWords,
  setMnemonicWords,
  clearWallet,
}: MnemonicsDisplayProps) => {
  const [importText, setImportText] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"generate" | "import">("generate");

  const generateRandom = () => {
    const words = generateMnemonic(128);
    const wordsArray = words.split(" ");
    localStorage.setItem("mnemonics", JSON.stringify(wordsArray));
    setMnemonicWords(wordsArray);
    toast.success("New mnemonic generated successfully!");
  };

  const handleImport = () => {
    const cleanMnemonic = importText.trim().replace(/\s+/g, " ");
    if (!cleanMnemonic) {
      toast.error("Please enter a mnemonic phrase");
      return;
    }

    const isValid = validateMnemonic(cleanMnemonic);
    if (!isValid) {
      toast.error("Invalid BIP39 mnemonic phrase. Please check the words and spacing.");
      return;
    }

    const wordsArray = cleanMnemonic.split(" ");
    localStorage.setItem("mnemonics", JSON.stringify(wordsArray));
    setMnemonicWords(wordsArray);
    toast.success("Wallet imported successfully!");
  };

  return (
    <div className="space-y-6">
      {mnemonicsWords.length !== 0 ? (
        <div className="flex flex-col items-center">
          <div className="w-full grid grid-cols-3 gap-3">
            {mnemonicsWords.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm font-medium px-3 py-2.5 bg-secondary/80 border border-muted-foreground/10 rounded-md relative select-none"
              >
                <span className="text-[10px] text-muted-foreground absolute left-1.5 top-1/2 -translate-y-1/2">
                  {index + 1}
                </span>
                <span className="w-full text-center pl-2 font-mono">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex w-full gap-3">
            <Button
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
              variant="outline"
              onClick={() => copyToClipboard(mnemonicsWords.join(" "))}
            >
              Copy to Clipboard
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm("Are you sure you want to reset your wallet? All generated accounts and keys will be permanently removed from this browser. Make sure you have backed up your seed phrase!")) {
                  clearWallet();
                }
              }}
            >
              Reset Wallet
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex border-b border-muted">
            <button
              onClick={() => setActiveTab("generate")}
              className={`flex-1 pb-3 text-sm font-semibold transition-all ${
                activeTab === "generate"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Generate Wallet
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`flex-1 pb-3 text-sm font-semibold transition-all ${
                activeTab === "import"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Import Seed Phrase
            </button>
          </div>

          {activeTab === "generate" ? (
            <div className="flex flex-col items-center py-4 space-y-4">
              <p className="text-sm text-center text-muted-foreground leading-relaxed">
                Generate a new secure 12-word recovery phrase to start building your Tree Ledger HD Wallet.
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
                onClick={generateRandom}
              >
                Generate Mnemonic
              </Button>
            </div>
          ) : (
            <div className="flex flex-col space-y-4 py-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your 12 or 24-word recovery phrase (separated by spaces) to restore your wallet.
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="secret phrase words go here..."
                rows={4}
                className="w-full p-3 rounded-md border border-input bg-transparent font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring resize-none"
              />
              <Button
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
                onClick={handleImport}
              >
                Import Wallet
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MnemonicsDialog;
