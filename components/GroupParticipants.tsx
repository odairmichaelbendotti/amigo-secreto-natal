"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Ui";
import WishlistSuggestions, { type WishlistSuggestion } from "@/components/WishlistSuggestions";

interface Participant { id: string; name: string; isAdmin: boolean; wishlistItems?: WishlistSuggestion[] }

export default function GroupParticipants({ groupId, personId, wishlistsEnabled = true }: { groupId: string; personId: string; wishlistsEnabled?: boolean }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [listsVisible, setListsVisible] = useState(true);
  const requestController = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    const { signal } = controller;
    setRefreshing(true);
    try {
      const response = await fetch(`/api/groups/${encodeURIComponent(groupId)}/participants`, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar os participantes");
      if (signal.aborted) return;
      setParticipants(data.participants);
      setListsVisible(data.wishlistsEnabled !== false);
      setError("");
    } catch (error) {
      if (signal.aborted) return;
      setParticipants([]);
      setError(error instanceof Error ? error.message : "Não foi possível carregar os participantes");
    } finally {
      if (!signal.aborted) { setLoading(false); setRefreshing(false); }
    }
  }, [groupId]);

  useEffect(() => {
    void load();
    const onFocus = () => { void load(); };
    const timer = window.setInterval(onFocus, 5000);
    window.addEventListener("focus", onFocus);
    return () => { requestController.current?.abort(); window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [load]);

  return <section className="ui-panel" aria-labelledby="group-participants-heading">
    <div className="panel-heading"><h2 id="group-participants-heading">Quem já está participando{!loading && !error && ` (${participants.length})`}</h2><button type="button" disabled={refreshing} aria-busy={refreshing} onClick={() => void load()} className="ui-btn ui-btn-secondary ui-btn-small">{refreshing ? "Atualizando..." : "Atualizar lista"}</button></div>
    <p className="panel-copy">{wishlistsEnabled && listsVisible ? "Veja os desejos de todos do grupo. Você pode consultar qualquer lista, mesmo antes do sorteio." : "Veja quem já confirmou presença neste amigo secreto. Aqui aparecem as participações aprovadas pelo administrador."}</p>
    {loading ? <div className="ui-loading">Carregando participantes...</div> : error ? <p role="alert" className="ui-alert">{error}</p> : participants.length === 0 ? <div className="ui-empty"><Icon name="groups" /><p>Ainda não há participantes aprovados neste grupo.</p></div> : <ul className="participants-grid" aria-label="Participantes aprovados">{participants.map(participant => <li key={participant.id} className="participant-card">
      <span className="avatar">{participant.name.trim().slice(0, 1).toUpperCase()}</span>
      <div className="participant-card-info"><strong>{participant.name}</strong><span>{participant.id === personId ? "Você" : "Participante"}</span></div>
      {participant.isAdmin && <span className="ui-pill">Administrador</span>}
      {wishlistsEnabled && listsVisible && <div className="participant-wishes"><h3>Lista de desejos</h3><WishlistSuggestions items={participant.wishlistItems} name={participant.name} /></div>}
    </li>)}</ul>}
  </section>;
}
