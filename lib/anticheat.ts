// Client-side cheat signals during a match. The server decides what they mean (any signal = that
// player loses). These are deterrents, not guarantees: a determined cheater can use a second device.
export function startAntiCheat(report: (reason: string) => void): () => void {
  const wasFullscreen = !!document.fullscreenElement;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  // devtools docked in the window shrink the page; compare with the size when the match started
  const baseW = window.outerWidth - window.innerWidth;
  const baseH = window.outerHeight - window.innerHeight;

  const onVisibility = () => {
    if (document.visibilityState === "hidden") report("tab-switch");
  };
  const onBlur = () => report("window-switch");
  const onFullscreen = () => {
    if (wasFullscreen && !document.fullscreenElement) report("left-fullscreen");
  };
  const devtools = window.setInterval(() => {
    if (touch) return;
    const grewW = window.outerWidth - window.innerWidth - baseW > 160;
    const grewH = window.outerHeight - window.innerHeight - baseH > 160;
    if (grewW || grewH) report("devtools");
  }, 1000);
  const onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === "f12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k))) {
      e.preventDefault();
      report("devtools-shortcut");
    }
    if ((e.ctrlKey || e.metaKey) && ["c", "a", "p", "s", "u"].includes(k)) e.preventDefault();
  };
  const block = (e: Event) => e.preventDefault();

  // Extensions usually inject their own elements (iframes, custom tags, overlays) into the page.
  // Our own UI lives inside [data-app] containers, so anything new outside them is suspicious.
  const harmless = new Set(["SCRIPT", "STYLE", "LINK", "META", "TITLE", "NOSCRIPT", "NEXTJS-PORTAL", "NEXT-ROUTE-ANNOUNCER"]);
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const el = node as Element;
        if (harmless.has(el.tagName)) continue;
        const insideApp = !!el.closest("[data-app]");
        if (el.tagName === "IFRAME" || el.tagName.includes("-") || !insideApp) {
          report(`extension:${el.tagName.toLowerCase()}`);
          return;
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("blur", onBlur);
  document.addEventListener("fullscreenchange", onFullscreen);
  document.addEventListener("keydown", onKey, true);
  for (const ev of ["copy", "cut", "contextmenu", "selectstart", "dragstart"]) document.addEventListener(ev, block, true);

  return () => {
    window.clearInterval(devtools);
    observer.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("fullscreenchange", onFullscreen);
    document.removeEventListener("keydown", onKey, true);
    for (const ev of ["copy", "cut", "contextmenu", "selectstart", "dragstart"]) document.removeEventListener(ev, block, true);
  };
}

// Full screen helps (leaving it is detectable). Must be called from a tap/click.
export function enterFullscreen() {
  try {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } catch {
    /* not supported (e.g. iPhone Safari) */
  }
}
