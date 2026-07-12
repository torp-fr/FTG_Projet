import "server-only";

/**
 * Identité de l'opérateur FTG (dev) + garde admin simple.
 *
 * JC-07 : un garde admin simple suffit (le durcissement auth complet est JC-08). L'identité
 * opérateur est configurée par l'env (jamais NEXT_PUBLIC_) et STAMPÉE sur chaque acte dans
 * l'audit trail. La console est server-only + service_role (jamais exposée au navigateur).
 */
export interface Operator {
  name: string;
  email: string;
  label: string;
}

export function getOperator(): Operator {
  const name = process.env.FTG_ADMIN_OPERATOR_NAME?.trim() || "Opérateur FTG (dev)";
  const email = process.env.FTG_ADMIN_OPERATOR_EMAIL?.trim() || "ops@ftg.test";
  return { name, email, label: `${name} <${email}>` };
}
