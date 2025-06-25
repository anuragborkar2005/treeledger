"use client";
import { Button } from "@/components/ui/button";
import { generateMnemonic } from "bip39";
import { copyToClipboard } from "@/lib/utils";

type MnemonicsDisplayProps = {
  mnemonicsWords: string[];
  setMnemonicWords: (words: string[]) => void;
};

const MnemonicsDialog = ({
  mnemonicsWords,
  setMnemonicWords,
}: MnemonicsDisplayProps) => {
  const generateRandom = () => {
    const words = generateMnemonic(128);
    localStorage.setItem("mnemonics", JSON.stringify(words.split(" ")));
    setMnemonicWords(words.split(" "));
  };

  return (
    <div>
      {mnemonicsWords.length !== 0 ? (
        <div className="flex flex-col items-center p-4">
          <div className="container grid grid-cols-3 grid-rows-4 gap-4">
            {mnemonicsWords.map((item, index) => (
              <div
                key={index}
                className="w-30 text-sm text-center font-medium px-4 py-2 bg-gray-300 dark:bg-secondary outline-1 outline-accent rounded-md"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-4 container">
            <Button
              className="bg-secondary"
              variant="outline"
              onClick={() => copyToClipboard(mnemonicsWords.join(" "))}
            >
              Copy to Clipboard
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <Button
            variant="outline"
            className="bg-black dark:bg-white text-white dark:text-black dark:hover:bg-gray-900  dark:hover:text-gray-100"
            onClick={() => generateRandom()}
          >
            Generate Mnemonics
          </Button>
        </div>
      )}
    </div>
  );
};

export default MnemonicsDialog;
