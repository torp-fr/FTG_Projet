/**
 * Garde « serveur uniquement » pour @ftg/data-sources.
 *
 * Le paquet npm `server-only` s'appuie sur la condition d'export `react-server` de
 * Next.js et LÈVE une erreur sous Node/tsx pur — or les engines qui consomment cette
 * couche tournent sous tsx. On utilise donc une garde runtime équivalente : elle échoue
 * uniquement dans un environnement NAVIGATEUR (bundle client), pas sous Node. L'intention
 * est préservée : les clés API ne doivent jamais atteindre le navigateur.
 */
if (typeof window !== "undefined") {
  throw new Error(
    "@ftg/data-sources est réservé au serveur : ne l'importe pas dans un composant/bundle client (les clés API ne doivent jamais atteindre le navigateur).",
  );
}

export {};
