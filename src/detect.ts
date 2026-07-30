import type { Status, Tri } from './types';

/**
 * Extension probe: the extension declares icon-16x16.png as a web_accessible_resource
 * for <all_urls>, so any page can load chrome-extension://<id>/icon-16x16.png iff
 * installed. Chromium-only — Firefox/Safari use per-install random UUIDs -> 'unknown'.
 */
export function detectExtension(ids: string[], timeoutMs = 1500): Promise<Tri> {
  const isChromium = typeof (window as { chrome?: unknown }).chrome !== 'undefined';
  if (!isChromium) return Promise.resolve('unknown');
  const probe = (id: string) =>
    new Promise<boolean>((resolve) => {
      const img = new Image();
      const timer = setTimeout(() => resolve(false), timeoutMs);
      img.onload = () => { clearTimeout(timer); resolve(true); };
      img.onerror = () => { clearTimeout(timer); resolve(false); };
      img.src = `chrome-extension://${id}/icon-16x16.png`;
    });
  return Promise.all(ids.map(probe)).then((r) => (r.some(Boolean) ? 'yes' : 'no'));
}

/**
 * Login probe: hidden iframe from todofor.ai checks its own first-party session
 * (embed/status page) and postMessages the result back. Browsers that partition
 * third-party storage (Safari, FF strict) report 'unknown' rather than a false 'no'.
 */
export function detectLogin(origin: string, timeoutMs = 5000): Promise<Tri> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = `${origin}/embed/status.html`;
    const done = (v: Tri) => {
      window.removeEventListener('message', onMsg);
      iframe.remove();
      resolve(v);
    };
    const timer = setTimeout(() => done('unknown'), timeoutMs);
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== origin || e.source !== iframe.contentWindow) return;
      const d = e.data as { type?: string; loggedIn?: Tri };
      if (d?.type !== 'todoforai:status') return;
      clearTimeout(timer);
      done(d.loggedIn ?? 'unknown');
    };
    window.addEventListener('message', onMsg);
    (document.body || document.documentElement).appendChild(iframe);
  });
}

export function detectStatus(origin: string, extensionIds: string[]): Promise<Status> {
  return Promise.all([detectLogin(origin), detectExtension(extensionIds)]).then(
    ([loggedIn, extension]) => ({ loggedIn, extension }),
  );
}
