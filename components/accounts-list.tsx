import React from "react";
import { Button } from "./ui/button";
import { PlusIcon } from "lucide-react";
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
};

const AccountsList = ({ accounts, generateAccounts }: AccountListProps) => {
  const [open, setOpen] = React.useState<boolean>(false);

  return (
    <div className="max-w-5xl container flex flex-col items-center mt-12">
      <div className="container flex items-center justify-between">
        <span className="text-xl font-bold">Your Accounts</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PlusIcon />
              <span>Add Wallet</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="text-xl font-bold">
              Choose Blockchain
            </DialogTitle>
            <DialogDescription>
              Choose Blockchain to create your wallet account.
            </DialogDescription>
            <div className="space-y-4">
              {(["BTC", "ETH", "SOL"] as const).map((type) => (
                <div
                  key={type}
                  className="flex flex-1 space-x-2 items-center bg-secondary p-4 rounded-md"
                  onClick={() => {
                    generateAccounts(type);
                    setOpen(false);
                  }}
                >
                  <TokenIcon
                    symbol={type.toLowerCase()}
                    variant="branded"
                    size="64"
                  />
                  <span>
                    {type === "BTC"
                      ? "BITCOIN"
                      : type === "ETH"
                      ? "ETHEREUM"
                      : "SOLANA"}
                  </span>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="container flex flex-col gap-2 space-y-4 mt-8">
        {accounts.length !== 0 ? (
          accounts.map(({ type, privateKey, publicKey }, index) => (
            <div
              key={index}
              className="container flex flex-col bg-accent-foreground text-white dark:bg-accent rounded-md p-8 shadow-md"
            >
              <div className="text-xl font-bold mb-4 dark:text-white">
                Account {index + 1}
              </div>
              <Separator />
              <div className="flex items-center gap-2 py-4">
                <TokenIcon
                  symbol={type.toLowerCase()}
                  variant="branded"
                  size="32"
                />
                <span>
                  {type === "BTC"
                    ? "BITCOIN"
                    : type === "ETH"
                    ? "ETHEREUM"
                    : "SOLANA"}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col mt-2">
                  <h3 className="text-md font-semibold">Public Key</h3>
                  <div className="flex items-center justify-between  py-2 rounded-md ">
                    <ToggleText secret={publicKey} />
                    <Button
                      variant="outline"
                      className="text-black dark:text-white "
                      onClick={() => copyToClipboard(publicKey)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col mt-2 ">
                  <h3 className="text-md font-semibold">Private Key</h3>
                  <div className="flex items-center justify-between  py-2 rounded-md ">
                    <ToggleText secret={privateKey} />
                    <Button
                      variant="outline"
                      className="text-black dark:text-white "
                      onClick={() => copyToClipboard(privateKey)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="container flex items-center justify-center">
            No Accounts
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsList;
