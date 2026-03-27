# reneferrari.github.io

Personal website for Rene Ferrari — built with [Astro](https://astro.build), Tailwind CSS, and deployed to GitHub Pages.

---

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

---

## Adding a new blog post

1. Create a new file in `src/content/blog/` with a `.md` extension (e.g. `my-post.md`)
2. Add the required frontmatter at the top:

```markdown
---
title: "Your Post Title"
description: "A short description shown on the blog index."
date: 2025-06-01
tags: ["Android", "Kotlin"]
readTime: "5 min read"
---

Your content here. Kotlin syntax highlighting works out of the box:

```kotlin
fun main() {
    println("Hello, World!")
}
```
```

3. The post will be live at `/blog/your-post-filename`.

---

## Deploying

### GitHub Pages (recommended)

1. Push to the `main` branch — the GitHub Actions workflow at `.github/workflows/deploy.yml` builds and deploys automatically.
2. First-time setup: go to **Settings → Pages → Source**, select **GitHub Actions**.

### Netlify

1. Connect your GitHub repo in the Netlify dashboard.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. The `netlify.toml` at the repo root handles this automatically.

### Vercel

```bash
npm i -g vercel
vercel
```

Vercel auto-detects Astro. No config needed.

---

## Tech stack

- [Astro](https://astro.build) — static site generator
- [Tailwind CSS](https://tailwindcss.com) — utility-first CSS
- [Shiki](https://shiki.style) — syntax highlighting (built into Astro)
- TypeScript throughout
