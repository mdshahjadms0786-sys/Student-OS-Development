import { z } from 'zod';

export const ApiResponseSchema = (dataSchema) =>
  z.object({
    success: z.boolean(),
    data: dataSchema ? dataSchema.optional() : z.unknown().optional(),
    message: z.string().optional(),
    errors: z.array(z.string()).optional(),
  });

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
