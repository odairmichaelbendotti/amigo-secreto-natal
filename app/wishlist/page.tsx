"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-santa-dark">
        <div className="text-xl text-santa-gold">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-santa-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-4xl font-bold text-santa-gold font-display truncate">Olá, {personName}!</h1>
            {groupName && <p className="text-gray-300 mt-1 text-sm sm:text-base truncate">{groupName}</p>}
            <p className="text-gray-400 mt-1 text-sm">{wishlistsEnabled ? "Gerencie sua lista de desejos e confira quem você tirou no sorteio" : "Confira quem você tirou no sorteio e escolha o presente livremente"}</p>
            {budget && budget.amount !== undefined && (
              <div className="mt-2 inline-flex items-center bg-santa-gold/10 border border-santa-gold/30 text-santa-gold px-3 py-1 rounded-lg text-sm font-medium">
                💰 Valor do presente: {formatCurrency(budget.amount, budget.currency)}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3 self-start sm:self-auto">
            <Link href="/groups" className="text-santa-gold px-4 py-2">Meus grupos</Link>
            {isAdmin && (
              <Link href="/admin/dashboard" className="bg-santa-green text-white px-4 py-2 rounded-lg hover:bg-santa-green-dark transition min-h-[44px] flex items-center">
                Painel do administrador
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-white/10 text-santa-snow px-4 py-2 rounded-lg hover:bg-white/20 transition border border-white/10 min-h-[44px]"
            >
              Sair
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-santa-red/10 border border-santa-red/30 text-santa-red px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-santa-green/10 border border-santa-green/30 text-santa-green px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}

        {!wishlistsEnabled && <div className="bg-santa-gold/10 border border-santa-gold/30 text-gray-300 p-5 rounded-xl mb-6">
          <p className="font-semibold text-santa-gold mb-1">Neste grupo, a escolha do presente é livre</p>
          <p className="text-sm">O administrador optou por ocultar as listas de desejos. Basta conferir quem você tirou e preparar seu presente.</p>
        </div>}
        <div className={wishlistsEnabled ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "max-w-3xl mx-auto"}>
          {/* My Wishlist */}
          {wishlistsEnabled && <div className="bg-[#151528] p-6 rounded-2xl border border-white/10 card-glow">
            <h2 className="text-2xl font-bold text-santa-snow mb-4">Minha lista de desejos</h2>
            <p className="text-sm text-gray-400 mb-4">Adicione de 1 a 5 itens que você gostaria de ganhar</p>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border border-white/10 p-4 rounded-lg bg-santa-dark/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-santa-gold">Item {index + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="text-santa-red text-sm hover:text-santa-red-dark"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleItemChange(index, "title", e.target.value)}
                      placeholder="Nome do item"
                      aria-label={`Nome do item ${index + 1}`}
                      className="w-full px-3 py-2 bg-santa-dark border border-white/10 rounded focus:ring-2 focus:ring-santa-gold focus:border-transparent text-santa-snow placeholder-gray-500"
                    />
                    <input
                      type="url"
                      value={item.link}
                      onChange={(e) => handleItemChange(index, "link", e.target.value)}
                      placeholder="https://exemplo.com/produto"
                      aria-label={`Link do item ${index + 1}`}
                      className="w-full px-3 py-2 bg-santa-dark border border-white/10 rounded focus:ring-2 focus:ring-santa-gold focus:border-transparent text-santa-snow placeholder-gray-500"
                    />
                  </div>
                </div>
              ))}

              {items.length < 5 && (
                <button
                  onClick={handleAddItem}
                  className="w-full py-2 border-2 border-dashed border-white/10 rounded-lg text-gray-400 hover:border-santa-gold hover:text-santa-gold transition"
                >
                  + Adicionar item
                </button>
              )}

              <button
                onClick={handleSaveWishlist}
                disabled={saving}
                className="w-full bg-santa-green text-white py-3 rounded-xl font-semibold hover:bg-santa-green-dark transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transform"
              >
                {saving ? "Salvando..." : "Salvar lista de desejos"}
              </button>
            </div>
          </div>}

          {/* Secret Santa Assignment */}
          <div className="bg-[#151528] p-6 rounded-2xl border border-white/10 card-glow">
            <h2 className="text-2xl font-bold text-santa-snow mb-4">Seu amigo secreto</h2>

            {assignment ? (
              <div>
                <p className="text-lg mb-4 text-santa-snow">
                  Você vai presentear:{" "}
                  <span className="font-bold text-santa-red">{assignment.receiver.name}</span>
                </p>

                {wishlistsEnabled && <div className="bg-santa-red/10 border border-santa-red/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-santa-snow mb-3">
                    Lista de desejos de {assignment.receiver.name}:
                  </h3>

                  {assignment.receiver.wishlistItems.length > 0 ? (
                    <ul className="space-y-3">
                      {assignment.receiver.wishlistItems.map((item, index) => (
                        <li key={index} className="border-b border-white/5 pb-2 last:border-0">
                          <div className="font-medium text-santa-snow">{item.title}</div>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-santa-gold hover:underline break-all"
                          >
                            {item.link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400 italic">
                      {assignment.receiver.name} ainda não adicionou uma lista de desejos. Confira novamente mais tarde!
                    </p>
                  )}
                </div>}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎁</div>
                <p className="text-santa-snow">
                  O sorteio do amigo secreto ainda não foi realizado.
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Confira novamente mais tarde ou fale com o administrador!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
