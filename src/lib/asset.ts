// Clarity — public asset URLs.
//
// Everything in `public/` is referenced elsewhere in this codebase by a
// root-absolute string like `/clarity/aurora.mp4`. That works in dev (where
// Vite serves from `/`) and would still work on a custom domain, but this app
// is deployed as a GitHub Pages *project* page — `github.io/clarity/` — so in
// production every one of those strings needs the site's base folder
// prepended, or the browser requests it from the domain root and gets a 404.
//
// Vite does this automatically for its own emitted tags (the built
// `<script>`/`<link>` in index.html) via the `base` config in vite.config.ts,
// but it has no way to know that a plain string passed to `<video src>` is a
// path into `public/` — so every such reference in this app is routed through
// here instead of being written as a literal string.
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL; // "/" in dev, "/clarity/" in production
  return base + path.replace(/^\/+/, "");
}
