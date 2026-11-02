"use client";

import { useEffect, useState } from "react";
import FruitDecor from "@/components/FruitDecor";
import { Icon } from "@/components/Ui";
import type { GroupTheme } from "@/lib/group-theme";

export default function GroupThemePicker({ value, disabled, saving, onApply }: { value: GroupTheme; disabled: boolean; saving: boolean; onApply: (theme: GroupTheme) => void }) {
  const [selected, setSelected] = useState(value);
  useEffect(() => setSelected(value), [value]);

  return <section className="ui-panel" aria-labelledby="group-theme-heading">
    <div className="panel-heading"><h2 id="group-theme-heading">Tema do grupo</h2><span className="ui-pill">{value === "fruits" ? "Frutas" : "Sem tema"}</span></div>
    <p className="panel-copy">Um toque especial para o seu amigo secreto. Os enfeites aparecem no cartão em Meus grupos e na área dos participantes.</p>
    <form onSubmit={event => { event.preventDefault(); if (!disabled && selected !== value) onApply(selected); }}>
      <fieldset disabled={disabled} className="theme-options">
        <legend className="sr-only">Escolha o tema do grupo</legend>
        <label className={`theme-option ${selected === "none" ? "is-selected" : ""}`}>
          <input type="radio" name="group-theme" value="none" checked={selected === "none"} onChange={() => setSelected("none")} />
          <span className="theme-preview theme-preview-plain" aria-hidden="true"><Icon name="gift" /><span /><span /></span>
          <strong>Sem tema</strong><span>O visual original, sem enfeites.</span>
        </label>
        <label className={`theme-option ${selected === "fruits" ? "is-selected" : ""}`}>
          <input type="radio" name="group-theme" value="fruits" checked={selected === "fruits"} onChange={() => setSelected("fruits")} />
          <span className="theme-preview theme-preview-fruits"><FruitDecor /></span>
          <strong>Frutas</strong><span>Melancia, laranja e morango para alegrar o grupo.</span>
        </label>
      </fieldset>
      <div className="theme-picker-actions"><p className="ui-hint">Tema atual: {value === "fruits" ? "Frutas" : "Sem tema"}.</p><button type="submit" disabled={disabled || selected === value} aria-busy={saving} className="ui-btn ui-btn-primary ui-btn-small">{saving ? "Aplicando..." : "Aplicar tema"}<Icon name="check" /></button></div>
    </form>
  </section>;
}
