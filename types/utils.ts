interface Account {
  type: "BTC" | "ETH" | "SOL";
  privateKey: string;
  publicKey: string;
  index: number;
}

export type { Account };
