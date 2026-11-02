import { Brand } from "@/components/Ui";

export default function Loading() {
  return <div className="route-loading" role="status" aria-live="polite" aria-busy="true">
    <Brand />
    <div className="loading-progress" aria-hidden="true" />
    <p>Preparando seu amigo secreto...</p>
  </div>;
}
