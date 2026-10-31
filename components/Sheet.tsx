"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// A bottom sheet on phones, a centred dialog on desktop. Rendered straight into <body>, so a sheet opened from deep
// inside a screen still sits above the sidebar. Closes with ✕, Esc or a tap outside.
// wide: a bigger panel on desktop (the puzzle walkthrough)
export default function Sheet({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  const open = !!children;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const sheet = (
    <>
      <div className="sheet-backdrop" onClick={onClose} data-app />
      <div className={`sheet ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" data-app>
        <div className="sheet-handle" />
        <button className="sheet-close" onClick={onClose} aria-label="Band karein">
          <X size={20} />
        </button>
        {children}
      </div>
    </>
  );
  return typeof document === "undefined" ? sheet : createPortal(sheet, document.body);
}
