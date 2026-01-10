# 📋 Guide d'Installation - Serveur MCP Airtable

## 🎯 Étape 1: Installer les dépendances

```bash
cd "/Users/corentinlavenan/Documents/17-Endosia/Code Airtable/portail-client (1)/airtable-mcp-server"
npm install
```

## 🎯 Étape 2: Configurer Cursor

### Option A: Via les paramètres Cursor (Recommandé)

1. Ouvrez Cursor
2. Allez dans **Paramètres** → **MCP** (ou **Settings** → **MCP**)
3. Cliquez sur **Add MCP Server** ou **Edit Config**
4. Ajoutez la configuration suivante:

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

### Option B: Fichier de configuration manuel

Si vous ne trouvez pas les paramètres MCP, créez ou modifiez le fichier:
- **macOS**: `~/.cursor/mcp.json`
- **Windows**: `%APPDATA%\Cursor\mcp.json`

Collez la même configuration que ci-dessus.

## 🎯 Étape 3: Redémarrer Cursor

1. Fermez complètement Cursor
2. Rouvrez Cursor
3. Le serveur MCP devrait maintenant être actif

## ✅ Vérification

Pour vérifier que le serveur fonctionne, demandez à Cursor:

```
Liste tous les clients dans Airtable
```

ou

```
Montre-moi les vidéos en statut "En révision"
```

## 🛠️ Outils disponibles

Une fois installé, vous pouvez utiliser ces commandes dans Cursor:

### 📊 Consultation
- "Liste tous les clients"
- "Montre-moi les vidéos du client X"
- "Affiche les contrats actifs"
- "Récupère l'équipe Vertical View"

### 📝 Modification
- "Mets à jour le statut de la vidéo recXXX à 'Validée'"
- "Change le nom du client recYYY"
- "Ajoute un nouveau membre à l'équipe"

### 🔍 Dashboard complet
- "Récupère le tableau de bord pour le client contact@example.com"
- "Montre toutes les données du client recZZZ"

## 🚨 Dépannage

### Le serveur ne démarre pas
- Vérifiez que Node.js est installé: `node --version`
- Assurez-vous que les dépendances sont installées: `cd airtable-mcp-server && npm install`

### Erreur "Base not found"
- Vérifiez que `AIRTABLE_BASE_ID` est correct dans la configuration
- Assurez-vous que votre clé API a accès à cette base

### Erreur "Authentication failed"
- Vérifiez que `AIRTABLE_API_KEY` est valide
- Régénérez une nouvelle clé API si nécessaire depuis Airtable

## 🔒 Sécurité

⚠️ **IMPORTANT**: Cette configuration contient des clés API sensibles. 

Pour la production:
1. Ne commitez JAMAIS ces clés dans Git
2. Utilisez un backend proxy pour les requêtes Airtable
3. Implémentez une authentification côté serveur

## 📚 Documentation complète

Consultez `README.md` pour la documentation complète des outils et exemples d'utilisation.

---

**Besoin d'aide?** Demandez à Cursor: "Comment utiliser le serveur MCP Airtable?"
