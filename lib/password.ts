export interface PasswordValidation {
  valid: boolean;
  error?: string;
}

export function validatePassword(password: string): PasswordValidation {
  if (typeof password !== "string" || password.length < 4) {
    return {
      valid: false,
      error: "A senha deve ter pelo menos 4 caracteres",
    };
  }

  return { valid: true };
}
