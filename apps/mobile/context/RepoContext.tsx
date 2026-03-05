import React, { createContext, useContext, useEffect, useState } from "react";
import { storage } from "@/lib/storage";

const CLAUDE_KEY = "claude_api_key";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  owner: { login: string; avatar_url?: string };
}

interface RepoContextValue {
  selectedRepo: Repo | null;
  selectedBranch: { name: string; sha: string } | null;
  patches: string[];
  claudeApiKey: string | null;
  setSelectedRepo: (r: Repo | null) => void;
  setSelectedBranch: (b: { name: string; sha: string } | null) => void;
  setPatches: (p: string[]) => void;
  setClaudeApiKey: (k: string | null) => void;
  loadClaudeKey: () => Promise<void>;
  saveClaudeKey: (k: string) => Promise<void>;
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<{ name: string; sha: string } | null>(null);
  const [patches, setPatches] = useState<string[]>([]);
  const [claudeApiKey, setClaudeApiKeyState] = useState<string | null>(null);

  const loadClaudeKey = async () => {
    try {
      const k = await SecureStore.getItemAsync(CLAUDE_KEY);
      setClaudeApiKeyState(k);
    } catch {
      setClaudeApiKeyState(null);
    }
  };

  useEffect(() => {
    loadClaudeKey();
  }, []);

  const setClaudeApiKey = async (k: string | null) => {
    try {
      if (k) await storage.setItem(CLAUDE_KEY, k);
      else await storage.deleteItem(CLAUDE_KEY);
    } catch {}
    setClaudeApiKeyState(k);
  };

  const saveClaudeKey = async (k: string) => {
    await setClaudeApiKey(k);
  };

  return (
    <RepoContext.Provider
      value={{
        selectedRepo,
        selectedBranch,
        patches,
        claudeApiKey,
        setSelectedRepo,
        setSelectedBranch,
        setPatches,
        setClaudeApiKey,
        loadClaudeKey,
        saveClaudeKey,
      }}
    >
      {children}
    </RepoContext.Provider>
  );
}

export function useRepo() {
  const ctx = useContext(RepoContext);
  if (!ctx) throw new Error("useRepo must be used within RepoProvider");
  return ctx;
}
