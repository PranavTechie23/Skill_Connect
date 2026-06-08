/** Platform HR contacts use the `admin` userType (no dedicated HR role in schema). */

export function normalizeUserType(value: unknown): string {
  return (value ?? "").toString().toLowerCase().trim();
}

export function isHrUserType(userType: unknown): boolean {
  return normalizeUserType(userType) === "admin";
}

export function hrRoleLabel(): string {
  return "HR / Platform Support";
}
