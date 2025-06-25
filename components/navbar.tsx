import { WalletCardsIcon } from "lucide-react";
import React from "react";
import ThemeToggle from "./theme-button";
import { Separator } from "./ui/separator";

const Navbar = () => {
  return (
    <nav className="container sticky flex flex-col h-16 py-4 gap-4">
      <div className="max-w-5xl container flex items-center justify-between mx-auto">
        <div className="flex items-end gap-2">
          <WalletCardsIcon className="size-8" />
          <span className="ml-2 text-3xl font-extrabold">Tree Ledger</span>
        </div>
        <div className="flex items-end justify-center">
          <ThemeToggle />
        </div>
      </div>
      <Separator />
    </nav>
  );
};

export default Navbar;
