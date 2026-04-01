---
mode: agent
description: Agrega una clave de traducción nueva a Gestabiz en ES y EN simultáneamente.
tools:
  - read_file
  - replace_string_in_file
  - file_search
---

Agrega una clave de traducción nueva a Gestabiz en ES y EN simultáneamente.

## Pasos

1. Identificar el módulo al que pertenece la clave (appointments, employees, billing, absences, etc.)
2. Leer el archivo ES del módulo en `src/locales/es/<módulo>.ts`
3. Leer el archivo EN del mismo módulo en `src/locales/en/<módulo>.ts`
4. Agregar la clave en el lugar correcto manteniendo el orden alfabético o el agrupamiento existente
5. Para EN: si no hay traducción confirmada, usar el valor ES entre corchetes como placeholder: `"[Texto en español]"` — pero si el texto es obvio, traducirlo directamente

## Glosario obligatorio

| ES | EN |
|----|----|
| Cita | Appointment |
| Egreso | Expense |
| Sede | Location |
| Negocio | Business |
| Dueño | Owner |
| Utilidad neta | Net profit |
| Ausencia | Leave |
| Vacante | Job opening |
| Festivo | Public holiday |
| Reclutamiento | Recruitment |
| Agendamiento | Scheduling |
| Ingreso | Income / Revenue |
| Reseña | Review |

## Reglas

- Los archivos usan TypeScript exports, no JSON: `export const appointments = { ... }`
- Mantener el mismo orden de claves en ES y EN — crítico para revisión manual
- Nunca eliminar claves existentes sin confirmación explícita
- Produccir TypeScript válido — sin trailing commas incorrectas

## Output

Mostrar diff exacto de qué se agregó en cada archivo antes de aplicar cambios. Confirmar el módulo y la clave antes de editar.
