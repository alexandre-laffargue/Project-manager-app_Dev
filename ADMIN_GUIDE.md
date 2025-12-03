# Documentation Administrateur - Project Manager App

## 1. Installation du Logiciel

Cette section détaille les étapes nécessaires pour déployer l'application sur un serveur ou une machine locale.

### 1.1 Pré-requis nécessaires

Avant de procéder à l'installation, assurez-vous que l'environnement hôte dispose des éléments suivants :

*   **Système d'exploitation** : Linux, Windows ou macOS.
*   **Docker** : Moteur de conteneurisation installé et actif.
*   **Docker Compose** : Outil d'orchestration installé.
*   **Ports disponibles** :
    *   Port **80** : Pour l'accès web (Frontend).
    *   Port **3000** : Pour l'API (Backend).
    *   Port **27017** : Pour la base de données MongoDB (optionnel, pour accès direct).
*   **Fichiers de configuration** :
    *   Le fichier `docker-compose.yml` à la racine.
    *   Le dossier `secrets/` contenant `jwt_secret.txt` (pour la sécurité des tokens).

### 1.2 Processus d'installation

L'installation est automatisée via Docker Compose. Suivez ces étapes :

1.  **Récupération des sources** : Clonez le dépôt ou copiez les fichiers sur le serveur cible.
2.  **Configuration des secrets** :
    *   Vérifiez que `secrets/jwt_secret.txt` existe.
    *   Pour la production, remplacez son contenu par une chaîne aléatoire complexe.
3.  **Lancement des services** :
    Ouvrez un terminal dans le dossier racine du projet et exécutez :
    ```bash
    docker compose up --build -d
    ```
    *Cette commande construit les images (Frontend et Backend) et démarre les conteneurs en arrière-plan.*

### 1.3 Vérification de l'installation

Pour s'assurer que l'installation s'est bien déroulée, effectuez les contrôles suivants :

1.  **État des conteneurs** :
    Exécutez `docker ps`. Vous devez voir trois conteneurs actifs (`frontend`, `backend`, `mongo`) avec le statut "Up" (ou "healthy").
2.  **Accès Frontend** :
    Ouvrez un navigateur et allez sur [http://localhost](http://localhost). La page de connexion ou d'accueil doit s'afficher.
3.  **Accès Backend** :
    Testez l'API en accédant à [http://localhost:3000/health](http://localhost:3000/health) (si configuré) ou vérifiez la documentation Swagger sur [http://localhost:3000/api-docs](http://localhost:3000/api-docs).
4.  **Test fonctionnel** :
    Tentez de créer un compte utilisateur ("S'inscrire"). Si l'inscription réussit, la connexion à la base de données et à l'API est fonctionnelle.

---

## 2. Assurer le bon fonctionnement (Maintenance)

Cette section explique les fonctions de l'administrateur pour maintenir le logiciel en état de marche et les actions à entreprendre en cas de problème.

### 2.1 Fonctions de l'administrateur

L'administrateur doit régulièrement effectuer les tâches suivantes :

*   **Surveillance des Logs** :
    Vérifier les journaux des conteneurs pour détecter des erreurs potentielles.
    ```bash
    docker compose logs -f
    ```
*   **Sauvegarde des Données (Backup)** :
    La base de données MongoDB stocke ses données dans un volume Docker (`mongo-data`). Il est crucial de faire des sauvegardes régulières.
    *   *Commande de dump* :
        ```bash
        docker exec <nom_conteneur_mongo> mongodump --out /dump
        docker cp <nom_conteneur_mongo>:/dump ./backup_local
        ```
*   **Mise à jour** :
    Pour mettre à jour l'application, récupérez la dernière version du code, puis relancez la commande d'installation (`docker compose up --build -d`).

### 2.2 Actions en cas de panne

En cas de dysfonctionnement, suivez ces procédures :

#### Cas 1 : L'application est inaccessible (Site ne charge pas)
1.  Vérifiez que les conteneurs tournent : `docker ps -a`.
2.  Si un conteneur est arrêté ("Exited"), consultez ses logs pour comprendre pourquoi : `docker compose logs <nom_service>`.
3.  Redémarrez les services : `docker compose restart`.

#### Cas 2 : Erreur "Network Error" ou API inaccessible
1.  Vérifiez que le backend tourne sur le port 3000.
2.  Vérifiez la connexion entre le backend et la base de données dans les logs du backend (`docker compose logs backend`).
3.  Assurez-vous que le conteneur `mongo` est en état "healthy".

#### Cas 3 : Perte de données ou corruption
1.  Arrêtez l'application pour éviter d'aggraver la situation.
2.  Restaurez la dernière sauvegarde de la base de données :
    ```bash
    docker cp ./backup_local/dump <nom_conteneur_mongo>:/dump
    docker exec <nom_conteneur_mongo> mongorestore /dump
    ```
