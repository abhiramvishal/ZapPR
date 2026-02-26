import { create } from "zustand";
import type { Repo } from "./api";

interface RepoState {
  repo: Repo | null;
  branch: { name: string; sha: string } | null;
  patch: string | null;
  setRepo: (r: Repo | null) => void;
  setBranch: (b: { name: string; sha: string } | null) => void;
  setPatch: (p: string | null) => void;
}

export const useRepoStore = create<RepoState>((set) => ({
  repo: null,
  branch: null,
  patch: null,
  setRepo: (repo) => set({ repo }),
  setBranch: (branch) => set({ branch }),
  setPatch: (patch) => set({ patch }),
}));
