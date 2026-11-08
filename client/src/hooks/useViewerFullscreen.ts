import { useEffect } from "react";

/** Minta fullscreen otomatis di mode viewer (browser / WebView TV). */
export function useViewerFullscreen() {
  useEffect(() => {
    const root = document.documentElement;

    const enter = () => {
      if (document.fullscreenElement) return;
      const legacy = root as HTMLElement & {
        webkitRequestFullscreen?: () => void | Promise<void>;
      };
      const result = root.requestFullscreen?.() ?? legacy.webkitRequestFullscreen?.();
      if (result && typeof (result as Promise<void>).catch === "function") {
        void (result as Promise<void>).catch(() => {
          /* Browser TV kadang menolak tanpa gesture — WebView APK tetap fullscreen */
        });
      }
    };

    enter();
    const t = window.setTimeout(enter, 600);
    const onPointer = () => {
      enter();
    };
    window.addEventListener("pointerdown", onPointer, { once: true });

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, []);
}
