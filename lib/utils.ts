import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const copyToClipboard = (words: string) => {
  navigator.clipboard.writeText(words).then(() => {
    toast("Copied to Clipboard");
  });
};
