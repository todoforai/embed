import { WEB_ORIGIN, EXTENSION_IDS } from './config';
import { detectStatus } from './detect';
import { createButton, makeMark } from './button';
import { redirectRunner } from './runner-redirect';
import type { MountOptions, Status, Tri } from './types';

export type { MountOptions, Status, Tri, Runner, RunContext } from './types';

// App origin: data-origin override > the origin embed.js was served from (makes
// dev on localhost:3000 just work) > prod fallback.
const script = document.currentScript as HTMLScriptElement | null;
const origin = script?.dataset.origin ?? (script?.src ? new URL(script.src).origin : WEB_ORIGIN);

let statusPromise: Promise<Status> | null = null;
/** Cached; mount() and the host page's own logic share one detection pass. */
export function status(): Promise<Status> {
  return (statusPromise ??= detectStatus(origin, EXTENSION_IDS));
}

function makeOnClick(opts: MountOptions, getStatus: () => Status) {
  const runner = opts.runner ?? redirectRunner(origin);
  return () =>
    runner.run({
      template: opts.template,
      prompt: opts.prompt,
      requirements: opts.requirements,
      status: getStatus(),
      target: opts.target ?? '_blank',
      page: { url: location.href, title: document.title },
    });
}

function applyVisibility(el: HTMLElement, visibleWhen: MountOptions['visibleWhen'], setStatus: (s: Status) => void) {
  if (visibleWhen && visibleWhen !== 'always') el.style.display = 'none';
  status().then((s) => {
    setStatus(s);
    if (visibleWhen === 'logged-in' && s.loggedIn !== 'no') el.style.display = '';
    if (visibleWhen === 'extension' && s.extension === 'yes') el.style.display = '';
  });
}

/** Render our button (flame mark fixed; label/theme/--todoai-* vars are the owner's). */
export function mount(container: HTMLElement, opts: MountOptions): () => void {
  let current: Status = { loggedIn: 'unknown', extension: 'unknown' };
  const el = createButton({
    label: opts.label ?? 'DO it AI',
    theme: opts.theme ?? 'dark',
    onClick: makeOnClick(opts, () => current),
  });
  container.appendChild(el);
  applyVisibility(el, opts.visibleWhen, (s) => (current = s));
  return () => el.remove();
}

/**
 * Headless: the owner's own element becomes the trigger — we attach behavior,
 * plus the flame mark (the standard's required element). Placement: an empty
 * [data-todo-mark] child if present, else appended. Opt out: mark: false /
 * data-todo-no-mark.
 */
export function attach(el: HTMLElement, opts: MountOptions): () => void {
  let current: Status = { loggedIn: 'unknown', extension: 'unknown' };
  const onClick = makeOnClick(opts, () => current);
  el.addEventListener('click', onClick);
  if (opts.mark !== false) {
    const slot = el.querySelector<HTMLElement>('[data-todo-mark]');
    if (slot) slot.replaceChildren(makeMark(false));
    else el.appendChild(makeMark());
  }
  applyVisibility(el, opts.visibleWhen, (s) => (current = s));
  return () => el.removeEventListener('click', onClick);
}

function optsFrom(d: DOMStringMap): MountOptions {
  return {
    template: d.todoTemplateId,
    prompt: d.todoPrompt,
    requirements: d.todoRequirements?.split(',').map((r) => r.trim()).filter(Boolean),
    mark: 'todoNoMark' in d ? false : undefined,
    label: d.label,
    theme: d.theme as MountOptions['theme'],
    visibleWhen: d.visibleWhen as MountOptions['visibleWhen'],
    target: d.target as MountOptions['target'],
  };
}

/**
 * Declarative forms:
 *   <script src=".../embed.js" data-todo-prompt="..."> — our button after the tag
 *   <span data-todo-template-id="...">                 — our button in the element
 *   <button data-todo-trigger data-todo-prompt="...">My own button</button>
 *                                                      — headless, owner's element
 */
function autoMount() {
  if (script?.dataset.todoTemplateId || script?.dataset.todoPrompt) {
    const holder = document.createElement('span');
    script.insertAdjacentElement('afterend', holder);
    mount(holder, optsFrom(script.dataset));
  }
  const scan = () =>
    document
      .querySelectorAll<HTMLElement>('[data-todo-template-id]:not([data-todoforai-mounted]), [data-todo-prompt]:not([data-todoforai-mounted])')
      .forEach((node) => {
        node.dataset.todoforaiMounted = '1';
        if ('todoTrigger' in node.dataset) attach(node, optsFrom(node.dataset));
        else mount(node, optsFrom(node.dataset));
      });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
}

declare global {
  interface Window { TodoForAI: { mount: typeof mount; attach: typeof attach; status: typeof status }; }
}
window.TodoForAI = { mount, attach, status };
autoMount();
