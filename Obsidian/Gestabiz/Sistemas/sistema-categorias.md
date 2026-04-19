---
date: 2026-04-19
tags: [sistema, categorias, subcategorias, produccion]
status: completado
---

# Sistema de Categorías

15 categorías principales + ~60 subcategorías jerárquicas para clasificar negocios, con máximo 3 subcategorías por negocio.

## Descripción

Cada negocio elige una categoría principal (ej: "Salud y Bienestar") y hasta 3 subcategorías (ej: "Spa", "Peluquería", "Barbería"). Las categorías alimentan la búsqueda, el SEO y la clasificación en la plataforma.

## Tablas de Base de Datos

- `business_categories` — 15 categorías principales (id, name, description, icon)
- `business_subcategories` — ~60 subcategorías (id, category_id, name, description)
- `businesses.category_id` — FK a categoría principal
- `businesses.subcategory_ids[]` — Array de hasta 3 subcategorías

## Límite

**Máximo 3 subcategorías por negocio** — validado en frontend y backend.

## Ejemplos de Categorías

| Categoría | Subcategorías ejemplo |
|-----------|----------------------|
| Salud y Bienestar | Spa, Peluquería, Barbería, Dermatología |
| Deportes y Fitness | Gimnasio, Yoga, CrossFit, Natación |
| Educación | Tutorías, Idiomas, Música, Arte |
| Automotriz | Taller mecánico, Lavadero, Detailing |
| Gastronomía | Restaurante, Cafetería, Panadería |

## Hooks

- `useBusinessCategories()` — Lista todas las categorías
- `useBusinessSubcategories(categoryId?)` — Subcategorías por categoría

## Integración

- `BusinessRegistration` — Selección al crear negocio
- `BusinessProfile` / [[sistema-perfiles-publicos]] — Muestra categoría y subcategorías
- `SearchBar` / [[sistema-busqueda]] — Filtro por categoría
- `CompleteUnifiedSettings` / [[sistema-configuraciones]] — Edición

## Migraciones

- `EJECUTAR_SOLO_CATEGORIAS.sql` — Creación de tablas + seed data

## Archivos Clave

- `src/hooks/useBusinessCategories.ts`
- `src/hooks/useBusinessSubcategories.ts`
- `migrations_backup/EJECUTAR_SOLO_CATEGORIAS.sql`

## Notas Relacionadas

- [[sistema-busqueda]] — Filtro por categoría en búsqueda
- [[sistema-perfiles-publicos]] — Categoría mostrada en perfil público
- [[sistema-configuraciones]] — Edición de categoría en settings
- [[sectores-y-casos-de-uso]] — Verticales atendidos por categoría
