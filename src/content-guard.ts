import { useEffect } from "react";

/** Best-effort UI deterrent only. This cannot hide network requests or disable browser DevTools. */
export function useContentGuard() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    const isEditable = (target: EventTarget | null) =>
      target instanceof Element &&
      Boolean(
        target.closest('input, textarea, select, [contenteditable="true"]'),
      );
    const onContextMenu = (event: MouseEvent) => {
      if (!isEditable(event.target)) event.preventDefault();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditable(event.target)) return;
      const key = event.key.toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      const inspect =
        ((modifier && event.shiftKey) || (event.metaKey && event.altKey)) &&
        ["i", "j", "c"].includes(key);
      if (key === "f12" || inspect || (modifier && key === "u"))
        event.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, []);
}
