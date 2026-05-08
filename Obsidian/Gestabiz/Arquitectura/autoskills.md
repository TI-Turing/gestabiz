---
date: 2026-05-07
tags: [tooling, ia, skills, agentes, copilot, claude]
---

# autoskills — Auto-instalación de Skills para Agentes IA

> Herramienta que detecta las tecnologías del proyecto y descarga automáticamente las "skills" (instrucciones de mejores prácticas) para los agentes de IA (Cursor, Claude Code, GitHub Copilot).

---

## Qué es

`autoskills` es un CLI que:
1. **Detecta tecnologías** leyendo `package.json` y archivos de configuración del proyecto
2. **Descarga skills** desde repositorios públicos en GitHub (Vercel, Stripe, Supabase, shadcn, antfu, etc.)
3. **Las instala en `.agents/skills/`** como archivos Markdown con instrucciones de mejores prácticas
4. Los agentes de IA **leen esos archivos automáticamente** al trabajar con código de esa tecnología

---

## Instalación (realizada el 7 May 2026)

```bash
npx autoskills -y
```

Versión instalada: **v0.3.6**

---

## Skills instaladas (20)

Las skills viven en `.agents/skills/` en la raíz del repo.

| Skill | Tecnología | Autor |
|---|---|---|
| `react-best-practices` | React | vercel-labs |
| `composition-patterns` | React | vercel-labs |
| `frontend-design` | Frontend | anthropics |
| `typescript-advanced-types` | TypeScript | wshobson |
| `tailwind-css-patterns` | Tailwind CSS | giuseppe-trisciuoglio |
| `tailwind-v4-shadcn` ⚠️ | Tailwind + shadcn | secondsky |
| `shadcn` | shadcn/ui | shadcn |
| `supabase-postgres-best-practices` | Supabase | supabase |
| `react-hook-form` | React Hook Form | pproenca |
| `zod` | Zod | pproenca |
| `vite` | Vite | antfu |
| `vitest` | Vitest | antfu |
| `nodejs-backend-patterns` | Node.js | wshobson |
| `nodejs-best-practices` | Node.js | sickn33 |
| `bash-defensive-patterns` | Bash | wshobson |
| `stripe-best-practices` | Stripe | stripe |
| `upgrade-stripe` ⚠️ | Stripe | stripe |
| `deploy-to-vercel` | Vercel | vercel-labs |
| `accessibility` | Frontend | addyosmani |
| `seo` | SEO | addyosmani |

### Skills eliminadas manualmente

- `threejs-animation`, `threejs-fundamentals`, `threejs-geometry`, `threejs-interaction`, `threejs-lighting`, `threejs-loaders`, `threejs-materials`, `threejs-postprocessing`, `threejs-shaders`, `threejs-textures` — **falso positivo** (Three.js no se usa en el proyecto)

---

## Advertencias de seguridad

autoskills incluye un scanner de seguridad que reportó:

| Skill | Advertencia |
|---|---|
| `tailwind-v4-shadcn` | Instrucciones tipo prompt-injection, URL externa no relacionada, comando de eliminación de archivos (`rm -rf` en algún paso). Revisar antes de seguir ciegamente. |
| `upgrade-stripe` | Contiene placeholders `sk_test_xxx` (no son claves reales) y links externos a docs de Stripe. Verificar legitimidad. |

Ambas skills fueron instaladas de todas formas — son legítimas pero merecen revisión humana.

---

## Cómo actualizar

Cuando se agregue una tecnología nueva al proyecto o quieras refrescar las skills:

```bash
npx autoskills -y              # Reinstala todo (detecta cambios)
npx autoskills --dry-run       # Ver qué instalaría sin hacer cambios
npx autoskills --clear-cache   # Limpiar caché de skills descargadas
```

---

## Tecnologías detectadas

```
✔ React             ✔ Tailwind CSS      ✔ shadcn/ui
✔ TypeScript        ✔ React Hook Form   ✔ Zod
✔ Supabase          ✔ Vite              ✔ Vercel
✔ Three.js (!)      ✔ Node.js           ✔ Bash
✔ Stripe            ✔ Vitest
```

> Three.js fue un falso positivo — posiblemente detectado por alguna dependencia transitiva.

---

## Ver también

- [[stack-tecnologico]] — Stack completo del proyecto
- [[cicd-pipeline]] — CI/CD y deploy
