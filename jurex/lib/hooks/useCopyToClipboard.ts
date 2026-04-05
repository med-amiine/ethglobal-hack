import { useState } from "react";
import { copyToClipboard } from "@/lib/utils";

/**
 * Hook for copy-to-clipboard with feedback
 */
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      // Reset after 1.5 seconds
      setTimeout(() => setCopied(false), 1500);
    }
    return success;
  };

  return { copy, copied };
}
