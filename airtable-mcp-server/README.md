# Serveur MCP Airtable - Vertical View

Ce serveur MCP (Model Context Protocol) permet d'interagir directement avec votre base Airtable depuis Cursor.

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd airtable-mcp-server
npm install
```

### 2. Configurer Cursor

Ajoutez cette configuration dans votre fichier de configuration MCP de Cursor (`~/.cursor/config.json` ou dans les paramètres MCP de Cursor) :

```json
{
  "mcpServers": {
    "airtable": {
      "command": "node",
      "args": [
        "/Users/corentinlavenan/Documents/17-Endosia/Code Airtable/portail-client (1)/airtable-mcp-server/src/index.js"
      ],
      "env": {
        "AIRTABLE_API_KEY": "YOUR_AIRTABLE_API_KEY",
        "AIRTABLE_BASE_ID": "YOUR_AIRTABLE_BASE_ID"
      }
    }
  }
}
```

### 3. Redémarrer Cursor

Redémarrez Cursor pour que le serveur MCP soit chargé.

## 🛠️ Outils Disponibles

### `airtable_list_records`
Liste les enregistrements d'une table avec filtrage et tri optionnels.

**Paramètres:**
- `table` (requis): Nom ou ID de la table (ex: "Clients", "tblvndxiZaqAVGP5O", "Vidéos", "Contrats", "Équipe")
- `filterByFormula` (optionnel): Formule Airtable pour filtrer
- `maxRecords` (optionnel): Nombre max d'enregistrements (défaut: 100)
- `sort` (optionnel): Tableau d'objets de tri
- `view` (optionnel): Nom d'une vue à utiliser

**Exemple:**
```
Liste tous les clients avec leur email
```

### `airtable_get_record`
Récupère un enregistrement unique par son ID.

**Paramètres:**
- `table` (requis): Nom ou ID de la table
- `recordId` (requis): ID de l'enregistrement (commence par 'rec')

### `airtable_create_record`
Crée un nouvel enregistrement dans une table.

**Paramètres:**
- `table` (requis): Nom ou ID de la table
- `fields` (requis): Objet contenant les champs à définir

### `airtable_update_record`
Met à jour un enregistrement existant.

**Paramètres:**
- `table` (requis): Nom ou ID de la table
- `recordId` (requis): ID de l'enregistrement à mettre à jour
- `fields` (requis): Objet contenant les champs à mettre à jour

### `airtable_delete_record`
Supprime un enregistrement d'une table.

**Paramètres:**
- `table` (requis): Nom ou ID de la table
- `recordId` (requis): ID de l'enregistrement à supprimer

### `airtable_get_client_dashboard`
Récupère toutes les données pour le tableau de bord d'un client (infos client, vidéos, contrats, membres de l'équipe).

**Paramètres:**
- `clientRecordId` (requis): ID de l'enregistrement client ou email
- `useEmail` (optionnel): Mettre à true si vous fournissez un email au lieu d'un ID

## 📊 Structure Airtable

### Tables configurées:
- **Clients** (`tblvndxiZaqAVGP5O`)
  - Nom du client
  - Prénom
  - Nom
  - Email contact principal
  - Logo
  - Contact (Nom, Role, Email, Tel, Photo)

- **Vidéos**
  - Titre vidéo
  - Sessions de tournage
  - Statut
  - Lien Vidéo
  - Lien Drive
  - Version
  - Progression
  - Client (from Sessions de tournage)

- **Contrats**
  - Type
  - Total Vidéos
  - Vidéos Livrées
  - Date Début
  - Date Fin
  - Statut Facturation
  - Clients

- **Équipe**
  - Nom complet
  - Bio
  - E-mail
  - WhatsApp
  - Photo
  - Rôles

## 💡 Exemples d'utilisation dans Cursor

Une fois le serveur MCP configuré, vous pouvez demander à Cursor:

- "Liste tous les clients dans Airtable"
- "Montre-moi les vidéos en production"
- "Récupère les informations du client avec l'email contact@example.com"
- "Mets à jour le statut de la vidéo recXXXXX à 'Validée'"
- "Crée un nouveau contrat pour le client X"

## 🔒 Sécurité

⚠️ **Important**: N'exposez jamais votre clé API Airtable dans le code frontend. Utilisez toujours des variables d'environnement et considérez l'utilisation d'un backend proxy pour les requêtes Airtable en production.

## 📝 Notes

- Le serveur utilise le SDK MCP officiel
- Les enregistrements sont formatés avec leur ID, champs et date de création
- La gestion d'erreurs est intégrée pour tous les outils
