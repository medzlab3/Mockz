# 📖 Mockz — 3D Print & Book Mockup Studio

Bienvenue sur **Mockz**, l'outil web interactif de mockup 3D en temps réel pour supports pliés et reliés (cartes d'invitation, faire-part, livrets, brochures et livres).

---

## 🚀 Démarrage Rapide

```bash
# 1. Lancer le serveur de développement (déjà en cours sur http://localhost:5173)
npm run dev

# 2. Compiler pour la production
npm run build
```

Accédez à l'application dans votre navigateur : **[http://localhost:5173](http://localhost:5173)**

---

## ✨ Fonctionnalités Incluses (MVP & V2 Preview)

### 1. 🌐 Vue 3D Photoréaliste & Contrôles
- **Rotation orbitale libre à 360°** (clic gauche + glisser)
- **Zoom progressif** (molette de la souris)
- **Pan / Déplacement** (clic droit + glisser)
- **Vues caméra prédéfinies** : *Perspective*, *Face*, *Tranche*
- **Mode Rotation automatique 360°** pour admirer le rendu
- **Éclairage studio 3 points** avec ombres douces de contact au sol

### 2. 📖 Cinématique de Pli & Feuilletage
- **Base 4 volets minimum** conforme aux règles physiques de l'imprimerie :
  - **Page 1** : Première de couverture (Plat 1 - Extérieur recto)
  - **Page 2** : Deuxième de couverture (Plat 2 - Intérieur gauche)
  - **Page 3** : Troisième de couverture (Plat 3 - Intérieur droite)
  - **Page 4** : Quatrième de couverture (Plat 4 - Dos / Extérieur verso)
- **Curseur d'ouverture dynamique ($0^\circ$ à $180^\circ$)** avec presets : *Fermé (0°)*, *Entrouvert (75°)*, *À plat (180°)*
- **Feuilletage page par page** (boutons *Précédent* / *Suivant*)
- **Déformation & courbure naturelle du papier** lors du mouvement

### 3. 📄 Importateur Intelligent de PDF & Images
- **Import PDF automatique (100% côté client via Mozilla PDF.js)** :
  - Glissez-déposez n'importe quel PDF multi-pages.
  - Conversion instantanée en images haute définition 2K/1800px.
  - Répartition automatique sur les pages du mockup 3D.
- **Remplacement face par face** :
  - Glissez une image (PNG, JPG, WebP) sur le slot de votre choix dans la barre latérale.
- **Bouton démo en 1 clic** :
  - "Charger un exemple" : génère instantanément un faire-part / carte de gala de luxe 4 pages pour tester immédiatement.

### 4. 🖨️ Simulateur de Papiers & Finitions (Module V2)
- **Grammages physiques** :
  - **120g / m²** : Souple (effet magazine / papier fin) avec flexion prononcée.
  - **250g / m²** : Standard cartonné pour cartes de vœux et faire-part.
  - **350g / m²** : Cartonné épais de prestige, haute tenue et tranche 3D marquée.
- **Finitions de surface PBR** :
  - **Couché Mat** : Absence de reflets, toucher velouté.
  - **Couché Brillant** : Reflets vifs sous les spots de studio.
  - **Papier Kraft** : Teinte naturelle brune avec texture de fibres.
  - **Papier Vergé / Canson** : Grain tactile artistique.

### 5. 🤝 Mode Présentation Client & Bon à Tirer (BAT)
- Bouton **"Partager au Client"** : génère un lien direct sans les panneaux d'édition ni boutons de téléversement (`?view=client`).
- Le client profite du mockup 3D en plein écran avec sa fiche technique d'impression et un bouton pour **"Valider la Maquette (BAT Approuvé)"**.

### 6. 📸 Export Haute Définition
- Bouton **"Exporter HD"** : capture en direct le rendu 3D actuel en fichier PNG haute résolution (avec ou sans fond transparent).

---

## 📚 Documentation Complète

Pour consulter l'analyse détaillée du concept, la roadmap complète (Phases 1 à 4) et les spécifications physiques des shaders PBR, consultez le fichier :
👉 **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)**

