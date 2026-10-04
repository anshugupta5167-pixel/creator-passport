/** Returns true for hosting platforms where function instances do not share a disk. */
export function isEphemeralRuntime(): boolean {
  return false;
}

export function isPersistentDataConfigured(): boolean {
  return true;
}
