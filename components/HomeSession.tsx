"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Ui";

interface HomeSession {
  authenticated: boolean;
  user?: { name: string } | null;
  personName?: string;
  isLoggedIn?: boolean;
  isAdmin?: boolean;
}
interface SessionState { session: HomeSession | null; checking: boolean; error: string }
const HomeSessionContext = createContext<(SessionState & { leaving: boolean; check: () => void; logout: () => void }) | null>(null);

export function HomeSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, checking: true, error: "" });
  const [leaving, setLeaving] = useState(false);
  const request = useRef<AbortController | null>(null);
  const loggingOut = useRef(false);
  const router = useRouter();

  const check = useCallback(async () => {
    if (loggingOut.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => { timedOut = true; controller.abort(); }, 10000);
    setState(previous => ({ ...previous, checking: previous.session === null, error: "" }));
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
      if (!response.ok) throw new Error("session");
      const session: HomeSession = await response.json();
      if (typeof session.authenticated !== "boolean") throw new Error("session");
      if (request.current !== controller || controller.signal.aborted) return;
      setState({ session, checking: false, error: "" });
    } catch {
      if (request.current !== controller || (controller.signal.aborted && !timedOut)) return;
      setState(previous => ({ ...previous, checking: false, error: "Não foi possível verificar seu acesso. Tente novamente." }));
    } finally { window.clearTimeout(timeout); }
  }, []);

  useEffect(() => {
    void check();
    const refresh = () => { if (document.visibilityState === "visible") void check(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      const controller = request.current;
      request.current = null;
      controller?.abort();
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [check]);

  async function logout() {
    if (loggingOut.current) return;
    loggingOut.current = true;
    request.current?.abort();
    setLeaving(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw new Error("logout");
      setState({ session: { authenticated: false }, checking: false, error: "" });
      router.refresh();
    } catch {
      setState(previous => ({ ...previous, error: "Não foi possível sair da conta. Tente novamente." }));
    } finally { loggingOut.current = false; setLeaving(false); }
  }

  return <HomeSessionContext.Provider value={{ ...state, leaving, check: () => void check(), logout: () => void logout() }}>{children}</HomeSessionContext.Provider>;
}

function useHomeSession() {
  const state = useContext(HomeSessionContext);
  if (!state) throw new Error("Home session provider is required");
  const account = state.session?.authenticated ? state.session : null;
  const href = account?.user ? "/groups" : account?.isAdmin ? "/admin/dashboard" : account?.isLoggedIn ? "/wishlist" : "/groups";
  const label = href === "/admin/dashboard" ? "Meu painel" : href === "/wishlist" ? "Minha participação" : "Meus grupos";
  return { ...state, account, href, label };
}

export function HomeAccountNav() {
  const { account, checking, error, leaving, logout, href, label } = useHomeSession();
  const name = (account?.user?.name || account?.personName || "").trim();
  return <nav className={`public-nav ${account ? "home-account-nav" : ""}`} aria-label="Navegação principal">
    {account ? <>
      <span className="home-account-name" title={name || undefined}>{name ? `Olá, ${name.split(/\s+/)[0]}!` : "Você está conectado"}</span>
      <Link href={href} className="ui-btn ui-btn-primary">{label}<Icon name="arrow" /></Link>
      <button type="button" onClick={logout} disabled={leaving} aria-busy={leaving} aria-label="Sair da conta" className="ui-btn ui-btn-ghost ui-btn-small home-logout"><Icon name="logout" /><span>{leaving ? "Saindo..." : "Sair"}</span></button>
    </> : checking ? <span role="status" className="home-session-checking">Verificando acesso...</span> : error ? <Link href="/groups" className="ui-btn ui-btn-primary">Minha conta<Icon name="arrow" /></Link> : <>
      <Link href="/groups" className="ui-link">Meus grupos</Link><Link href="/login" className="ui-btn ui-btn-primary">Fazer login<Icon name="arrow" /></Link>
    </>}
  </nav>;
}

export function HomePrimaryAction() {
  const { account, checking, error, href, label } = useHomeSession();
  if (checking) return <button type="button" disabled className="ui-btn ui-btn-primary">Verificando acesso...</button>;
  return <Link href={account || error ? href : "/login"} className="ui-btn ui-btn-primary">{account ? label === "Meus grupos" ? "Acessar meus grupos" : label : error ? "Acessar minha conta" : "Fazer login para entrar no grupo"}<Icon name="arrow" /></Link>;
}

export function HomeSessionNotice() {
  const { error, check } = useHomeSession();
  return error ? <p role="status" className="home-session-notice">{error} <button type="button" className="ui-link" onClick={check}>Tentar novamente</button></p> : null;
}

export function HomeAccountFooter() {
  const { account, checking, error, href, label } = useHomeSession();
  return <Link href={account || checking || error ? href : "/login"}>{account ? label : checking || error ? "Minha conta" : "Entrar na conta"}</Link>;
}
