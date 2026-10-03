/** Returns true for hosting platforms where function instances do not share a disk. */
export function isEphemeralRuntime(): boolean {
  return Boolean(
    process.env.VERCEL ||
    process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.NOW_REGION ||
    process.env.FUNCTIONS_WORKER_RUNTIME
  );
}

export function isPersistentDataConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}
