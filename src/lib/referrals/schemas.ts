import { z } from 'zod'

export const payoutDetailsSchema = z.object({
  full_name: z.string().min(3, 'Nombre completo requerido (mínimo 3 caracteres)'),
  document_type: z.enum(['CC', 'CE', 'PPT', 'NIT', 'PAS'], {
    required_error: 'Selecciona un tipo de documento',
  }),
  document_number: z.string().min(5, 'Número de documento inválido'),
  mp_email: z
    .string()
    .email('Ingresa un email válido de MercadoPago')
    .min(1, 'Email de MercadoPago requerido'),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  account_type: z.enum(['savings', 'checking']).optional(),
})

export type PayoutDetailsFormValues = z.infer<typeof payoutDetailsSchema>
