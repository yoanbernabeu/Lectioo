# Lectioo

Lectioo est une application macOS moderne et ludique, pensée pour les collégiens, qui transforme n'importe quel texte en audio grâce à l'API TTS d'OpenAI. Elle permet aussi de générer des podcasts de révisions dynamiques à partir de vos cours ou leçons.

## ✨ Fonctionnalités principales

- **Conversion Texte → Audio** : Collez un texte, obtenez un fichier audio généré par l'IA.
- **Podcast de révisions** : Génération automatique d'un script de podcast (résumé, points clés, quiz) puis conversion en audio.
- **Historique intelligent** : Retrouvez toutes vos conversions et podcasts, avec anti-doublon, date, suppression possible.
- **Interface épurée** : Design moderne, accessible, adapté au contexte scolaire.
- **Gestion de la clé API OpenAI** : Stockée localement, jamais transmise à l'extérieur.

## 🚀 Installation & Lancement (développement)

1. **Cloner le dépôt**
   ```bash
   git clone <repo-url>
   cd Lectioo
   ```
2. **Installer les dépendances**
   ```bash
   npm install
   ```
3. **Lancer l'application en mode dev**
   ```bash
   npm start
   ```

## 🛠️ Build pour macOS

1. **Installer les dépendances de build** (si besoin)
   ```bash
   npm install --save-dev electron-builder
   ```
2. **Lancer le build**
   ```bash
   npm run build
   ```
   Le fichier `.dmg` sera généré dans le dossier `dist/`.

## 🔑 Clé API OpenAI
- Lors du premier lancement, l'application vous demandera votre clé API OpenAI (nécessaire pour la synthèse vocale et la génération de podcasts).
- [Créer une clé sur https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- La clé est stockée localement et n'est jamais partagée.

## 📁 Où sont stockés les fichiers audio ?
- Les fichiers générés sont enregistrés dans le dossier utilisateur de l'application (`~/Library/Application Support/lectioo/audio/` sur macOS).
- L'historique est stocké localement (localStorage).

## 🧑‍🎓 Public cible
- Collégiens (11–15 ans), enseignants, familles, toute personne souhaitant écouter ses cours ou générer des podcasts de révision.

## 📝 Licence
- [MIT](LICENSE)

---

**Développé avec ❤️ pour l'éducation et l'accessibilité.** 