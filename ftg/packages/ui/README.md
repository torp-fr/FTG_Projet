# @ftg/ui

Design system partagé entre les 3 consoles (`apps/porteur`, `apps/cockpit-b2b`, `apps/admin`).

## Skill `ui-ux-pro-max` — reçu, vendorisé, pas encore personnalisé

Le skill est archivé tel quel dans `vendor/ui-ux-pro-max-skill-main.zip` (v2.6.2, 84 styles UI, 161 palettes, 73 pairings typo, 99 guidelines UX, 25 types de graphiques, éditeur NextLevelBuilder, licence MIT ; 479 fichiers, ~15 Mo décompressé). Il expose plusieurs sous-skills (`design-system`, `brand`, `ui-styling`, `banner-design`, `slides`, `ui-ux-pro-max`) sous `.claude/skills/` une fois décompressé.

**Pourquoi un zip et pas l'arborescence éclatée** : 479 fichiers dépassent la limite de l'upload web GitHub par lot — gardé compressé en un seul fichier, plus simple à versionner et à transporter tant qu'il n'est pas personnalisé. `unzip ui-ux-pro-max-skill-main.zip` pour l'explorer/l'utiliser localement.

Conforme à Chantier 11 §D2 (« cloner/personnaliser, pas juste utiliser ») : ce zip est la **copie source intacte**, jamais modifiée directement. La version personnalisée FTG (palette de marque, tons, gabarits alignés sur le référentiel de jalons) sera dérivée dans un skill propre `ftg-design` (fichiers réels versionnés, pas un zip) au moment du Lot 5 (habillage final des 3 consoles) — ou plus tôt si on veut l'appliquer dès le prototype du Lot 2 (cockpit B2B).

Tant que la personnalisation n'est pas faite, ce package reste un socle minimal (tokens de couleur, typographie) pour ne pas bloquer le Lot 2. Le template Cockpit B2B déjà généré via Claude Design (Addendum §10) reste la référence de mise en page à combiner avec ce skill.
