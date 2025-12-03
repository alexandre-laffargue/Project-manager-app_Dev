# Guide Utilisateur - Project Manager App

Bienvenue dans **Project Manager App**, votre outil de gestion de projet agile. Cette application vous permet de gérer vos tâches via un tableau Kanban, d'organiser votre travail avec un Backlog et des Sprints, et de visualiser l'avancement sur une Chronologie.

## 1. Inscription et Connexion

### Inscription
1. Sur la page d'accueil, cliquez sur le lien **"S'inscrire"** (ou accédez à `/register`).
2. Remplissez le formulaire avec :
   - **Adresse e-mail**
   - **Nom**
   - **Mot de passe** (min. 6 caractères)
   - **Confirmer mot de passe**
3. Cliquez sur **"S'inscrire"**. Vous serez redirigé vers la page de connexion.

### Connexion
1. Accédez à la page de connexion (`/login`).
2. Entrez votre **Email** et votre **Mot de passe**.
3. Cliquez sur **"Se connecter"**.

---

## 2. Navigation

Une fois connecté, une barre de navigation latérale (à gauche) vous permet d'accéder aux trois modules principaux :
- **Kanban** : Votre tableau de tâches quotidien.
- **Backlog** : Gestion des tickets et planification des sprints.
- **Chronologie** : Vue Gantt de vos projets.

> **Note :** L'application charge automatiquement votre espace de travail personnel. Il n'y a pas de "Tableau de bord" multi-projets ; vous arrivez directement sur votre tableau Kanban.

---

## 3. Module Kanban (Tableau)

Le module Kanban est l'espace de travail principal pour suivre l'état d'avancement des tâches en temps réel.

### Fonctionnalités
- **Colonnes** :
  - Cliquez sur le bouton **"+ Nouvelle colonne"** (en haut à droite ou à droite des colonnes) pour ajouter une étape à votre flux de travail (ex: "À faire", "En cours", "Terminé").
  - Vous pouvez renommer ou supprimer une colonne via le menu d'options de la colonne.
- **Cartes (Tâches)** :
  - Dans une colonne, cliquez sur **"+"** ou **"Ajouter une carte"** pour créer une tâche.
  - **Drag & Drop** : Déplacez les cartes d'une colonne à l'autre par simple glisser-déposer pour changer leur statut.
  - Cliquez sur une carte pour voir ses détails, la modifier ou la supprimer.

---

## 4. Module Backlog

Le Backlog est destiné à la planification à plus long terme et à l'organisation des Sprints (cycles de développement).

### Gestion des Issues (Tickets)
- Cliquez sur le bouton **"+ Nouvelle Issue"** en haut à droite.
- Remplissez les détails (Titre, Description, Priorité, etc.).
- Les issues créées apparaissent dans la liste "Backlog" (en bas) ou peuvent être directement assignées à un sprint.

### Gestion des Sprints
- **Créer un Sprint** : Cliquez sur **"+ Nouveau Sprint"**. Donnez-lui un nom et des dates (début/fin).
- **Planifier** : Glissez-déposez des issues depuis le Backlog vers un Sprint pour les inclure dans ce cycle.
- **Démarrer un Sprint** : Une fois prêt, cliquez sur **"Démarrer"** (bouton de lecture) sur le sprint. Cela active le sprint courant.
- **Cloturer un Sprint** : À la fin du cycle, cliquez sur **"Cloturer"** (bouton stop) pour clore le sprint.

---

## 5. Module Chronologie (Timeline)

La Chronologie vous offre une vue visuelle (Diagramme de Gantt) de vos Sprints et Issues dans le temps.

### Création et Sélection
- Si vous n'avez pas de chronologie, cliquez sur **"Créer une chronologie"**.
- Utilisez le bouton **"Chronologies"** (en haut) pour basculer entre différentes vues ou en créer de nouvelles.

### Configuration de la Vue
- **Sélectionner les éléments** : Cliquez sur le bouton **"Sélectionner"**. Une fenêtre s'ouvre vous permettant de choisir quels **Sprints** et quelles **Issues** vous souhaitez afficher sur le diagramme.
- **Modes d'affichage** : Basculez entre les vues **Jour**, **Semaine** ou **Mois** selon la granularité souhaitée.
- **Zoom** : Utilisez les boutons de loupe pour ajuster l'échelle temporelle.
- **Navigation** :
  - Utilisez le sélecteur de date pour sauter à une période précise.
  - Cliquez sur **"Aujourd'hui"** pour revenir à la date actuelle.

### Interaction
- Le diagramme affiche les barres correspondant à la durée de vos sprints et tâches.
- Les mises à jour de dates peuvent se faire (selon la configuration) directement depuis cette vue ou via le Backlog.

---

## Déconnexion
Pour quitter l'application, cliquez sur le bouton de déconnexion situé généralement en bas de la barre de navigation latérale.
