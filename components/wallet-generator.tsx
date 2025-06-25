"use client";
import React from "react";
import Navbar from "./navbar";
import { Button } from "@/components/ui/button";
import AccountsList from "./accounts-list";
import { Dialog, DialogTitle } from "@radix-ui/react-dialog";
import { DialogContent, DialogDescription, DialogTrigger } from "./ui/dialog";
import MnemonicsDialog from "./mnemonics-dialog";
import { toast } from "sonner";
import type { Account } from "@/types/utils";
import nacl from "tweetnacl";
import { mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const WalletGenerator = () => {
  const [mnemonicWords, setMnemonicWords] = React.useState<string[]>([]);
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const btcAc = React.useRef(0);
  const solAc = React.useRef(0);
  const ethAc = React.useRef(0);

  const pathType = {
    BTC: 0,
    ETH: 60,
    SOL: 501,
  };

  React.useEffect(() => {
    const storedWords = localStorage.getItem("mnemonics");
    const storedAccounts = localStorage.getItem("accounts");

    let parsedAccounts: Account[] = [];
    if (storedAccounts) {
      try {
        parsedAccounts = JSON.parse(storedAccounts);
      } catch {
        parsedAccounts = [];
      }
    }

    const solAccounts = parsedAccounts.filter(
      (acc: Account) => acc.type === "SOL"
    );
    const ethAccounts = parsedAccounts.filter(
      (acc: Account) => acc.type === "ETH"
    );
    const btcAccounts = parsedAccounts.filter(
      (acc: Account) => acc.type === "BTC"
    );

    btcAc.current = btcAccounts.length;
    solAc.current = solAccounts.length;
    ethAc.current = ethAccounts.length;

    if (storedWords) {
      setMnemonicWords(JSON.parse(storedWords));
      setAccounts(parsedAccounts);
    }
  }, []);

  const generateAccounts = (type: "BTC" | "ETH" | "SOL") => {
    const mnemonics = mnemonicWords.join(" ").trim();
    if (!mnemonics) {
      toast("No mnemonics found");
      return;
    }
    const seed = mnemonicToSeedSync(mnemonics);

    let path = "";
    let acIdx = 0;
    if (type === "BTC") {
      path = `m/44'/${pathType[type]}'/0'/${btcAc.current}'`;
      acIdx = btcAc.current;
      btcAc.current++;
    } else if (type === "ETH") {
      path = `m/44'/${pathType[type]}'/0'/${ethAc.current}'`;
      acIdx = ethAc.current;
      ethAc.current++;
    } else if (type === "SOL") {
      path = `m/44'/${pathType[type]}'/0'/${solAc.current}'`;
      acIdx = solAc.current;
      solAc.current++;
    } else {
      toast("Account type is not defined");
      return;
    }

    const derived = derivePath(path, seed.toString("hex")).key;
    const { secretKey } = nacl.sign.keyPair.fromSeed(derived);
    const keyPair = Keypair.fromSecretKey(secretKey);
    const privateKey = bs58.encode(secretKey);
    const publicKey = keyPair.publicKey.toBase58();

    const newAccount: Account = {
      type,
      publicKey,
      privateKey,
      index: acIdx,
    };
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem("accounts", JSON.stringify(updatedAccounts));
    toast(`${type} account generated!`);
  };

  return (
    <div className="flex flex-col min-h-screen items-center">
      <header className="container flex flex-col items-center">
        <Navbar />
      </header>
      <main className="max-w-5xl container flex flex-col items-center  p-4">
        <div className="container flex items-center justify-between">
          <div className="flex flex-col items-start justify-center">
            <h1 className="leading-8 text-3xl font-extrabold">
              Welcome to Tree Ledger
            </h1>
            <span className="leading-8 text-gray-800 font-semibold dark:text-gray-400">
              Create your blockchain wallet
            </span>
          </div>
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Show Mnemonics</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogTitle className="text-xl font-bold">
                  Mnemonics Words
                </DialogTitle>
                <DialogDescription className="text-md text-gray-700 dark:text-gray-400">
                  Make sure to copy mnemonics and save it.
                </DialogDescription>
                <MnemonicsDialog
                  mnemonicsWords={mnemonicWords}
                  setMnemonicWords={setMnemonicWords}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="container">
          <AccountsList
            accounts={accounts}
            generateAccounts={generateAccounts}
          />
        </div>
      </main>
    </div>
  );
};

export default WalletGenerator;
