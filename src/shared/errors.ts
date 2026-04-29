export class SkillSyncError extends Error {
  constructor(
    message: string,
    readonly code = "SKILL_SYNC_ERROR"
  ) {
    super(message);
    this.name = "SkillSyncError";
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
