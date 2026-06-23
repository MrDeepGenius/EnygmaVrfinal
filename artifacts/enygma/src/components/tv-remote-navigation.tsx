import { useEffect } from "react";
import { useLocation } from "wouter";
import { useTvMode } from "@/lib/tv-mode";

type Dir = "left" | "right" | "up" | "down";

function isVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === "hidden" || style.display === "none") return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 1 && rect.height > 1;
}

function isFocusable(el: HTMLElement): boolean {
  if ((el as HTMLButtonElement).disabled) return false;
  if (el.getAttribute("aria-disabled") === "true") return false;
  if (el.getAttribute("data-tv-skip") === "true") return false;
  if (!isVisible(el)) return false;
  return true;
}

function getCandidates(): HTMLElement[] {
  const selector =
    'a[href],button,input,select,textarea,[role="button"],[tabindex]:not([tabindex="-1"])';
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).filter(isFocusable);
}

function centerOf(r: DOMRect) {
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function score(from: DOMRect, to: DOMRect, dir: Dir) {
  const a = centerOf(from);
  const b = centerOf(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (dir === "left" && dx >= -1) return null;
  if (dir === "right" && dx <= 1) return null;
  if (dir === "up" && dy >= -1) return null;
  if (dir === "down" && dy <= 1) return null;

  const primary = dir === "left" || dir === "right" ? Math.abs(dx) : Math.abs(dy);
  const cross = dir === "left" || dir === "right" ? Math.abs(dy) : Math.abs(dx);
  const distance = Math.hypot(dx, dy);
  return primary * 1.0 + cross * 0.25 + distance * 0.001;
}

function findNext(active: HTMLElement, dir: Dir, candidates: HTMLElement[]): HTMLElement | null {
  const from = active.getBoundingClientRect();
  let best: { el: HTMLElement; score: number } | null = null;

  for (const el of candidates) {
    if (el === active) continue;
    const s = score(from, el.getBoundingClientRect(), dir);
    if (s === null) continue;
    if (!best || s < best.score) best = { el, score: s };
  }

  return best?.el ?? null;
}

function isTextInput(el: Element | null) {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return (el as HTMLElement).isContentEditable;
}

export function TvRemoteNavigation() {
  const enabled = useTvMode();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const active = document.activeElement as HTMLElement | null;
      if (isTextInput(active)) return;
      if (active?.closest?.('[data-tv-ignore-nav="true"]')) return;

      const key = e.key;
      const dir: Dir | null =
        key === "ArrowLeft"
          ? "left"
          : key === "ArrowRight"
            ? "right"
            : key === "ArrowUp"
              ? "up"
              : key === "ArrowDown"
                ? "down"
                : null;

      if (dir) {
        e.preventDefault();
        e.stopPropagation();
        const candidates = getCandidates();
        if (candidates.length === 0) return;
        const current = active && candidates.includes(active) ? active : candidates[0];
        const next = findNext(current, dir, candidates);
        (next ?? current).focus({ preventScroll: true });
        (next ?? current).scrollIntoView({ block: "nearest", inline: "nearest" });
        return;
      }

      if (key === "Enter" || key === "NumpadEnter") {
        if (!active) return;
        if (active.tagName.toLowerCase() === "a" || active.tagName.toLowerCase() === "button") return;
        e.preventDefault();
        e.stopPropagation();
        active.click();
        return;
      }

      const isBack =
        key === "Escape" || key === "Backspace" || key === "BrowserBack" || key === "GoBack";
      if (isBack) {
        if (location === "/" || location === "/profiles") return;
        e.preventDefault();
        e.stopPropagation();
        if (window.history.length > 1) window.history.back();
        else setLocation("/home");
      }
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [enabled, location, setLocation]);

  return null;
}
