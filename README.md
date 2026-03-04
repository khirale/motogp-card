# MotoGP Cards — Home Assistant Lovelace Cards

<p align="center">
  <img src="https://img.shields.io/badge/HACS-Custom-orange?style=for-the-badge" alt="HACS Custom">
  <img src="https://img.shields.io/badge/HA-2026.1+-blue?style=for-the-badge" alt="HA Version">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

> ⚠️ Requires the [MotoGP Tracker](https://github.com/khirale/motogp_tracker) integration.

---



<p align="center">
  <a href="https://buymeacoffee.com/khirale">
    <img
      src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
      alt="Buy Me a Coffee"
      height="45"
    >
  </a>
</p>

---

<img src="https://github.com/khirale/motogp-card/blob/main/images/motoGP-card.png" width=100%>

---

## 🇬🇧 English

### 4 custom cards — zero dependencies

| Card | Description |
|------|-------------|
| `custom:motogp-event-card` | Next GP: country flag, circuit SVG, full weekend schedule, live countdown to race start |
| `custom:motogp-riders-card` | Full riders standings: position, flag, name, team, points, wins |
| `custom:motogp-teams-card` | Teams standings with proportional progress bars |
| `custom:motogp-live-card` | Live race classification with animated LIVE banner, lap counter, DNF handling |

### Installation via HACS

1. In HACS → **Frontend** → ⋮ → **Custom repositories**
2. URL: `https://github.com/khirale/motogp-cards` — Category: **Lovelace**
3. Click **Download**
4. **Settings → Dashboards → ⋮ → Resources** → Add:
   - URL: `/hacsfiles/motogp-cards/motogp-cards.js`
   - Type: **JavaScript module**
5. Hard-refresh your browser (Ctrl+Shift+R)

### Manual installation

1. Copy `motogp-cards.js` to `/config/www/motogp-cards.js`
2. **Settings → Dashboards → ⋮ → Resources** → Add:
   - URL: `/local/motogp-cards.js`
   - Type: **JavaScript module**
3. Hard-refresh your browser (Ctrl+Shift+R)

### Usage

```yaml
# Auto language (detected from your HA profile)
- type: custom:motogp-event-card
- type: custom:motogp-riders-card
- type: custom:motogp-teams-card
- type: custom:motogp-live-card

# Language override
- type: custom:motogp-event-card
  language: en
```

### Entity ID override

By default, cards use the entity IDs generated at integration install time. If your instance uses different entity IDs (e.g. after a reinstall or a previous version), you can override them per card:

```yaml
- type: custom:motogp-event-card
  entities:
    event: sensor.motogp_prochain_evenement       # default: sensor.motogp_next_event
    sessions: sensor.motogp_sessions              # default: sensor.motogp_sessions
    race_start: sensor.motogp_depart_course       # default: sensor.motogp_next_race_start

- type: custom:motogp-riders-card
  entities:
    riders: sensor.motogp_classement_pilotes      # default: sensor.motogp_classement_pilotes

- type: custom:motogp-teams-card
  entities:
    teams: sensor.motogp_classement_equipes       # default: sensor.motogp_classement_equipes

- type: custom:motogp-live-card
  entities:
    live: sensor.motogp_live_timing               # default: sensor.motogp_live_timing
    race_start: sensor.motogp_depart_course       # default: sensor.motogp_next_race_start
```

To find your actual entity IDs: **Developer Tools → States** → search `motogp`.

### Supported languages

| Code | Language |
|------|----------|
| `en` | English (default fallback) |
| `fr` | Français |

Language is auto-detected from your HA profile. Override per card with `language: xx`.

Want to add your language? Open a PR — translations are a single object at the top of `motogp-cards.js`.

### Features

- ✅ Zero dependencies — no button-card, no card-mod required
- ✅ Shadow DOM isolation — no CSS leaking between cards
- ✅ Live countdown updating every second (no page reload)
- ✅ Live timing: animated LIVE banner, lap counter, DNF highlighted in red
- ✅ Multilingual with easy extensibility
- ✅ Responsive — mobile, tablet and desktop

---

## 🇫🇷 Français

### 4 cartes personnalisées — zéro dépendance

| Carte | Description |
|-------|-------------|
| `custom:motogp-event-card` | Prochain GP : drapeau, SVG du circuit, programme complet, décompte live |
| `custom:motogp-riders-card` | Classement pilotes complet : position, drapeau, nom, équipe, points, victoires |
| `custom:motogp-teams-card` | Classement équipes avec barres de progression proportionnelles |
| `custom:motogp-live-card` | Classement live avec bandeau EN DIRECT animé, compteur de tours, DNF en rouge |

### Installation via HACS

1. Dans HACS → **Frontend** → ⋮ → **Dépôts personnalisés**
2. URL : `https://github.com/khirale/motogp-cards` — Catégorie : **Lovelace**
3. Cliquer **Télécharger**
4. **Paramètres → Tableaux de bord → ⋮ → Ressources** → Ajouter :
   - URL : `/hacsfiles/motogp-cards/motogp-cards.js`
   - Type : **Module JavaScript**
5. Recharger le navigateur (Ctrl+Shift+R)

### Installation manuelle

1. Copier `motogp-cards.js` dans `/config/www/motogp-cards.js`
2. **Paramètres → Tableaux de bord → ⋮ → Ressources** → Ajouter :
   - URL : `/local/motogp-cards.js`
   - Type : **Module JavaScript**
3. Recharger le navigateur (Ctrl+Shift+R)

### Utilisation

```yaml
# Langue automatique (détectée depuis votre profil HA)
- type: custom:motogp-event-card
- type: custom:motogp-riders-card
- type: custom:motogp-teams-card
- type: custom:motogp-live-card

# Forçage de langue
- type: custom:motogp-event-card
  language: fr
```

### Surcharge des entity IDs

Par défaut, les cartes utilisent les entity IDs générés à l'installation de l'intégration. Si votre instance utilise des entity IDs différents (ex : après une réinstallation ou une version précédente), vous pouvez les surcharger par carte :

```yaml
- type: custom:motogp-event-card
  entities:
    event: sensor.motogp_prochain_evenement       # défaut : sensor.motogp_next_event
    sessions: sensor.motogp_sessions              # défaut : sensor.motogp_sessions
    race_start: sensor.motogp_depart_course       # défaut : sensor.motogp_next_race_start

- type: custom:motogp-riders-card
  entities:
    riders: sensor.motogp_classement_pilotes      # défaut : sensor.motogp_classement_pilotes

- type: custom:motogp-teams-card
  entities:
    teams: sensor.motogp_classement_equipes       # défaut : sensor.motogp_classement_equipes

- type: custom:motogp-live-card
  entities:
    live: sensor.motogp_live_timing               # défaut : sensor.motogp_live_timing
    race_start: sensor.motogp_depart_course       # défaut : sensor.motogp_next_race_start
```

Pour trouver vos entity IDs réels : **Outils de développement → États** → rechercher `motogp`.

### Langues supportées

| Code | Langue |
|------|--------|
| `en` | English (fallback par défaut) |
| `fr` | Français |

La langue est détectée automatiquement depuis votre profil HA. Forcez-la par carte avec `language: xx`.

Vous voulez ajouter votre langue ? Ouvrez une PR — les traductions sont un simple objet en haut de `motogp-cards.js`.

### Fonctionnalités

- ✅ Zéro dépendance — pas de button-card, pas de card-mod requis
- ✅ Isolation Shadow DOM — aucun conflit CSS entre les cartes
- ✅ Décompte live mis à jour chaque seconde (sans rechargement)
- ✅ Live timing : bandeau animé, compteur de tours, DNF en rouge
- ✅ Multilingue avec extensibilité facile
- ✅ Responsive — mobile, tablette et desktop

---

## License

MIT © 2026 khirale
