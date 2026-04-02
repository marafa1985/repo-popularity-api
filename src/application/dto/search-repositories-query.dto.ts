import { z } from "zod";
import { ValidationError } from "@/application/domain/errors/application.error";

const utcTodayIsoDate = (): string => new Date().toISOString().slice(0, 10);

export const searchRepositoriesQuerySchema = z.object({
  createdAfter: z.iso
    .date({
      error:
        'Query parameter "createdAfter" must be a valid date in YYYY-MM-DD format.',
    })
    .refine((value) => value <= utcTodayIsoDate(), {
      message: 'Query parameter "createdAfter" cannot be in the future.',
    }),
  language: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, {
      message: 'Query parameter "language" is required.',
    })
    .refine((s) => s.length <= 50, {
      message: 'Query parameter "language" must be 50 characters or fewer.',
    }),
  page: z.coerce
    .number({
      error: 'Query parameter "page" must be a number.',
    })
    .int('Query parameter "page" must be an integer.')
    .min(1, 'Query parameter "page" must be greater than or equal to 1.'),
  perPage: z.coerce
    .number({
      error: 'Query parameter "perPage" must be a number.',
    })
    .int('Query parameter "perPage" must be an integer.')
    .min(1, 'Query parameter "perPage" must be greater than or equal to 1.'),
});

export type SearchRepositoriesQueryDto = z.infer<
  typeof searchRepositoriesQuerySchema
>;

export const validateSearchRepositoriesInput = (
  query: unknown,
): SearchRepositoriesQueryDto => {
  const parsedQuery = searchRepositoriesQuerySchema.safeParse(query);
  if (parsedQuery.success) {
    return parsedQuery.data;
  }

  throw new ValidationError(
    `Invalid search repositories query: ${parsedQuery.error.message}`,
  );
};
