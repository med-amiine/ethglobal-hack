import { useState } from "react";
import { copyToClipboard } from "@/lib/utils";

/**
 * Hook for copy-to-clipboard with feedback
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await copyToClipboard(text);
      setCopied(true);
      // Reset after 1.5 seconds
      setTimeout(() => setCopied(false), 1500);
      return true;
    } catch {
      return false;
    }
  };

  return { copy, copied };
}
