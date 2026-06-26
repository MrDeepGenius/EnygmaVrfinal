import { useEffect, useRef } from "react";

// ── Adsterra Banner Keys ──────────────────────────────────────────────────
const DESKTOP_KEY = "862944febd24dd376950cafd83ec2ba0"; // 728x90
const MOBILE_KEY  = "d9d8fecc362ff648676f69c9527b6547"; // 320x50
const RECT_KEY    = "f5f4ca574261d74313928a9fb765d304"; // 300x250

type BannerVariant = "horizontal" | "rect";

interface AdBannerProps {
  variant?: BannerVariant;
  className?: string;
}

// ── Serialized ad queue ───────────────────────────────────────────────────
// Adsterra's invoke.js reads the global `atOptions` immediately on load.
// When multiple banners mount at the same time each one sets `atOptions`
// before the previous invoke.js has had a chance to run, so the last write
// wins for all slots.  We serialize initializations: the next banner starts
// only after the previous invoke.js has finished loading (or failed).

const adQueue: Array<() => void> = [];
let adRunning = false;

function drainAdQueue() {
  if (adQueue.length === 0) { adRunning = false; return; }
  adRunning = true;
  const next = adQueue.shift()!;
  next();
}

function enqueueAd(init: () => void) {
  adQueue.push(init);
  if (!adRunning) drainAdQueue();
}

let bannerCounter = 0;

export function AdBanner({ variant = "horizontal", className = "" }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef        = useRef(`adsterra-${++bannerCounter}`);
  const mounted      = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const container = containerRef.current;
    if (!container) return;

    enqueueAd(() => {
      if (!container.isConnected) { drainAdQueue(); return; }

      const isRect    = variant === "rect";
      const isDesktop = window.innerWidth >= 728;
      const key    = isRect ? RECT_KEY : (isDesktop ? DESKTOP_KEY : MOBILE_KEY);
      const width  = isRect ? 300 : (isDesktop ? 728 : 320);
      const height = isRect ? 250 : (isDesktop ? 90  : 50);

      // Inline script sets atOptions synchronously…
      const s1      = document.createElement("script");
      s1.type       = "text/javascript";
      s1.text       = `atOptions = { 'key': '${key}', 'format': 'iframe', 'height': ${height}, 'width': ${width}, 'params': {} };`;
      container.appendChild(s1);

      // …then invoke.js runs AFTER atOptions is set in same container scope.
      const s2    = document.createElement("script");
      s2.type     = "text/javascript";
      s2.src      = `https://www.highperformanceformat.com/${key}/invoke.js`;
      s2.async    = false; // keep execution order within the container
      s2.onload   = () => drainAdQueue();
      s2.onerror  = () => drainAdQueue();
      container.appendChild(s2);
    });

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [variant]);

  const isRect    = variant === "rect";
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 728;
  const wrapperStyle: React.CSSProperties = isRect
    ? { width: 300, height: 250, margin: "0 auto" }
    : { width: "100%", maxWidth: 728, minHeight: isDesktop ? 90 : 50, margin: "0 auto" };

  return (
    <div
      className={`overflow-hidden flex items-center justify-center ${className}`}
      style={{ background: "transparent" }}
    >
      <div ref={containerRef} id={idRef.current} style={wrapperStyle} />
    </div>
  );
}

// Slot with reserved space to prevent layout shift
export function AdBannerSlot({ variant = "horizontal", className = "" }: AdBannerProps) {
  const minH = variant === "rect" ? 250 : 50;
  return (
    <div
      className={`w-full flex justify-center items-center py-2 ${className}`}
      style={{ minHeight: minH, background: "transparent" }}
    >
      <AdBanner variant={variant} />
    </div>
  );
}
