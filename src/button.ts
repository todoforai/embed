export const LOGO = `<svg viewBox="0 0 100 100" width="16" height="16" aria-hidden="true"><path d="M20 7 Q20 5 22 5 H78 Q80 5 80 7 V23 Q80 25 78 25 H60 V48 Q60 50 58 50 H42 Q40 50 40 48 V25 H22 Q20 25 20 23 Z" fill="#ff4500"/><path d="M40 50 L60 50 L65 60 L60 70 L55 80 L50 90 L45 80 L40 70 L35 60 Z" fill="#ff7700"/><path d="M42 50 L58 50 L62 57 L58 65 L54 73 L50 81 L46 73 L42 65 L38 57 Z" fill="#ffaa00"/></svg>`;

// The flame mark and the click flow are the fixed brand contract. Everything
// visual is owner-themable via --todoai-* custom properties, which inherit
// through the shadow boundary from the host page:
//   todoforai-button { --todoai-bg: #0af; --todoai-radius: 999px; }
const CSS = `
:host { all: initial; display: inline-block; }
button {
  display: inline-flex; align-items: center; gap: 8px;
  font: var(--todoai-font, 600 14px/1 system-ui, -apple-system, sans-serif);
  padding: var(--todoai-padding, 10px 16px);
  border-radius: var(--todoai-radius, 10px);
  cursor: pointer;
  border: 1px solid var(--todoai-border, transparent);
  background: var(--todoai-bg, var(--_bg));
  color: var(--todoai-color, var(--_color));
  transition: filter .15s, transform .05s;
}
button:hover { filter: brightness(1.1); }
button:active { transform: scale(.98); }
.mark { display: inline-flex; line-height: 0; border-radius: 5px; }
/* Custom --todoai-bg can swallow the orange flame — sit it on a small chip.
   Negative margin cancels the padding so layout doesn't shift. */
button.chip .mark { background: var(--todoai-mark-bg, #fff); padding: 3px; margin: -3px; }
button.dark { --_bg: #16161a; --_color: #fff; border-color: var(--todoai-border, #333); }
button.light { --_bg: #fff; --_color: #16161a; border-color: var(--todoai-border, #ddd); }
`;

/**
 * The flame mark — the standard's repeating element. Injected into headless
 * triggers too (unless data-todo-no-mark), so it recurs across every site.
 * Sized to the surrounding font; placement via an empty [data-todo-mark] span.
 */
export function makeMark(margin = true): HTMLElement {
  const span = document.createElement('span');
  span.innerHTML = LOGO;
  span.style.cssText = `display:inline-block;vertical-align:-2px;line-height:0${margin ? ';margin-left:.35em' : ''}`;
  const svg = span.firstElementChild as SVGElement;
  svg.setAttribute('width', '1em');
  svg.setAttribute('height', '1em');
  return span;
}

/** Shadow-DOM "AI, do it" button. Pure view; label/theme/vars are the owner's, the mark is ours. */
export function createButton(opts: { label: string; theme: 'dark' | 'light'; onClick: () => void }): HTMLElement {
  const host = document.createElement('todoforai-button');
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = CSS;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = opts.theme;
  btn.innerHTML = `<span class="mark">${LOGO}</span><span></span>`;
  (btn.lastElementChild as HTMLElement).textContent = opts.label;
  btn.addEventListener('click', opts.onClick);
  root.append(style, btn);
  // After the host is in the document: if the owner overrode the background,
  // the flame may not contrast with it — back the mark with a chip.
  requestAnimationFrame(() => {
    if (getComputedStyle(host).getPropertyValue('--todoai-bg').trim()) btn.classList.add('chip');
  });
  return host;
}
