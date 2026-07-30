import type { Runner } from './types';

/**
 * Runner A: open the app's existing deep-links — /template/<id> (registry) or
 * /new?prompt=<text> (inline prompt). Both prefill the composer; login wall,
 * requirement banners and execution are all handled by the app itself.
 */
export function redirectRunner(origin: string): Runner {
  return {
    run(ctx) {
      const url = ctx.template
        ? `${origin}/template/${encodeURIComponent(ctx.template)}`
        : `${origin}/new?prompt=${encodeURIComponent(ctx.prompt ?? '')}` +
          (ctx.requirements?.length ? `&requirements=${encodeURIComponent(ctx.requirements.join(','))}` : '');
      if (ctx.target === '_self') location.href = url;
      else window.open(url, '_blank', 'noopener');
    },
  };
}
