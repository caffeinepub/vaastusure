import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob } from "../backend";
import type { AnalysisRecord } from "../backend";
import { useActor } from "./useActor";

export function useGetUserAnalyses() {
  const { actor, isFetching } = useActor();
  return useQuery<AnalysisRecord[]>({
    queryKey: ["userAnalyses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserAnalyses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateAnalysis() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<string, Error, { name: string; imageBytes?: Uint8Array }>({
    mutationFn: async ({ name, imageBytes }) => {
      if (!actor) throw new Error("Not authenticated");
      let blob: ExternalBlob | null = null;
      if (imageBytes) {
        blob = ExternalBlob.fromBytes(imageBytes as Uint8Array<ArrayBuffer>);
      }
      return actor.createAnalysis(name, blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAnalyses"] });
    },
  });
}

export function useUpdateAnalysis() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; record: AnalysisRecord }>({
    mutationFn: async ({ id, record }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateAnalysis(id, record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAnalyses"] });
    },
  });
}

export function useDeleteAnalysis() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteAnalysis(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAnalyses"] });
    },
  });
}
