import { useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";

export default function ShareDialog({ slug, open, onClose }) {
  if (!open) return null;
  const href = useMemo(() => `${window.location.origin}/s/${slug}`, [slug]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      alert("Public link copied to clipboard!");
    } catch {
      prompt("Copy this URL:", href);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
      <div className="w-[22rem] rounded-2xl bg-white p-4 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Share survey</div>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>

        <div className="flex flex-col items-center gap-3">
          <QRCodeCanvas value={href} size={192} includeMargin />
          <div className="text-xs text-gray-600 break-all text-center">{href}</div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={copy}>Copy link</button>
            <a
              href={`data:image/png;${document.createElement("canvas")}`}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
