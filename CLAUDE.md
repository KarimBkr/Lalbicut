# LALBICUT — Guide Claude

Site web complet de réservation pour **Lalbi**, barber professionnel. Application React full-stack avec backend Firebase.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework UI | React 19 + TypeScript 5.7 |
| Build | Vite 6 + `@vitejs/plugin-react` |
| Style | TailwindCSS v4 (`@tailwindcss/vite`) — mais peu utilisé |
| Backend | Firebase 12 — Firestore + Auth |
| Routing | React Router v7 |
| Animations | Framer Motion (disponible, peu utilisé actuellement) |
| DnD | `@dnd-kit/core/sortable/modifiers` (disponible) |
| Formulaires | React Hook Form + Zod |
| Linting/Format | ESLint 9 + Prettier 3 |

Démarrer le dev : `npm run dev` → `http://localhost:3000`
Build prod : `npm run build` (TypeScript check + Vite build)

---

## Architecture des fichiers

```
src/
├── App.tsx                     # Routeur racine, wrap BookingProvider
├── main.tsx                    # Point d'entrée React
├── pages/
│   ├── ClientPage.tsx          # Page publique principale (~1700 lignes)
│   ├── AdminPage.tsx           # Panneau admin barber (~2230 lignes)
│   ├── ClientAuth.tsx          # Connexion client
│   └── ClientDashboard.tsx     # Profil client connecté
├── components/
│   ├── client/
│   │   ├── ClientServices.tsx  # Section prestations
│   │   ├── ClientBarber.tsx    # Section présentation barber
│   │   └── ClientGallery.tsx   # Galerie réalisations
│   └── shared/
│       ├── ServiceCardBold.tsx    # Carte service grande
│       └── ServiceCardCompact.tsx # Carte service compacte (booking)
├── context/
│   ├── BookingContext.tsx      # Réservations + créneaux bloqués (Firestore RT)
│   └── AuthContext.tsx         # User Firebase + isAdmin
├── data/
│   └── constants.tsx           # Toutes les données statiques, types, helpers
├── lib/
│   ├── firebase.ts             # Init Firebase (app, db, auth)
│   └── db.ts                   # CRUD Firestore (bookings, blockedSlots)
└── settings/
    ├── theme.ts                # Injection theme/container depuis outside
    └── types.d.ts              # Types Theme et Container
```

---

## Routes

| URL | Composant | Accès |
|---|---|---|
| `/` | `ClientPage` | Public |
| `/admin` | `AdminPage` | Firebase Auth (admin@lalbicut.com) |
| `/connexion` | `ClientAuth` | Public (login client) |
| `/profil` | `ClientDashboard` | Client connecté |

---

## Design System — Tokens

**Ne jamais dévier de ces valeurs.** Toute l'UI est construite dessus.

```
Couleurs
  #F2F0E9   fond clair (blanc cassé chaud)
  #0D0D0D   fond sombre / texte principal
  #587373   accent (vert ardoise)

Typographie
  "Bebas Neue"  → titres, labels, badges, prix   (classe CSS: lbc-bebas)
  "DM Sans"     → corps, paragraphes, inputs       (classe CSS: lbc-dmsans)

Style néo-brutaliste
  border: 2px solid #0D0D0D  (ou rgba selon contexte)
  box-shadow: 3px 3px 0px #587373  (offset dur, pas de blur)
  border-radius: 4–10px selon l'élément
  transition: transform 150ms ease, box-shadow 150ms ease

Interaction boutons (pattern systématique)
  hover:    translate(-1px,-1px) + shadow +1px
  mousedown: translate(+2px,+2px) + shadow -2px
  mouseup:   retour hover state
```

**Tout le styling est inline** dans les composants principaux (`ClientPage`, `AdminPage`). On n'utilise pas de classes Tailwind dans ces fichiers — uniquement dans les composants partagés si nécessaire.

---

## Firebase

### Configuration (variables d'environnement)

Fichier `.env.local` requis avec :
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

### Structure Firestore

**Collection `bookings`** — document par réservation
```typescript
{
  id: string           // ex: "b1704067200000"
  clientName: string
  clientEmail: string
  clientPhone: string
  service: Service     // objet complet, pas une référence
  date: string         // label humain: "Aujourd'hui", "Demain", "8 juin"
  isoDate?: string     // "2025-06-08" pour comparaisons temporelles
  slot: string         // "14:30"
  price: number
  status: 'pending' | 'confirmed' | 'cancelled'
  userId?: string      // UID Firebase si client connecté
}
```

**Collection `settings`** — document unique `blockedSlots`
```typescript
{ slots: string[] }   // ex: ["09:00", "10:30"]
```

### Auth

- Client : email/password via `ClientAuth.tsx`, connecté → accès `/profil`
- Admin : email fixe `admin@lalbicut.com` + mot de passe
- Détection admin : `user?.email === 'admin@lalbicut.com'` dans `AuthContext`

---

## Logique métier

### Prestations (`SERVICES` dans `constants.tsx`)

| ID | Nom | Prix | Notes |
|---|---|---|---|
| s1 | Coupe en Semaine | 20€ | Lun–Ven |
| s2 | Coupe le Weekend | 15€ | Sam–Dim |
| s3 | Coupe + Barbe | +5€ | Addon sur n'importe quelle coupe |
| s4 | Coupe Transfo | 25€ | Changement complet |
| s5 | Coupe Nocturne | 25€ | `onlyLate: true`, `lateSurchargeExempt: true` |

### Créneaux horaires

- Plage : 09h00 → 22h30 (30 min par slot, 24 slots)
- Créneaux nocturnes : `LATE_SLOTS = Set(['22:00', '22:30'])`
- Supplément nocturne : **+5€** automatique si slot nocturne, SAUF pour `lateSurchargeExempt: true`
- Coupe Nocturne (`onlyLate`) : seuls les slots 22h sont proposés

### Calcul du prix total (`getTotal()`)

```typescript
// Service s3 (addon +5€) → basePrice = 0, donc traitement spécial à l'affichage
// Autres services :
total = service.price + (isLateSlot(selectedSlot) && !service.lateSurchargeExempt ? 5 : 0)
```

### Disponibilité des créneaux

Un slot est **indisponible** si :
1. Il est dans `blockedSlots` (bloqué admin), OU
2. Une réservation `pending` ou `confirmed` existe pour ce slot + cette date

### Flow réservation client (4 étapes)

```
Étape 1 → Sélection prestation
Étape 2 → Sélection date (7 jours glissants) + créneau
Étape 3 → Infos client (nom, email, téléphone) — pré-rempli si connecté
Étape 4 → Confirmation (sauvegarde Firestore + affichage récap)
```

---

## Contextes React

### `BookingContext`

Fourni par `BookingProvider` wrappant toute l'app. Expose :
- `bookings: Booking[]` — temps réel via `onSnapshot`
- `blockedSlots: string[]` — temps réel via `onSnapshot`

**Important** : s'abonne à **toutes** les réservations (pas filtrées par user). L'admin et le client lisent la même source.

### `AuthContext`

Expose :
- `user: User | null`
- `loading: boolean`
- `isAdmin: boolean` (email === 'admin@lalbicut.com')
- `logout: () => Promise<void>`

**Note** : `AuthContext` n'est pas encore utilisé dans `BookingProvider`. `ClientPage` utilise `useAuth()` directement pour pré-remplir le formulaire et afficher "Mon Profil".

---

## Panneau Admin

Accessible sur `/admin`, protégé par Firebase Auth.

**Trois onglets (`ADMIN_TABS`) :**

1. **TABLEAU DE BORD** — Stats (total, en attente, confirmés, CA) + 5 prochains RDV
2. **CRÉNEAUX** — Planning jour par jour. Bloquer/débloquer slots (sauvegarde Firestore immédiate)
3. **RÉSERVATIONS** — Liste complète avec filtres (all/pending/confirmed/completed/cancelled) + tri (date/prix). Expansion accordion → détails + mock SMS/email

**Détection "rendez-vous passé"** (`isPassed`) : compare `booking.isoDate` avec la date/heure actuelle. Les RDV passés sont exclus des filtres `pending`/`confirmed`, visibles dans le filtre `completed`.

**SMS/email** : UI présente, pas d'intégration backend réelle (feedback visuel temporaire seulement).

---

## Assets médias

```
public/Coiffure Lalbi/
  hero.mp4          # Vidéo fond hero (autoPlay, muted, loop)
  photo-bilal.jpeg  # Photo du barber
  cut1.png          # Galerie — Coupe Transfo
  cut2.png          # Galerie — Coupe + Barbe
  cut3.png          # Galerie — Coupe en Semaine
```

Référencés avec des chemins absolus : `/Coiffure Lalbi/cut1.png` (espace dans le nom de dossier, attention aux encodages).

---

## Animations globales (`KEYFRAMES` dans `constants.tsx`)

Injectées via `<style>{KEYFRAMES}</style>` dans `ClientPage` et `AdminPage` :

- `lbc-pulse` — pulsation (point "disponible aujourd'hui", bouton réserver actif)
- `lbc-bounce` — rebond (chevron "DÉFILER" en bas du hero)
- `lbc-fadein` — apparition (utilisable pour notifications)
- `scroll-behavior: smooth` — scroll global
- Scrollbar custom aux couleurs du design system

---

## Points de vigilance

### Duplication `ClientPage` / `AdminPage`

Ces deux fichiers partagent beaucoup de state identique (step bar, booking form, slots, etc.). La raison initiale était un monolithe par page. Avant de modifier la logique de réservation, vérifier si le changement doit s'appliquer aux **deux** fichiers.

### IDs de réservation

`id: \`b${Date.now()}\`` — suffisant mais pas UUID. Ne pas changer sans migration Firestore.

### Dates relatives vs absolues

Le champ `date` stocke un **label humain** ("Aujourd'hui", "Demain", "8 juin"). Le champ `isoDate` est optionnel mais utilisé pour la détection `isPassed`. Les nouvelles réservations le renseignent depuis `getDates()`, les anciennes peuvent ne pas l'avoir.

### Sécurité admin

La protection admin côté client repose sur Firebase Auth + comparaison d'email. Les règles Firestore (côté serveur) doivent être configurées en conséquence pour la production.

---

## SuperClaude — Commandes recommandées

### Développement quotidien

```bash
# Analyser la qualité du code avant une PR
/sc:analyze

# Implémenter une nouvelle feature
/sc:implement "ajouter les notifications email réelles via SendGrid"

# Améliorer un composant existant
/sc:improve src/pages/ClientPage.tsx

# Déboguer un problème Firebase
/sc:troubleshoot "les créneaux bloqués ne se synchronisent pas en temps réel"
```

### Architecture et conception

```bash
# Concevoir un nouveau système avant de coder
/sc:design "refactoring : extraire la logique de réservation dans un hook useBooking"

# Estimer l'effort d'une feature
/sc:estimate "intégration Stripe pour paiement en ligne"

# Explorer les options avant de décider
/sc:brainstorm "gestion des rappels RDV automatiques"
```

### Qualité et maintenance

```bash
# Revue de code complète
/sc:analyze --quality --security

# Tests
/sc:test

# Nettoyage du code mort
/sc:cleanup

# Documentation d'un module
/sc:document src/lib/db.ts
```

### Personas SuperClaude actifs selon le contexte

| Tâche | Persona activé automatiquement |
|---|---|
| Nouveau composant React | `frontend-architect` |
| Logique Firebase/Firestore | `backend-architect` |
| Performance animations | `performance-engineer` |
| Sécurité Auth/règles Firestore | `security-engineer` |
| Refactoring `ClientPage`/`AdminPage` | `refactoring-expert` |

---

## Alias Vite

```typescript
import { something } from '@/components/...'  // → src/components/...
import { something } from '@/lib/db'           // → src/lib/db.ts
```

---

## Commandes utiles

```bash
npm run dev           # Dev server localhost:3000
npm run build         # Build prod (tsc + vite)
npm run lint          # ESLint
npm run format        # Prettier (écriture)
npm run format:check  # Prettier (vérification CI)
npm run preview       # Preview du build prod
```
