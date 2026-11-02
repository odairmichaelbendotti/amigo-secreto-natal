"use client";

import { Icon } from "@/components/Ui";
import type { ReactNode } from "react";

export interface DrawAssignment {
  id: string;
  giver: { name: string };
  receiver?: { name: string; wishlistItems?: { title: string; link: string }[] };
}

export default function DrawResults({ assignments, wishlistsEnabled, finished, children }: { assignments: DrawAssignment[]; wishlistsEnabled: boolean; finished: boolean; children?: ReactNode }) {
  return <section className="ui-panel" aria-labelledby="draw-results-heading">
    <div className="panel-heading draw-results-heading">
      <h2 id="draw-results-heading">Resultado do sorteio ({assignments.length})</h2>
      <Icon name={finished ? "check" : "eye-off"} />
    </div>
    {!assignments.length ? <div className="ui-empty"><Icon name="gift" /><p>O sorteio ainda não foi realizado. Reúna pelo menos 2 participantes aprovados e faça o sorteio na Visão geral.</p></div> : <>
      <p className="panel-copy" role="status">{finished ? "Amigo secreto finalizado! Todos os participantes aprovados podem conferir quem tirou quem." : "Quem recebe está oculto, inclusive para o administrador. Os pares serão liberados para o grupo somente ao finalizar o amigo secreto."}</p>
      <div className="table-wrap"><table className="ui-table" id="draw-results-table">
        <thead><tr><th scope="col">Quem presenteia</th><th scope="col">Quem recebe</th>{finished && wishlistsEnabled && <th scope="col">Lista de desejos</th>}</tr></thead>
        <tbody>{assignments.map(assignment => <tr key={assignment.id}>
          <td>{assignment.giver.name}</td>
          <td>{finished && assignment.receiver ? assignment.receiver.name : <span className="draw-result-hidden"><Icon name="eye-off" />Resultado oculto</span>}</td>
          {finished && wishlistsEnabled && <td>{assignment.receiver?.wishlistItems?.length || 0} itens</td>}
        </tr>)}</tbody>
      </table></div>
      {children}
    </>}
  </section>;
}
