# Récap complet — Restructuration base Airtable Vertical View 2.0

## Contexte

Vertical View est une agence belge de production vidéo courte (TikTok, Reels, YouTube Shorts) spécialisée 100% contenu vertical 9/16. Équipe de 5 personnes, ~200 vidéos/an, objectif 1000/an. La base Airtable `appT3ZJJUIAPnuHR9` a été entièrement restructurée pour simplifier et fiabiliser le workflow de production.

---

## CE QU'ON A SUPPRIMÉ

### Tables supprimées (2 tables)

**Table `Sessions de tournage`** — supprimée entièrement.
Avant, chaque tournage créait une Session, et les vidéos étaient liées à cette Session, qui elle-même était liée à un Contrat et un Client. Cette architecture en cascade créait des problèmes concrets : si deux vidéos étaient tournées le même jour mais appartenaient à deux contrats différents, elles se retrouvaient dans le mauvais contrat. La Session n'avait pas de valeur ajoutée comme entité centrale — c'était juste un intermédiaire inutile qui compliquait tout. Les données utiles (date de tournage, lieu, cadreur) ont été migrées directement dans la table Vidéos.

**Table `Produits`** — supprimée entièrement.
Avant, il existait un catalogue de produits (Cadence Standard, Contrat Cadre, À la Carte, etc.) avec des prix unitaires. Cette table était trop complexe pour une petite structure et peu utilisée en pratique.

**Table `Lignes Produits`** — supprimée entièrement.
Table de jonction entre Contrats et Produits. Permettait de composer un contrat avec plusieurs types de produits et quantités. En pratique, cette flexibilité n'était pas utilisée et rendait la création d'un contrat beaucoup trop lourde. Supprimée avec Produits.

---

### Champs supprimés dans les tables existantes

**Dans Vidéos :**
- `Sessions de tournage` (lien vers Sessions) — remplacé par champs directs
- `Contrats (from Sessions de tournage)` (lookup) — remplacé par lien direct Projets
- `Client (from Sessions de tournage)` (lookup) — remplacé par lien direct Client
- `Cadreur session (from Sessions de tournage)` (lookup) — remplacé par champ Cadreur direct
- `Date/heure de la session (from Sessions de tournage)` (lookup) — remplacé par champ Date/heure de tournage direct
- `Produit utilisé` (lien vers Produits)
- `Prix unitaire (from Produit utilisé)` (lookup)
- `Montant à facturer` (formule)
- `Montant si facturé` (formule)
- `Montant si à facturer` (formule)
- `N° Facture` (texte) — supprimé volontairement, David gère la facturation hors Airtable
- `Date facturation` (date)
- `Nbre Allers-retours` (texte)
- `Format vidéo` (select) — inutile, agence 100% vertical 9/16
- `Ratio` (select) — inutile, même raison
- `Lien client vidéo` (lookup redondant)
- `Contrats` (ancien lien direct vers Contrats, remplacé par lien Projets)

**Dans Projets (anciennement Contrats) :**
- `SESSIONS` (lien vers Sessions de tournage) — table supprimée
- `Lignes Produits` (lien vers Lignes Produits) — table supprimée
- `Type de contrat` / `Type de projet` — supprimé (trop de valeurs inutilisées, info redondante avec Vidéos prévues)
- `Facturation` (Mensuelle/Trimestrielle/Unique) — supprimé
- `Point de contact dédié` — supprimé (remplacé par Équipe assignée dans Clients)
- `Backup contact` — supprimé (même raison)
- `Valeur totale contrat` (formule)
- `Prix moyen par vidéo du contrat` (formule)
- `Montant facturé` (formule)
- `Montant à facturer` (formule)
- `% Avancement facturation` (formule)
- `Restant à facturer (€)` (formule)
- `Nb vidéos à facturer` (count)
- `Total Nombre de vidéo (from Lignes Produits)` (lookup)
- `Prix unitaire (from Produit) (from Lignes Produits)` (lookup)
- `Montant ligne (from Lignes Produits)` (lookup)
- `Produit (from Lignes Produits)` (lookup)
- `Montant si facturé (from Vidéos)` (lookup)
- `Montant si à facturer (from Vidéos)` (lookup)
- `Notes facturation` (texte)

**Dans Équipe :**
- `Contrats` (lien) — supprimé
- `Contrats 2` (lien) — supprimé (logique contact dédié par projet abandonnée)

**Dans Clients :**
- `Secteur d'activité` (select) — doublon avec `Type de client`, supprimé
- `Email contact principal` (email) — redondant avec table Contacts, supprimé

**Dans Contacts :**
- `Vidéos 2` (single line text orphelin) — supprimé

**Dans Feedbacks :**
- `Statut production (from Vidéo) 2` (lookup doublon) — supprimé

---

## CE QU'ON A RENOMMÉ

- **Table `Contrats`** → renommée **`Projets`**
- **Champ `Nom du contrat`** → renommé **`Nom du projet`**
- **Champ `Numéro du contrat`** → renommé **`Numéro du projet`**
- **Champ `Statut contrat`** → renommé **`Statut projet`**
- **Champ `Alerte renouvellement`** → renommé **`Alerte fin de projet`**
- **Champ `Vidéos 2` dans Équipe** → renommé **`Monteur`** (lien inverse vidéos montées)
- **Champ `Vidéos 3` dans Équipe** → renommé **`Cadreur`** (lien inverse vidéos tournées)
- **Champ `Contrats` dans Vidéos** → remplacé par **`Projets`** (lien direct)

---

## CE QU'ON A CRÉÉ / AJOUTÉ

### Dans la table Vidéos (champs tournage directs, anciennement dans Sessions)
- `Date/heure de tournage` (DateTime, Europe/Brussels)
- `Durée du tournage` (Duration h:mm)
- `Date/heure de fin de tournage` (DateTime manuel — backup)
- `Date/heure de fin de tournage (formule)` (calcule automatiquement début + durée)
- `Lieu de tournage` (Single line text)
- `Lien Google Maps tournage` (URL)

### Dans la table Vidéos (nouveaux liens)
- `Projets` (lien direct vers Projets, single select) — remplace le passage par Sessions
- `Brief / Objectifs (from Projets)` (lookup depuis Projets) — hérite du brief du projet
- `Client` (lien direct vers Clients, single select) — remplace le lookup via Sessions
- `Contacts pour review` (lien vers Contacts — pour envoyer la V1 au bon contact)
- `Email (from Contacts pour review)` (lookup email)

### Dans la table Projets (anciennement Contrats)
- `Vidéos prévues` (Number, saisie manuelle) — remplace le calcul complexe depuis Lignes Produits
- `Vidéos` (lien bidirectionnel vers Vidéos) — lien direct, plus de passage par Sessions
- `Vidéos livrées` (Count automatique depuis le lien Vidéos)
- `Progression %` (formule : Vidéos livrées / Vidéos prévues)
- `Brief / Objectifs` (Multiline text) — brief du projet, lookupé dans les Vidéos

### Dans la table Clients
- `Équipe assignée` (lien vers Équipe, multi-select) — remplace la logique de contact dédié par projet

### Dans la table Équipe
- `Clients assignés` (lien inverse depuis Clients → Équipe assignée)

---

## LOGIQUE DE FACTURATION — AVANT / APRÈS

**Avant :** système complexe avec Produits, Lignes Produits, prix unitaires, montants calculés automatiquement par formule, N° facture, date facturation, suivi du montant restant à facturer.

**Après :** système binaire simple sur chaque vidéo.
Le champ `Statut facturation` dans Vidéos a 3 valeurs :
- `🔘 Non facturable` — vidéo hors contrat facturable (collab, interne, etc.)
- `⏳ À facturer` — vidéo livrée, en attente de facturation
- `📤 Facturée` — David a facturé, il change manuellement

David gère la facturation via son outil comptable externe. Airtable ne stocke plus aucun montant, prix, ni numéro de facture. Le seul suivi Airtable est : est-ce que cette vidéo a été facturée ou pas.

---

## LOGIQUE SESSIONS DE TOURNAGE — AVANT / APRÈS

**Avant :** une Session de tournage était une entité propre. On créait d'abord une Session (date, lieu, client, cadreur, contrat), puis on y rattachait les Vidéos. Le Client et le Contrat d'une vidéo étaient des lookups qui passaient par la Session. Problème : une session ne pouvait être liée qu'à un seul contrat, mais plusieurs vidéos du même tournage pouvaient appartenir à des contrats différents.

**Après :** plus de table Sessions. Chaque vidéo porte directement ses infos de tournage (date, heure, durée, lieu, Google Maps, cadreur). Si plusieurs vidéos sont tournées le même jour, chacune a ses propres infos en direct. Le "planning tournage" devient une vue calendrier de la table Vidéos filtrée sur `Date/heure de tournage`.

---

## LOGIQUE CONTRATS → PROJETS — AVANT / APRÈS

**Avant :** un Contrat était un document juridique/commercial avec des Lignes Produits, des prix calculés, une valeur totale, un suivi de facturation intégré. Créer un contrat demandait de paramétrer des Lignes Produits, sélectionner des Produits du catalogue, ajuster les quantités.

**Après :** un Projet est une enveloppe simple. On renseigne : nom, client, dates de début/fin, statut, nombre de vidéos prévues (saisi manuellement), brief/objectifs, document signé (PJ), numéro PO. La progression se calcule automatiquement (vidéos livrées / vidéos prévues). Créer un projet prend 30 secondes.

---

## ARCHITECTURE FINALE — 10 TABLES ACTIVES

```
CLIENTS
├── Équipe assignée → ÉQUIPE
├── CONTACTS
├── PROJETS
│    ├── Brief / Objectifs (text)
│    ├── Vidéos prévues (number, manuel)
│    ├── Vidéos livrées (count auto)
│    ├── Progression % (formule)
│    ├── Alerte fin de projet (formule J-30)
│    ├── Jours avant expiration (formule)
│    └── VIDÉOS
│         ├── Brief vidéo
│         ├── Brief / Objectifs (lookup depuis Projets)
│         ├── Monteur → ÉQUIPE
│         ├── Cadreur → ÉQUIPE
│         ├── Date/heure de tournage
│         ├── Durée du tournage
│         ├── Lieu de tournage + Google Maps
│         ├── Statut production (7 étapes : 0. Brief reçu → 6. Livrée)
│         ├── Statut facturation (Non facturable / À facturer / Facturée)
│         ├── % Avancement (formule depuis statut)
│         ├── Délai restant J- (formule)
│         ├── Contacts pour review → CONTACTS
│         ├── FEEDBACKS
│         │    ├── Type (Révision demandée / Révision effectuée)
│         │    └── Commentaire, Notes internes
│         └── TÂCHES → SUB-TÂCHES

ÉQUIPE
├── Clients assignés (inverse de Équipe assignée)
├── Monteur (inverse des vidéos montées)
├── Cadreur (inverse des vidéos tournées)
├── Rôles, Compétences, Langues, Statut
├── Tâches Interne/Perso
└── SOP's

CONTACTS
├── Client associé → CLIENTS
├── Rôle (Décideur / Opérationnel / Administratif / Intervenant)
├── Email, Téléphone, Canal Préféré
└── Vidéos (pour review)

TÂCHES
├── Assigné → ÉQUIPE
├── Vidéos (single)
├── Sub-Tâches
├── SOP liée
├── Est en retard (formule)
└── Statut, Priorité, Deadline

SUB-TÂCHES
└── Valider (checkbox) — Sous-Tâches valide = count filtré sur cochées

FEEDBACKS
├── Vidéo (single)
├── Type (binaire)
└── Commentaire, Notes internes, Date traitement

SOP's
├── Responsable → ÉQUIPE
├── Catégorie (9 types)
└── Tâches liées

CRM (non structuré — hors scope actuel)
```

---

## STATUTS PRODUCTION — 7 ÉTAPES

```
📄 0. Brief reçu
🧠 1. Pré-production
🗓️ 2. Tournage planifié
✂️ 3. Post-production
✏️ 4. Review Client
🔁 5. Revision Interne
📦 6. Livrée
```

---

## PORTAIL CLIENT ZITE

URL par client : `https://portail-vertical-view.vercel.app/?client=RECORD_ID()`
Champ `Portail Client` dans Clients = formule qui génère cette URL automatiquement.
Le portail se connecte directement à Airtable via l'API. Il affiche les vidéos, statuts et feedbacks d'un client donné.

---

## DÉCISIONS STRATÉGIQUES RETENUES

- **Facturation hors Airtable** — David utilise un outil comptable externe. Airtable = suivi binaire uniquement.
- **Contenu 100% vertical** — Format vidéo et Ratio supprimés, toujours 9/16.
- **Pas de CRM pour l'instant** — table CRM existe mais non structurée, hors scope.
- **Équipe assignée par client** — remplace la logique de contact dédié par projet qui était trop complexe.
- **Sessions supprimées** — le planning tournage = vue calendrier sur Vidéos.
- **Vidéos prévues = saisie manuelle** — plus de calcul automatique depuis Produits, David saisit le nombre directement à la création du projet.