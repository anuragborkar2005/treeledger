import React from "react";
import { Button } from "@/components/ui/button";
import { EyeOff, Eye } from "lucide-react";

type ToggleTextProps = {
  secret: string;
};

const ToggleText = ({ secret }: ToggleTextProps) => {
  const [visible, setVisible] = React.useState<boolean>(false);
  return (
    <div className="container flex items-center justify-between mr-4">
      <div>
        {!visible ? (
          <span className="text-xl font-mono tracking-wide">
            {"*".repeat(32)}
          </span>
        ) : (
          <span className="text-sm font-mono overflow-hidden text-ellipsis tracking-wider  whitespace-nowrap max-w-[460px] block">
            {secret}
          </span>
        )}
      </div>
      <Button variant="ghost" onClick={() => setVisible(!visible)}>
        {visible ? <EyeOff className="size-6" /> : <Eye className="size-6" />}
      </Button>
    </div>
  );
};

export default ToggleText;
