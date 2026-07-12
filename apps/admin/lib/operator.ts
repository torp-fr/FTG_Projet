import "server-only";
import { getSessionOperator } from "./auth";

/**
 * Identité de l'opérateur FTG pour l'AUDIT. Désormais résolue depuis la SESSION réelle
 * (auth Supabase) : chaque acte est attribué à l'opérateur connecté. Repli sur l'identité
 * d'env uniquement hors requête authentifiée (scripts/dev) — jamais en usage console normal,
 * où le middleware garantit qu'un opérateur authentifié est présent.
 */
export interface Operator {
  name: string;
  email: string;
  label: string;
}

export async function getOperator(): Promise<Operator> {
  const session = await getSessionOperator();
  if (session?.isOperator) {
    const name = session.name ?? "Opérateur FTG";
    const email = session.email ?? "";
    return { name, email, label: email ? `${name} <${email}>` : name };
  }
  const name = process.env.FTG_ADMIN_OPERATOR_NAME?.trim() || "Opérateur FTG (dev)";
  const email = process.env.FTG_ADMIN_OPERATOR_EMAIL?.trim() || "ops@ftg.test";
  return { name, email, label: `${name} <${email}>` };
}
