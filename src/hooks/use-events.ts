"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "@/lib/events";

/** Live event feed — polls the RPC for new CreditMesh events every 6s. */
export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => fetchEvents(),
    refetchInterval: 6_000,
    staleTime: 4_000,
  });
}
