import json, re

# ============================================================
# PHASES (Chantier 1 §2)
# ============================================================
phases = [
  {"code":"P0","name":"Le Porteur","order_hint":0,"entry_door_variant":"both"},
  {"code":"P1","name":"Idéation","order_hint":1,"entry_door_variant":"both"},
  {"code":"P2","name":"Exploration marché","order_hint":2,"entry_door_variant":"both"},
  {"code":"P3","name":"Preuves de demande","order_hint":3,"entry_door_variant":"both"},
  {"code":"P4","name":"Modèle économique","order_hint":4,"entry_door_variant":"both"},
  {"code":"P5","name":"Structuration","order_hint":5,"entry_door_variant":"both"},
  {"code":"P6","name":"Identité & marque","order_hint":6,"entry_door_variant":"both"},
  {"code":"P7","name":"Build","order_hint":7,"entry_door_variant":"both"},
  {"code":"P8","name":"Go-to-Market","order_hint":8,"entry_door_variant":"both"},
  {"code":"P9","name":"Première vente & bilan","order_hint":9,"entry_door_variant":"both"},
]

def flags(three_ways=False, devils_advocate=False, external_proof=False, pedagogy_quiz=False):
    return {"three_ways": three_ways, "devils_advocate": devils_advocate,
            "external_proof": external_proof, "pedagogy_quiz": pedagogy_quiz}

# code, name, phase, flags, branch, irreversible
M = []
def m(code, name, phase, tw=False, da=False, ep=False, pq=False, branch=None, irr=False):
    M.append({"code":code,"name":name,"phase":phase,
              "flags":flags(tw,da,ep,pq),"branch":branch,"irreversible":irr})

# --- P0 (+ P0-J0 Porte A, Amendement A3) ---
m("P0-J0","Intake idée (Porte A)","P0")
m("P0-J1","Profil fondateur complété","P0")
m("P0-J2","Mantra & objectifs internes","P0", da=True)
m("P0-J3","Capacité d'engagement quantifiée","P0")
m("P0-J4","Profil d'incarnation généré et compris","P0", pq=True)
m("P0-J5","Charte d'engagement FTG signée","P0", irr=True)

# --- P1 ---
m("P1-J1","Terrain de chasse cadré","P1")
m("P1-J2","Portefeuille d'idées constitué","P1")
m("P1-J3","Tour 1 : élimination par critères durs","P1")
m("P1-J4","Challenge multi-dimensions des survivantes","P1", tw=True, da=True)
m("P1-J5","Scoring de pré-faisabilité","P1")
m("P1-J6","Matching incarnation","P1")
m("P1-J7","Sélection argumentée","P1", tw=True)

# --- P2 ---
m("P2-J1","Périmètre d'étude défini","P2")
m("P2-J2","Taille & tendance du marché","P2", ep=True)
m("P2-J3","Cartographie concurrentielle","P2", ep=True)
m("P2-J4","Mining des douleurs clients","P2")
m("P2-J5","Segmentation & persona v1","P2")
m("P2-J6","Positionnement différenciant","P2", tw=True, da=True)
m("P2-J7","Rapport d'étude de marché assemblé","P2")
m("P2-J8","Verdict d'attractivité","P2", da=True)

# --- P3 ---
m("P3-J1","Hypothèses critiques formalisées","P3")
m("P3-J2","Plan de preuve composite","P3", tw=True)
m("P3-J3","Preuves online exécutées","P3")
m("P3-J4","Preuve comportementale exécutée","P3", ep=True)
m("P3-J5","Entretiens (pondéré)","P3", ep=True)
m("P3-J6","Score de preuve composite calculé","P3")
m("P3-J7","Verdict de validation","P3", da=True)

# --- P4 ---
m("P4-J1","3 voies de business model","P4", tw=True, da=True)
m("P4-J2","Modèle arbitré","P4")
m("P4-J3","Pricing v1","P4", ep=True)
m("P4-J4","Structure de coûts & coût de revient","P4")
m("P4-J5","Prévisionnel 3 ans (moteur déterministe)","P4")
m("P4-J6","Seuil de rentabilité & besoin de financement","P4")
m("P4-J7","Plan de financement (information)","P4")
m("P4-J8","Stress test","P4", da=True)

# --- P5 ---
m("P5-J1","Comparateur de statuts chiffré","P5", tw=True)
m("P5-J2","Choix arbitré + checkpoint professionnel","P5", ep=True)
m("P5-J3","Compréhension de l'imposition","P5", pq=True)
m("P5-J4","Checklist réglementaire sectorielle","P5")
m("P5-J5","Immatriculation guidée","P5", ep=True, irr=True)
m("P5-J6","Assurances en place","P5", ep=True)
m("P5-J7","Kit contractuel & conformité","P5")
m("P5-J8","Socle administratif","P5")

# --- P6 ---
m("P6-J1","Plateforme de marque","P6")
m("P6-J2","Naming : shortlist vérifiée","P6", tw=True, ep=True)
m("P6-J3","Nom choisi & sécurisé","P6", ep=True, irr=True)
m("P6-J4","Identité visuelle","P6", tw=True)
m("P6-J5","Kit de marque livré","P6")
m("P6-J6","Pitch & messages clés","P6", da=True)

# --- P7 (tronc commun + branches) ---
m("P7-J1","Contrat de scope MVP","P7", da=True)
m("P7-J2","Specs / cahier de production","P7")
m("P7-J3a","Build assisté","P7", branch="digital")
m("P7-J4a","Recette","P7", branch="digital")
m("P7-J5a","Mise en ligne","P7", branch="digital", ep=True)
m("P7-J3b","Sourcing structuré","P7", branch="physical", ep=True)
m("P7-J4b","Échantillons & qualité","P7", branch="physical", ep=True)
m("P7-J5b","Coût de revient final & logistique","P7", branch="physical")
m("P7-J3c","Offre packagée","P7", branch="service")
m("P7-J4c","Supports de vente","P7", branch="service")
m("P7-J5c","Capacité de production validée","P7", branch="service")
m("P7-J6","Parcours d'achat bout-en-bout","P7", ep=True, irr=True)
m("P7-J7","Outillage opérationnel","P7")

# --- P8 ---
m("P8-J1","Stratégie GTM 3 voies","P8", tw=True, da=True)
m("P8-J2","Plan d'action 30-60-90","P8")
m("P8-J3","Assets d'acquisition produits","P8")
m("P8-J4","Actions lancées","P8", ep=True)
m("P8-J5","Pipeline actif","P8", ep=True)
m("P8-J6","Coaching objections & itération du discours","P8")
m("P8-J7","Boucle de mesure hebdo","P8")

# --- P9 ---
m("P9-J1","Première vente encaissée","P9", ep=True, irr=True)
m("P9-J2","Bilan de lancement","P9")
m("P9-J3","Retour client n°1","P9")
m("P9-J4","Boucle d'itération","P9")
m("P9-J5","Certificat FTG & bascule","P9")

print(f"Total milestones: {len(M)}")

# ============================================================
# GATES (Chantier 1 §5)
# ============================================================
gates = [
  {"code":"G0","name":"Le Porteur","phase":"P0","weights":{"V2":60,"V3":40},"threshold":65,
   "critical_floors":{"V2":50},"verdict_policy":{"pivot_enabled":False,"arret_enabled":False,"max_reserves":3}},
  {"code":"G1","name":"Idéation","phase":"P1","weights":{"V1":20,"V2":15,"V3":30,"V4":35},"threshold":60,
   "critical_floors":{"V3":50},"verdict_policy":{"pivot_enabled":False,"arret_enabled":False,"max_reserves":3}},
  {"code":"G2","name":"Exploration marché","phase":"P2","weights":{"V1":25,"V2":10,"V3":10,"V4":55},"threshold":62,
   "critical_floors":{"V4":50},"verdict_policy":{"pivot_enabled":True,"arret_enabled":False,"max_reserves":3}},
  {"code":"G3","name":"Preuves de demande","phase":"P3","weights":{"V1":20,"V2":20,"V4":60},"threshold":65,
   "critical_floors":{"V4":55},"verdict_policy":{"pivot_enabled":True,"arret_enabled":True,"max_reserves":3}},
  {"code":"G4","name":"Modèle économique","phase":"P4","weights":{"V1":20,"V2":10,"V4":15,"V5":55},"threshold":62,
   "critical_floors":{"V5":50},"verdict_policy":{"pivot_enabled":True,"arret_enabled":True,"max_reserves":3}},
  {"code":"G5","name":"Structuration","phase":"P5","weights":{"V1":20,"V2":25,"V6":55},"threshold":70,
   "critical_floors":{"V6":65},"verdict_policy":{"pivot_enabled":False,"arret_enabled":True,"max_reserves":3}},
  {"code":"G6","name":"Identité & marque","phase":"P6","weights":{"V1":60,"V2":15,"V3":25},"threshold":60,
   "critical_floors":{},"verdict_policy":{"pivot_enabled":False,"arret_enabled":False,"max_reserves":3}},
  {"code":"G7","name":"Build","phase":"P7","weights":{"V1":45,"V2":20,"V5":20,"V6":15},"threshold":65,
   "critical_floors":{}, "verdict_policy":{"pivot_enabled":False,"arret_enabled":True,"max_reserves":3,
   "mandatory_milestone":"P7-J6"}},
  {"code":"G8","name":"Go-to-Market","phase":"P8","weights":{"V1":25,"V2":35,"V3":15,"V4":25},"threshold":62,
   "critical_floors":{"V2":55},"verdict_policy":{"pivot_enabled":True,"arret_enabled":True,"max_reserves":3}},
  {"code":"G9","name":"Première vente","phase":"P9","weights":{},"threshold":None,
   "critical_floors":{},"verdict_policy":{"binary_proof":"P9-J1"}},
]

# ============================================================
# MILESTONE DEPENDENCIES
# Détaillé pour P0/P1 (critère de fin de Lot 1) ; scaffold séquentiel par défaut
# pour P2-P9 (à affiner lors du chantier DAG détaillé — non bloquant Lot 1).
# ============================================================
deps = []
def dep(code, on, hardness="hard"):
    deps.append({"milestone": code, "depends_on": on, "hardness": hardness})

# P0 (Porte A: J0 -> J1 ; Porte B: J1 est racine)
dep("P0-J1", "P0-J0", "soft")   # soft: l'intake n'existe qu'en Porte A ; en Porte B ce jalon n'est pas instancié
dep("P0-J2", "P0-J1", "hard")
dep("P0-J3", "P0-J1", "hard")
dep("P0-J3", "P0-J2", "soft")
dep("P0-J4", "P0-J1", "hard")
dep("P0-J4", "P0-J2", "hard")
dep("P0-J4", "P0-J3", "hard")
dep("P0-J5", "P0-J4", "hard")

# P1 — P1-J1 ancre le passage de gate G0 (déverrouille P1)
dep("P1-J1", "P0-J5", "hard")
dep("P1-J2", "P1-J1", "hard")
dep("P1-J3", "P1-J2", "hard")
dep("P1-J4", "P1-J3", "hard")
dep("P1-J5", "P1-J4", "hard")
dep("P1-J6", "P1-J3", "hard")
dep("P1-J6", "P1-J4", "soft")
dep("P1-J7", "P1-J5", "hard")
dep("P1-J7", "P1-J6", "hard")

# P2..P9 : scaffold par défaut — première jalon de phase dépend (hard) du dernier
# jalon de la phase précédente (ancre de gate) ; jalons suivants dépendent (hard)
# du précédent dans l'ordre du référentiel. Remplacé au fil de l'eau par un DAG
# fin (parallélisation réelle) lors du chantier de calibration des dépendances.
phase_order = ["P0","P1","P2","P3","P4","P5","P6","P7","P8","P9"]
by_phase = {}
for milestone in M:
    by_phase.setdefault(milestone["phase"], []).append(milestone["code"])

already = {(d["milestone"], d["depends_on"]) for d in deps}
for i, ph in enumerate(phase_order):
    codes = by_phase.get(ph, [])
    if not codes:
        continue
    if ph in ("P0", "P1"):
        continue  # déjà détaillé ci-dessus
    prev_ph = phase_order[i-1] if i > 0 else None
    for j, code in enumerate(codes):
        if j == 0:
            if prev_ph and by_phase.get(prev_ph):
                anchor = by_phase[prev_ph][-1]
                if (code, anchor) not in already:
                    dep(code, anchor, "hard")
        else:
            prev_code = codes[j-1]
            if (code, prev_code) not in already:
                dep(code, prev_code, "hard")

print(f"Total dependencies: {len(deps)}")

# ============================================================
# WRITE referentiel_v1.1.json
# ============================================================
referentiel = {
  "semver": "1.1.0",
  "status": "active",
  "changelog": "V1.1 : intègre le DAG (Amendement A2), les 2 portes d'entrée dont P0-J0 (Amendement A3), la neutralité factuelle orientée solutions dans le nommage des verdicts (D25).",
  "phases": phases,
  "milestones": M,
  "milestone_dependencies": deps,
  "gates": gates,
}

with open("/home/claude/ftg/supabase/seed/referentiel_v1.1.json", "w", encoding="utf-8") as f:
    json.dump(referentiel, f, ensure_ascii=False, indent=2)

print("referentiel_v1.1.json written")
