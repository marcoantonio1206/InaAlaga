"use client";

import { useEffect, useRef } from "react";

// Shared behaviour for the modal dialog and the slide-over panel:
// backdrop click and Escape close it, focus moves inside on open,
// page scroll is locked while open. Everything is rendered inline (no portal)
// so Tailwind tokens and the layout font apply unchanged.
function useOverlay(open, onClose) {
  const panelRef = useRef(null);
  // Keep the latest handler in a ref so the effect below depends only on
  // `open`. Re-running it on every render would steal focus while typing.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const first = panelRef.current?.querySelector(
      "input:not([readonly]), select, textarea, button:not([aria-label='Close']), [href]"
    );
    first?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return panelRef;
}

function CloseButton({ onClose }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-ink hover:bg-brand-50"
    >
      ×
    </button>
  );
}

export function Modal({ open, onClose, title, subtitle, size = "md", children }) {
  const panelRef = useOverlay(open, onClose);
  if (!open) return null;
  const width = size === "lg" ? "max-w-[1020px]" : "max-w-[860px]";
  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-brand-950/55 px-4 py-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`w-full ${width} rounded-3xl bg-white p-6 shadow-2xl lg:p-8`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 id="modal-title" className="text-3xl font-extrabold">
              {title}
            </h1>
            {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
          </div>
          <CloseButton onClose={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}

export function SlideOver({ open, onClose, title, subtitle, children }) {
  const panelRef = useOverlay(open, onClose);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 bg-brand-950/35"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
        className="absolute inset-y-0 right-0 w-full max-w-[1040px] overflow-y-auto bg-white px-6 py-8 shadow-2xl lg:px-10"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 id="panel-title" className="text-3xl font-extrabold">
              {title}
            </h1>
            {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-200 px-3 py-1 text-sm font-bold text-brand-900">
              Fictional demo
            </span>
            <CloseButton onClose={onClose} />
          </div>
        </div>
        {children}
      </aside>
    </div>
  );
}
