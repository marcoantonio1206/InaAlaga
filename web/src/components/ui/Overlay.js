"use client";

import { useEffect, useRef } from "react";

// Shared behaviour for the modal dialog and the slide-over panel:
// backdrop click and Escape close it, focus moves inside on open,
// page scroll is locked while open. Everything is rendered inline (no portal)
// so Tailwind tokens and the layout font apply unchanged.
// Open overlays in the order they opened; Escape closes only the topmost, so a
// Modal inside a SlideOver does not take the panel (and its form input) with it.
const openStack = [];

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
    const entry = {};
    openStack.push(entry);
    const onKey = (e) => {
      if (e.key === "Escape" && openStack[openStack.length - 1] === entry) onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const first = panelRef.current?.querySelector(
      "input:not([readonly]), select, textarea, button:not([aria-label='Close']), [href]"
    );
    first?.focus();
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      openStack.splice(openStack.indexOf(entry), 1);
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

// The dialog never grows taller than the viewport: the body scrolls inside it
// and an optional footer (actions) stays pinned at the bottom.
export function Modal({ open, onClose, title, subtitle, size = "md", footer, children }) {
  const panelRef = useOverlay(open, onClose);
  if (!open) return null;
  const width = size === "lg" ? "max-w-[1020px]" : "max-w-[900px]";
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-brand-950/55 px-4 py-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`flex max-h-[calc(100dvh-2rem)] w-full ${width} flex-col rounded-3xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3 lg:px-8">
          <div>
            <h1 id="modal-title" className="text-2xl font-extrabold lg:text-3xl">
              {title}
            </h1>
            {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
          </div>
          <CloseButton onClose={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-3 lg:px-8">{children}</div>
        {footer ? (
          <div className="border-t border-brand-200 px-6 py-4 lg:px-8">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

export function SlideOver({ open, onClose, title, subtitle, children, showDemo = true, stickyHeader = false }) {
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
        className={`absolute inset-y-0 right-0 w-full max-w-[1040px] bg-white shadow-2xl ${stickyHeader ? "flex flex-col overflow-hidden" : "overflow-y-auto px-6 py-4 lg:px-8"}`}
      >
        <div className={`flex items-start justify-between gap-4 ${stickyHeader ? "shrink-0 border-b border-brand-200 bg-white px-6 py-4 lg:px-8" : "mb-3"}`}>
          <div>
            <h1 id="panel-title" className="text-2xl font-extrabold lg:text-3xl">
              {title}
            </h1>
            {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            {showDemo ? <span className="rounded-full bg-brand-200 px-3 py-1 text-sm font-bold text-brand-900">
              Fictional demo
            </span> : null}
            <CloseButton onClose={onClose} />
          </div>
        </div>
        {stickyHeader ? <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 lg:px-8">{children}</div> : children}
      </aside>
    </div>
  );
}
