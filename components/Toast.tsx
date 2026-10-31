export type ToastState = { text: string; kind: "error" | "success" | "info"; id: number } | null;

export default function Toast({ state }: { state: ToastState }) {
  return (
    <div className={`toast ${state ? "show" : ""} ${state?.kind ?? ""}`} role="status" aria-live="polite">
      {state?.text}
    </div>
  );
}
