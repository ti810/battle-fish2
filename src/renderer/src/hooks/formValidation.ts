import { core, z } from "zod";
import { id } from "zod/locales";

export async function formValidation<T>(
  schema: z.ZodType<T>,
  data: unknown
) /*{ success: true; data: T } | { success: false; errors: string[] }*/ {
  const result = await schema.safeParseAsync(data);

  if (!result.success) {
    return {
      success: false,
      fieldErrors: result.error.flatten().fieldErrors ?? {},
      // errors: result.error.issues.map((err) => err.message),
      // errors: result.error.flatten().fieldErrors
    };
  }

  return {
    success: true as const,
    data: result.data,
  };
}

export const equipeSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(4, "Nome da Equipe está muito curtao(Minimo 4 caracteres)")
    .max(50, "Nome da Equipe é muito longo"),
  setor: z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") {
        return undefined;
      }

      return Number(value);
    },
    z.number().optional()
  ),
  tipo_equipe: z.enum(["Masculino", "Misto", "Senior"], {
    error: "Selecione o tipo da equipe",
  }),
});

export const peixeSchema = z.object({
  // tipo: z
  //   .string()
  //   .trim()
  //   .min(3, 'Nome do peixe está muito curto')
  //   .max(50, 'Nome do peixe está muito longo'),
  // tamanho: z.number().min(1, 'Tamanho deve ser maior que 1cm'),
  peso: z
    .string()
    .min(1, "Peso é obrigatório")
    .transform((val) => Number(val.replace(",", ".").replace(/[^\d,]/g, ""))) // Remove pontos e substitui vírgula por ponto
    .refine((val) => !isNaN(val), {
      message: "Peso inválido - ",
    })
    .refine((val) => val > 150, {
      message: "Peso deve ser maior que 150g",
    }),
  equipe_id: z.number().min(1, "Equipe é obrigatória"),
});

export const atletaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(4, "Nome do atleta muito curto: Mínimo 4 caracteres")
    .max(50, "Nome do atleta muito grande: Máximo 50 caracteres"),
  equipe_id: z.number().min(1, "Selecione uma Equipe"),
});

// export const campeonatoSchema = z.object({
//   nome: z
//     .string()
//     .trim()
//     .min(1, "Nome do campeonato é obrigatório")
//     .refine(
//       (val) => {
//         if (val != "" && val.length < 4) return false;
//         return true;
//       },
//       { message: "Nome do campeonato muito curto: Mínimo 4 caracteres" }
//     )
//     .max(50, "Nome do campeonato muito grande: Máximo 50 caracteres"),
//   data_inicial: z.string().min(1, "Data inicial é obrigatório"),
//   data_final: z.string().min(1, "Data final é obrigatório"),
// });

export const campeonatoSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(1, "Nome do campeonato é obrigatório")
      .refine(
        (val) => {
          if (val != "" && val.length < 4) return false;
          return true;
        },
        { message: "Nome do campeonato muito curto: Mínimo 4 caracteres" }
      )
      .max(50, "Nome do campeonato muito grande: Máximo 50 caracteres"),

    data_inicial: z.coerce.string().min(1, "Data Inicial é obrigatória"),

    data_final: z.coerce.string().min(1, "Data Final é obrigatória"),
  })
  .superRefine((values, ctx) => {
    const agora = new Date();
    agora.setSeconds(0);
    agora.setMilliseconds(0);

    const inicial = new Date(values.data_inicial);
    const final = new Date(values.data_final);

    if (inicial < agora) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data inicial não pode ser menor que a atual",
        path: ["data_inicial"],
      });
    }

    if (final < inicial) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data final não pode ser menor que a data inicial",
        path: ["data_final"],
      });
    }
  });
