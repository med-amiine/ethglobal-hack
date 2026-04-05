"use client";

import { useState, useEffect } from "react";
import { casesAPI, agentsAPI, validationAPI, statsAPI, type Case, type Agent, type Reputation } from "./api";

// Cases Hook
export function useCases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCases() {
      try {
        setIsLoading(true);
        const data = await casesAPI.getAll();
        setCases(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch cases");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCases();
  }, []);

  return { cases, isLoading, error };
}

// Single Case Hook
export function useCase(id: string) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCase() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const data = await casesAPI.getById(id);
        setCaseData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch case");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCase();
  }, [id]);

  return { case: caseData, isLoading, error };
}

// Agents Hook
export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgents() {
      try {
        setIsLoading(true);
        const data = await agentsAPI.getAll();
        setAgents(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch agents");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgents();
  }, []);

  return { agents, isLoading, error };
}

// Single Agent Hook
export function useAgent(address: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgent() {
      if (!address) return;
      
      try {
        setIsLoading(true);
        const data = await agentsAPI.getByAddress(address);
        setAgent(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch agent");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgent();
  }, [address]);

  return { agent, isLoading, error };
}

// Agent Reputation Hook
export function useAgentReputation(address: string) {
  const [reputation, setReputation] = useState<Reputation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReputation() {
      if (!address) return;
      
      try {
        setIsLoading(true);
        const data = await agentsAPI.getReputation(address);
        setReputation(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch reputation");
      } finally {
        setIsLoading(false);
      }
    }

    fetchReputation();
  }, [address]);

  return { reputation, isLoading, error };
}

// Agent Criminal Record Hook
export function useAgentRecord(address: string) {
  const [record, setRecord] = useState<{
    violations: Array<{
      code: string;
      description: string;
      date: string;
      severity: "low" | "medium" | "high" | "critical";
      resolved: boolean;
    }>;
    sanctions: Array<{
      type: "warning" | "suspension" | "ban";
      reason: string;
      issuedAt: string;
      expiresAt?: string;
      active: boolean;
    }>;
    riskScore: number;
    trustTier: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecord() {
      if (!address) return;
      
      try {
        setIsLoading(true);
        const data = await agentsAPI.getCriminalRecord(address);
        setRecord(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch record");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecord();
  }, [address]);

  return { record, isLoading, error };
}

// Pending Validations Hook
export function usePendingValidations() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPending() {
      try {
        setIsLoading(true);
        const data = await validationAPI.getPending();
        setCases(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch validations");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPending();
  }, []);

  return { cases, isLoading, error };
}

// Stats Hook
export function useStats() {
  const [stats, setStats] = useState({
    totalCases: 128,
    activeCases: 42,
    pendingCases: 23,
    resolvedCases: 63,
    registeredAgents: 3429,
    verifiedAgents: 2891,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        const data = await statsAPI.getOverview();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch stats");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  return { stats, isLoading, error };
}
