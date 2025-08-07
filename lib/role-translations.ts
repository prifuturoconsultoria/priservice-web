// Role translation utilities for UI display

export const ROLE_TRANSLATIONS = {
  admin: 'Administrador',
  technician: 'Técnico', 
  observer: 'Verificador'
} as const;

export type Role = keyof typeof ROLE_TRANSLATIONS;

/**
 * Get the Portuguese translation for a role
 * @param role - The database role (admin, technician, observer)
 * @returns The Portuguese translation for UI display
 */
export function getRoleTranslation(role: string | null | undefined): string {
  if (!role) return 'N/A';
  return ROLE_TRANSLATIONS[role as Role] || role;
}

/**
 * Get all available roles with their translations
 * @returns Array of role objects with value and label
 */
export function getRoleOptions() {
  return Object.entries(ROLE_TRANSLATIONS).map(([value, label]) => ({
    value,
    label
  }));
}