import { z } from "zod";

// URL parameter `:id` of a route. Only a valid UUID is accepted.
export const idParamsSchema = z.object({ id: z.uuid() });
