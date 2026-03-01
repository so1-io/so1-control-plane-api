import { z } from "zod";

/**
 * Job state enum.
 */
export enum JobState {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/**
 * Job model: represents a long-running operation.
 */
export const JobSchema = z.object({
  id: z.string().uuid().describe("Unique job ID"),
  state: z.nativeEnum(JobState).describe("Current job state"),
  createdAt: z.string().datetime().describe("When job was created"),
  startedAt: z.string().datetime().optional().describe("When job started"),
  completedAt: z.string().datetime().optional().describe("When job completed"),
  output: z.unknown().optional().describe("Job output/result"),
  error: z.object({ code: z.string(), message: z.string() }).optional().describe("Error details if failed"),
  logs: z.array(z.string()).default([]).describe("Streaming logs"),
  metadata: z
    .object({
      requestId: z.string().uuid(),
      userId: z.string(),
      orgId: z.string(),
      action: z.string().describe("Job action name"),
      inputs: z.unknown().describe("Job inputs (may be redacted)"),
    })
    .describe("Audit metadata"),
});

export type Job = z.infer<typeof JobSchema>;

/**
 * Job status response.
 */
export const JobStatusSchema = z.object({
  requestId: z.string().uuid(),
  job: JobSchema,
});

export type JobStatus = z.infer<typeof JobStatusSchema>;
