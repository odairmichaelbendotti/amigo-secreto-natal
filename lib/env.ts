// Validate required environment variables at startup
// This file should be imported early in the app lifecycle

function validateEnv() {
  const required: Record<string, string> = {
    DATABASE_URL: "PostgreSQL connection string",
    SESSION_SECRET: "Chave de criptografia das sessões (pelo menos 32 caracteres)",
  };

  const recommended: Record<string, string> = {
    NEXTAUTH_URL: "Endereço público da aplicação para os pagamentos",
  };

  const missing: string[] = [];
  const warnings: string[] = [];

  for (const [key, description] of Object.entries(required)) {
    if (!process.env[key]) {
      missing.push(`  - ${key}: ${description}`);
    }
  }

  for (const [key, description] of Object.entries(recommended)) {
    if (!process.env[key]) {
      warnings.push(`  - ${key}: ${description}`);
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `\n⚠️  Missing recommended environment variables:\n${warnings.join("\n")}\n`
    );
  }

  if (missing.length > 0) {
    console.error(
      `\n❌ Missing required environment variables:\n${missing.join("\n")}\n`
    );
    throw new Error(
      `Missing required environment variables: ${missing.map((m) => m.split(":")[0].trim().replace("- ", "")).join(", ")}`
    );
  }
}

// Run validation when this module is imported
validateEnv();

export {};
