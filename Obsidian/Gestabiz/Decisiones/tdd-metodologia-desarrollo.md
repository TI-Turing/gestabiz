---
date: 2026-04-30
tags: [testing, tdd, metodologia, calidad]
---

# TDD como metodología de desarrollo

## Decisión

A partir del 30 de abril de 2026, **Gestabiz adopta Test-Driven Development (TDD)** como metodología oficial de desarrollo. Todo nuevo código de producción debe ir precedido de sus pruebas unitarias.

## Ciclo Red → Green → Refactor

1. **Red** — Escribir la prueba unitaria que define el comportamiento esperado. La prueba debe fallar porque el código aún no existe.
2. **Green** — Escribir el mínimo código necesario para que la prueba pase. No más, no menos.
3. **Refactor** — Limpiar y mejorar el código sin romper las pruebas.

## Motivación

- Garantizar calidad desde el principio, no como afterthought
- Forzar el diseño de la API/interfaz antes de la implementación (tests como especificación)
- Detectar regresiones automáticamente al refactorizar

## Infraestructura existente

El proyecto ya tiene todo lo necesario para TDD:

| Herramienta | Uso |
|------------|-----|
| Vitest 2.1.9 | Framework de testing |
| @testing-library/react | Testing de componentes React |
| `src/test-utils/render-with-providers.tsx` | Render con todos los providers |
| `src/test-utils/mock-factories.ts` | Factories para todos los tipos de datos |
| `src/test-utils/supabase-mock.ts` | Mock del cliente Supabase |
| `src/test-utils/mock-permissions.ts` | Mock del sistema de permisos |

**365+ archivos de test existentes** sirven como referencia de patrones.

## Convenciones

- Archivos: `__tests__/NombreArchivo.test.ts` o `.test.tsx` junto al archivo que testean
- Correr `npm run test:watch` durante el desarrollo para ciclo Red→Green inmediato
- Correr `npm run test` antes de cada commit para verificar que todo pasa

## Ver también

- [[stack-tecnologico]] — stack completo incluyendo Vitest
- [[cicd-pipeline]] — los tests corren en CI/CD automáticamente
