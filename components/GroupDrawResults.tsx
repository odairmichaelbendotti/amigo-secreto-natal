"use client";

import { useEffect, useState } from "react";
import DrawResults, { type DrawAssignment } from "@/components/DrawResults";

export default function GroupDrawResults({ groupId }: { groupId: string }) {
  const [assignments, setAssignments] = useState<DrawAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/assignments?groupId=${encodeURIComponent(groupId)}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok || !data.finishedAt) throw new Error(data.error || "O resultado completo ainda não foi liberado");
        setAssignments(data.assignments);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Não foi possível carregar o resultado");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [groupId]);

  if (loading) return <div className="ui-loading">Carregando resultado final...</div>;
  if (error) return <p role="alert" className="ui-alert">{error}</p>;
  return <DrawResults assignments={assignments} wishlistsEnabled={false} finished />;
}
