import { Loader2 } from "lucide-react";

export default function TextWithLoader({ text }: { text: string }) {
  return (
    <span>
      <Loader2 className="animate-spin" />
      <span>{text}</span>
    </span>
  );
}
