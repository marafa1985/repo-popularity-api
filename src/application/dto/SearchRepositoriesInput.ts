import { string, z } from "zod";

export const searchRepositoriesInputSchema = z.object({
  createdAfter: string(),
  language: string(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).default(20),
});

export type SearchRepositoriesInput = z.infer<
  typeof searchRepositoriesInputSchema
>;
