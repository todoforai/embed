/** Tri-state: detection can be genuinely unknowable (Safari 3P-cookie partitioning, Firefox ext ids). */
export type Tri = 'yes' | 'no' | 'unknown';

export interface Status {
  loggedIn: Tri;
  extension: Tri;
}

export interface MountOptions {
  /** Template id from the todofor.ai registry — the preconfigured todo this button triggers. */
  template?: string;
  /** Or: the todo written right here, verbatim. One of template/prompt is required. */
  prompt?: string;
  /** With `prompt`: requirements the todo needs, e.g. ['cli:gh', 'extension:chrome'].
   *  (Templates carry their own requirements in the registry.) */
  requirements?: string[];
  label?: string;
  theme?: 'dark' | 'light';
  /** Gate button visibility on detection. Default 'always'. */
  visibleWhen?: 'always' | 'logged-in' | 'extension';
  target?: '_blank' | '_self';
  /** Headless only: set false (data-todo-no-mark) to omit the flame mark. Default: injected. */
  mark?: boolean;
  /** Override the runner (B-seam). Default: redirect to todofor.ai/template/<id>. */
  runner?: Runner;
}

export interface RunContext {
  template?: string;
  prompt?: string;
  requirements?: string[];
  status: Status;
  target: '_blank' | '_self';
  /** The host page the button lives on — a future in-page runner acts here. */
  page: { url: string; title: string };
}

/**
 * Runner = what happens on click. v1 ships only the redirect runner (open the
 * template deep-link on todofor.ai). The planned B runners plug in here without
 * touching button/detection code:
 *   - extension runner: hand the template to the installed extension, which
 *     registers this tab as a browser device and drives it (CDP via debugger).
 *   - page-shim runner: register the page itself as a device over WS and expose
 *     a CDP-like DOM shim — for when the todo only needs to act on this page.
 */
export interface Runner {
  run(ctx: RunContext): void;
}
