import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Shared by the 4 verification checks
export const VerificationResultSchema = z.object({
  status: z.enum(["FLAG", "NO_FLAG", "UNDETERMINED"]),
  evidence: z.string(),
  sources: z.array(z.string()),
});
export type VerificationResult = z.infer<typeof VerificationResultSchema>;

export const PublicationResultSchema = z.object({
  works: z.array(
    z.object({
      title: z.string(),
      authors: z.string(),
      year: z.number(),
      relevance: z.string(),
      sources: z.array(z.string()),
    }),
  ),
});
export type PublicationResult = z.infer<typeof PublicationResultSchema>;

export const BackgroundWorkResultSchema = z.object({
  works: z.array(
    z.object({
      relevance_level: z.number().int().min(1).max(5),
      organism: z.string(),
      sources: z.array(z.string()),
      work_summary: z.string(),
    }),
  ),
});
export type BackgroundWorkResult = z.infer<typeof BackgroundWorkResultSchema>;

export const SecureDnaMockResultSchema = z.object({
  flagged: z.boolean(),
  concerns: z.array(
    z.object({
      organism: z.string(),
      riskLevel: z.enum(["high", "medium", "low"]),
      description: z.string(),
    }),
  ),
});
export type SecureDnaMockResult = z.infer<typeof SecureDnaMockResultSchema>;

export const CoauthorResultSchema = z.object({
  coauthors: z.array(
    z.object({
      name: z.string(),
      institution: z.string(),
      email: z.string().optional(),
      relationship: z.string(),
    }),
  ),
  suggestedVerificationEmails: z.array(
    z.object({
      recipientName: z.string(),
      recipientEmail: z.string(),
      reason: z.string(),
    }),
  ),
});
export type CoauthorResult = z.infer<typeof CoauthorResultSchema>;

// Convert Zod schemas to JSON Schema for OpenRouter response_format
export function toResponseFormat(schema: z.ZodType, name: string) {
  const jsonSchema = zodToJsonSchema(schema, { target: "openApi3" });
  return {
    type: "json_schema" as const,
    json_schema: {
      name,
      strict: true,
      schema: jsonSchema,
    },
  };
}
