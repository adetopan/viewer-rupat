import type { CSSProperties } from "react";

type Props = { text: string };

/** Teks berjalan di bawah layar TV. */
export function ViewerTicker({ text }: Props) {
  const duration = Math.min(120, Math.max(28, text.length * 0.28));

  return (
    <footer className="viewer-ticker" aria-live="polite">
      <p className="viewer-ticker__badge">Informasi</p>
      <div className="viewer-ticker__viewport">
        <div
          className="viewer-ticker__track"
          style={{ "--ticker-duration": `${duration}s` } as CSSProperties}
        >
          <span className="viewer-ticker__text">{text}</span>
          <span className="viewer-ticker__text" aria-hidden="true">
            {text}
          </span>
        </div>
      </div>
    </footer>
  );
}
