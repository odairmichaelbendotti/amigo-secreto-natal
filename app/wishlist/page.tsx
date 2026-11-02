"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import GroupParticipants from "@/components/GroupParticipants";
import GroupDrawResults from "@/components/GroupDrawResults";
import FruitDecor from "@/components/FruitDecor";
import { resolveGroupTheme, type GroupTheme } from "@/lib/group-theme";
import { Icon } from "@/components/Ui";
import { formatCurrency } from "@/lib/format";

interface WishlistItem {
  id?: string;
  title: string;
  link: string;
}

interface Assignment {
  receiver: {
    name: string;
    wishlistItems: WishlistItem[];
  };
}

export default function Wishlist() {
  const [personId, setPersonId] = useState("");
  const [personName, setPersonName] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState<GroupTheme>("none");
  const [section, setSection] = useState<"participation" | "participants" | "results">("participation");
  const [finishedAt, setFinishedAt] = useState<string | null>(null);
  const [wishlistsEnabled, setWishlistsEnabled] = useState(true);
  const wishlistsEnabledRef = useRef(true);
  const [items, setItems] = useState<WishlistItem[]>([
    { title: "", link: "" },
  ]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [budget, setBudget] = useState<{ amount?: number; currency?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  const loadPersonData = useCallback(async (gId: string, preserveDraft = false) => {
    try {
      const [personRes, groupRes] = await Promise.all([
        fetch("/api/auth/person-data", { cache: "no-store" }),
        fetch(`/api/groups/${gId}`, { cache: "no-store" }),
      ]);
      if (!personRes.ok || !groupRes.ok) throw new Error("load");
      const data = await personRes.json();
      const groupData = (await groupRes.json()).group;
      setTheme(resolveGroupTheme(groupData.theme));
      setFinishedAt(groupData.finishedAt || null);
      const enabled = data.wishlistsEnabled !== false && groupData.wishlistsEnabled !== false;
      // Refresh visibility without overwriting an unsaved list during polling.
      if (!preserveDraft || (enabled && !wishlistsEnabledRef.current)) {
        setItems(data.wishlistItems?.length ? data.wishlistItems.map((item: WishlistItem) => ({ id: item.id, title: item.title, link: item.link })) : [{ title: "", link: "" }]);
      }
      wishlistsEnabledRef.current = enabled;
      setWishlistsEnabled(enabled);
      setAssignment(data.assignment || null);
      setBudget(groupData.budgetAmount !== null && groupData.budgetAmount !== undefined ? { amount: groupData.budgetAmount, currency: groupData.budgetCurrency || "USD" } : null);
    } catch {
      if (!preserveDraft) setError("Não foi possível carregar os dados");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // Check session from server
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session) => {
        if (!session.authenticated || !session.isLoggedIn) {
          router.push("/groups");
          return;
        }

        setPersonId(session.personId);
        setPersonName(session.personName);
        setGroupName(session.groupName || "");
        setGroupId(session.groupId);
        setIsAdmin(Boolean(session.isAdmin && session.adminGroupId === session.groupId));

        loadPersonData(session.groupId);
      })
      .catch(() => {
        router.push("/groups");
      });
  }, [router, loadPersonData]);


  useEffect(() => {
    if (!groupId) return;
    const refresh = () => { void loadPersonData(groupId, true); };
    const timer = setInterval(refresh, 5000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [groupId, loadPersonData]);

  const handleItemChange = (index: number, field: "title" | "link", value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddItem = () => {
    if (items.length < 5) {
      setItems([...items, { title: "", link: "" }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleSaveWishlist = async () => {
    setError("");
    setSuccessMessage("");
    setSaving(true);

    // Filter out empty items
    const validItems = items.filter((item) => item.title.trim() && item.link.trim());

    if (validItems.length < 1) {
      setError("Adicione pelo menos 1 item à sua lista de desejos");
      setSaving(false);
      return;
    }

    if (validItems.length > 5) {
      setError("Sua lista de desejos pode ter no máximo 5 itens");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId,
          items: validItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Não foi possível salvar a lista de desejos");
        if (res.status === 403 && groupId) void loadPersonData(groupId, true);
        setSaving(false);
        return;
      }

      setSuccessMessage("Lista de desejos salva com sucesso!");
      setSaving(false);

      // Reload person data
      if (groupId) {
        loadPersonData(groupId);
      }

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Ocorreu um erro ao salvar");
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/groups");
  };

  return <AppShell active="participation" admin={isAdmin} participant name={personName} onLogout={handleLogout}>
    <div className="group-surface" data-group-theme={theme}>
    <header className="page-header group-theme-header"><div><span className="eyebrow">{groupName || "SUA PARTICIPAÇÃO"}</span><h1>Olá, {personName || "participante"}!</h1><p>{wishlistsEnabled ? "Uma sugestão de presente, uma boa surpresa e um encontro para lembrar." : "Confira quem você tirou e escolha o presente livremente."}</p></div>{budget?.amount !== undefined && <span className="budget-pill"><Icon name="gift" />Valor do presente: {formatCurrency(budget.amount, budget.currency)}</span>}{theme === "fruits" && <FruitDecor className="group-header-fruit" />}</header>
    {error && <p role="alert" className="ui-alert">{error}</p>}
    {successMessage && <p role="status" className="ui-alert ui-alert-success">{successMessage}</p>}
    {loading ? <div className="ui-loading">Carregando...</div> : <>
      <div className="admin-tabs" role="tablist" aria-label="Seções do grupo">
        <button type="button" role="tab" id="group-tab-participation" aria-controls="group-tab-panel" aria-selected={section === "participation"} onClick={() => setSection("participation")}>Minha participação</button>
        <button type="button" role="tab" id="group-tab-participants" aria-controls="group-tab-panel" aria-selected={section === "participants"} onClick={() => setSection("participants")}><Icon name="groups" />Participantes</button>
        {finishedAt && <button type="button" role="tab" id="group-tab-results" aria-controls="group-tab-panel" aria-selected={section === "results"} onClick={() => setSection("results")}><Icon name="check" />Resultado final</button>}
      </div>
      {finishedAt && <div className="welcome-banner"><div><h2>Amigo secreto finalizado!</h2><p>A lista de quem tirou quem está disponível na aba Resultado final.</p></div><Icon name="check" /></div>}
      <div key={section} id="group-tab-panel" role="tabpanel" aria-labelledby={`group-tab-${section}`} className="motion-content">
      {section === "results" && finishedAt ? <GroupDrawResults key={groupId} groupId={groupId} /> : section === "participants" ? <GroupParticipants key={groupId} groupId={groupId} personId={personId} /> : <>
      {!wishlistsEnabled && <div className="welcome-banner"><div><h2>Neste grupo, a escolha do presente é livre</h2><p>O administrador optou por ocultar as listas de desejos. Basta conferir quem você tirou e preparar seu presente.</p></div><Icon name="heart" /></div>}
      <div className="participation-grid">
        {wishlistsEnabled && <section className="ui-panel"><div className="panel-heading"><h2>Minha lista de desejos</h2><Icon name="list" /></div><p className="panel-copy">Dê uma ajudinha para quem tirar você. Adicione até 5 sugestões de presentes com seus links.</p>
          <div className="wishlist-fields">{items.map((item, index) => <div key={index} className="wishlist-item"><span className="item-number">{String(index + 1).padStart(2, "0")}</span><input type="text" value={item.title} onChange={e => handleItemChange(index, "title", e.target.value)} placeholder="Nome do presente" aria-label={`Nome do item ${index + 1}`} className="ui-input" /><input type="url" value={item.link} onChange={e => handleItemChange(index, "link", e.target.value)} placeholder="Link do produto" aria-label={`Link do item ${index + 1}`} className="ui-input" />{items.length > 1 && <button type="button" onClick={() => handleRemoveItem(index)} aria-label={`Remover item ${index + 1}`} className="remove-item"><Icon name="close" /></button>}</div>)}</div>
          <div className="wishlist-actions">{items.length < 5 ? <button type="button" onClick={handleAddItem} className="ui-btn ui-btn-ghost ui-btn-small"><Icon name="plus" />Adicionar item</button> : <span className="ui-hint">Limite de 5 sugestões</span>}<button onClick={handleSaveWishlist} disabled={saving} aria-busy={saving} className="ui-btn ui-btn-primary">{saving ? "Salvando..." : "Salvar lista de desejos"}<Icon name="check" /></button></div>
        </section>}
        <section className="ui-panel recipient-panel"><div className="panel-heading"><h2>Seu amigo secreto</h2>{theme === "fruits" ? <FruitDecor className="recipient-fruit" /> : <Icon name="gift" />}</div>
          {assignment ? <><p className="recipient-label">Você vai presentear:</p><p className="recipient-name">{assignment.receiver.name}</p>{wishlistsEnabled && <div className="recipient-wishes"><h3>Lista de desejos de {assignment.receiver.name}:</h3>{assignment.receiver.wishlistItems.length ? <ul>{assignment.receiver.wishlistItems.map((item, index) => <li key={index}><strong>{item.title}</strong><br /><a href={item.link} target="_blank" rel="noopener noreferrer">Ver sugestão de presente <Icon name="arrow" /></a></li>)}</ul> : <p className="panel-copy">{assignment.receiver.name} ainda não adicionou uma lista de desejos. Que tal escolher uma surpresa com a cara dessa pessoa?</p>}</div>}</> : <div className="ui-empty"><Icon name="sparkles" /><div><p>O sorteio do amigo secreto ainda não foi realizado.</p><p className="ui-hint">Assim que o organizador sortear, a surpresa aparece aqui.</p></div></div>}
        </section>
      </div>
      </>}
      </div>
    </>}
    </div>
  </AppShell>;
}
