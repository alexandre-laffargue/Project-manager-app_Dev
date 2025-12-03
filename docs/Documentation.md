# Architecture du Projet

Ce document décrit l'architecture technique de l'application **Project Manager App**.

## Vue d'ensemble

L'application suit une architecture micro-services simplifiée, orchestrée par Docker. Elle se compose de trois services principaux :

1.  **Frontend** : Interface utilisateur (SPA).
2.  **Backend** : API REST et logique métier.
3.  **Base de données** : Persistance des données.

## Diagramme d'Architecture

![Diagramme d'Architecture](Architecture.png)

## Description des Composants

### 1. Frontend (Client)
-   **Technologie** : Vue.js 3 (Vite)
-   **Rôle** : Gère l'interaction utilisateur, l'affichage des tableaux Kanban, du Backlog et de la Chronologie.
-   **Communication** : Effectue des requêtes HTTP (Axios) vers l'API Backend.
-   **Déploiement** : Servi par Nginx dans un conteneur Docker.

### 2. Backend (Serveur)
-   **Technologie** : Node.js / Express
-   **Rôle** : Expose une API RESTful, gère l'authentification (JWT), la validation des données (Joi) et la logique métier.
-   **Communication** : Reçoit les requêtes du Frontend et interagit avec MongoDB.
-   **Sécurité** : Utilise des secrets Docker pour la gestion des clés JWT.

### 3. Base de Données
-   **Technologie** : MongoDB (v7)
-   **Rôle** : Stocke les utilisateurs, projets, tâches, sprints et chronologies.
-   **Persistance** : Les données sont stockées dans un volume Docker nommé `mongo-data`.

## Flux de Données

1.  L'utilisateur interagit avec le **Frontend**.
2.  Le Frontend envoie une requête API (ex: `GET /api/boards`) au **Backend**.
3.  Le Backend vérifie le token JWT (Authentification).
4.  Le Backend interroge **MongoDB**.
5.  MongoDB renvoie les données.
6.  Le Backend formate la réponse et la renvoie au Frontend.
7.  Le Frontend met à jour l'interface.

## Infrastructure

L'ensemble est défini dans un fichier `docker-compose.yml` qui gère :
-   La construction des images.
-   Les réseaux (communication interne entre les conteneurs).
-   Les volumes (persistance).
-   Les variables d'environnement et secrets.
