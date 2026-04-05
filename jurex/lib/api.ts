const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-service-sand.vercel.app";

export interface Case {
  id: string;
  plaintiff: string;
  defendant: string;
  status: "pending" | "active" | "resolved" | "appealed";
  stake: string;
  category: string;
  createdAt: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "critical";
}

export interface Agent {
  id: string;
  name: string;
  address: string;
  reputation: number;
  status: "active" | "inactive" | "banned";
  category: string;
  riskScore: number;
  trustTier: "verified" | "standard" | "probation" | "banned";
  joinedAt?: string;
  lastActive?: string;
  description?: string;
  record?: {
    casesFiled: number;
    casesAgainst: number;
    casesWon: number;
    casesLost: number;
    violations: Violation[];
    sanctions: Sanction[];
  };
}

export interface Violation {
  code: string;
  description: string;
  date: string;
  severity: "low" | "medium" | "high" | "critical";
  resolved: boolean;
}

export interface Sanction {
  type: "warning" | "suspension" | "ban";
  reason: string;
  issuedAt: string;
  expiresAt?: string;
  active: boolean;
}

export interface Reputation {
  address: string;
  score: number;
  totalCases: number;
  winRate: number;
}

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Try to get error message from response
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
}

// Cases API
export const casesAPI = {
  getAll: async (): Promise<Case[]> => {
    try {
      return await fetchAPI("/cases");
    } catch {
      // Return empty array on error, let component handle fallback
      return [];
    }
  },
  
  getById: async (id: string): Promise<Case | null> => {
    try {
      return await fetchAPI(`/cases/${id}`);
    } catch {
      return null;
    }
  },
  
  getByAgent: async (address: string): Promise<Case[]> => {
    try {
      return await fetchAPI(`/cases/agent/${address}`);
    } catch {
      return [];
    }
  },
  
  fileCase: async (data: {
    plaintiff: string;
    defendant: string;
    stake: string;
    category: string;
    description: string;
  }): Promise<{ caseId: string }> => {
    return fetchAPI("/agent/file-case", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Agents API
export const agentsAPI = {
  getAll: async (): Promise<Agent[]> => {
    try {
      return await fetchAPI("/agent/discover");
    } catch {
      return [];
    }
  },
  
  getByAddress: async (address: string): Promise<Agent | null> => {
    try {
      return await fetchAPI(`/agent/${address}`);
    } catch {
      return null;
    }
  },
  
  getReputation: async (address: string): Promise<Reputation | null> => {
    try {
      return await fetchAPI(`/agent/reputation/${address}`);
    } catch {
      return null;
    }
  },
  
  getCriminalRecord: async (address: string): Promise<{
    violations: Violation[];
    sanctions: Sanction[];
    riskScore: number;
    trustTier: string;
  } | null> => {
    try {
      return await fetchAPI(`/agent/record/${address}`);
    } catch {
      return null;
    }
  },
};

// Dispute API
export const disputeAPI = {
  verifyTransaction: async (data: { txHash: string; caseId: string }) => {
    return fetchAPI("/cases/verify-tx", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// Validation API
export const validationAPI = {
  getPending: async (): Promise<Case[]> => {
    try {
      return await fetchAPI("/validate/pending");
    } catch {
      return [];
    }
  },
  
  submitVote: async (data: {
    caseId: string;
    validator: string;
    vote: "plaintiff" | "defendant";
    reasoning: string;
  }) => {
    return fetchAPI("/validate/vote", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  
  getValidatorStats: async (address: string) => {
    try {
      return await fetchAPI(`/validate/stats/${address}`);
    } catch {
      return null;
    }
  },
};

// Stats API
export const statsAPI = {
  getOverview: async () => {
    try {
      return await fetchAPI("/stats/overview");
    } catch {
      return null;
    }
  },
};
