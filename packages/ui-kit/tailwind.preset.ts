import type { Config } from "tailwindcss";

/**
 * Preset Tailwind du ui-kit (JC-09). Redirige les couleurs et rayons UTILISÉS vers les tokens
 * CSS (src/tokens.css), SANS changer aucune classe des composants ni aucune valeur : chaque
 * token porte la valeur Tailwind d'origine, donc `rgb(var(--x) / 1)` === la couleur d'origine.
 * Les canaux « R G B » préservent les modificateurs d'opacité (ex. bg-white/70).
 *
 * Effet : l'habillage (JC-08b) = éditer tokens.css en UN point, propagé aux 3 apps. Aucun choix
 * de design ici (valeurs neutres actuelles). Les apps activent ce preset via `presets: [...]`.
 */
const shade = (fam: string, s: string) => `rgb(var(--ftg-color-${fam}-${s}) / <alpha-value>)`;
const family = (fam: string, shades: string[]): Record<string, string> =>
  Object.fromEntries(shades.map((s) => [s, shade(fam, s)]));

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        white: "rgb(var(--ftg-color-white) / <alpha-value>)",
        slate: family("slate", ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]),
        emerald: family("emerald", ["50", "200", "300", "400", "600", "700", "800", "900"]),
        amber: family("amber", ["50", "100", "200", "300", "400", "500", "700", "800", "900"]),
        violet: family("violet", ["50", "200", "300", "700", "800"]),
        blue: family("blue", ["50", "200", "300", "700"]),
        rose: family("rose", ["50", "200", "300", "600", "700", "800"]),
      },
      borderRadius: {
        DEFAULT: "var(--ftg-radius-DEFAULT)",
        md: "var(--ftg-radius-md)",
        lg: "var(--ftg-radius-lg)",
        full: "var(--ftg-radius-full)",
      },
    },
  },
};

export default preset;
