import { z } from 'zod'

export function formValidation<T>(
  schema: z.ZodType<T>,
  data: unknown
) /*{ success: true; data: T } | { success: false; errors: string[] }*/ {
  const result = schema.safeParse(data)

  if (!result.success) {
    return {
      success: false,
      fieldErrors: result.error.flatten().fieldErrors ?? {}
      // errors: result.error.issues.map((err) => err.message),
      // errors: result.error.flatten().fieldErrors
    }
  }

  return {
    success: true as const,
    data: result.data
  }
}

export const grupoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(4, 'Nome do Grupo está muito curto (Minimo 4 caracteres)')
    .max(50, 'Nome do Grupo é muito longo'),
  qtde_membros: z.number().min(2, 'Quantidade de Membros por Grupos tem que ser no minimo 2')
})
