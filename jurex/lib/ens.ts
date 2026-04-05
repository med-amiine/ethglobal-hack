/**
 * ENS offchain resolver for agent identity
 * Implements simple JSON lookup for *.jurex.eth subnames
 */

export interface AgentENS {
  name: string;
  address: string;
  erc8004Score: number;
  casesWon: number;
  casesLost: number;
  registeredAt: string;
}

/**
 * Validate agent ENS name (alphanumeric, 3-20 chars)
 */
export function validateENSName(name: string): boolean {
  return /^[a-z0-9]{3,20}$/.test(name.toLowerCase());
}

/**
 * Resolve agent by ENS name
 */
export async function resolveAgent(
  ensName: string
): Promise<AgentENS | null> {
  // Remove .jurex.eth suffix if present
  const name = ensName.replace(/\.jurex\.eth$/i, "");

  if (!validateENSName(name)) {
    return null;
  }

  // In production, fetch from offchain resolver
  // For hackathon, would call API endpoint
  return null;
}

/**
 * Register agent on ENS
 */
export async function registerAgent(
  name: string,
  address: string,
  erc8004Score: number = 500
): Promise<{ success: boolean; ensName: string }> {
  if (!validateENSName(name)) {
    throw new Error("Invalid ENS name format");
  }

  return {
    success: true,
    ensName: `${name}.jurex.eth`,
  };
}

/**
 * Format ENS name for display
 */
export function formatENSName(name: string): string {
  return `${name}.jurex.eth`;
}

/**
 * Extract agent name from ENS
 */
export function extractAgentName(ensName: string): string {
  return ensName.replace(/\.jurex\.eth$/i, "");
}
