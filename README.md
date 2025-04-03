# Gestionnaire de Mots de Passe

Une application de gestion de mots de passe développée avec Flask.

## Fonctionnalités

- **Stockage Sécurisé des Mots de Passe** : Tous les mots de passe sont chiffrés avant d'être stockés
- **Authentification Utilisateur** : Système sécurisé de connexion et d'inscription
- **Catégories de Mots de Passe** : Organisez vos mots de passe en catégories personnalisées
- **Partage de Mots de Passe** : Partagez des mots de passe de manière sécurisée avec d'autres utilisateurs
- **Générateur de Mots de Passe** : Générez des mots de passe forts et aléatoires
- **Fonction de Recherche** : Trouvez rapidement des mots de passe par titre, nom d'utilisateur ou catégorie
- **Design Responsive** : Fonctionne sur ordinateurs de bureau et appareils mobiles

## Structure du Projet

```
password-manager/
├── app/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── password.py
│   │   ├── category.py
│   │   └── shared_password.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── passwords.py
│   │   ├── categories.py
│   │   └── sharing.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── encryption.py
│   │   ├── password_service.py
│   │   └── sharing_service.py
│   ├── utils/
│   │   ├── __init__.py
│   │   └── helpers.py
│   ├── static/
│   │   ├── css/
│   │   │   ├── base.css
│   │   │   ├── dashboard.css
│   │   │   └── style.css
│   │   └── js/
│   │       ├── main.js
│   │       ├── dashboard.js
│   │       ├── passwords.js
│   │       ├── categories.js
│   │       └── sharing.js
│   ├── templates/
│   │   ├── base.html
│   │   ├── login.html
│   │   ├── register.html
│   │   └── dashboard.html
│   └── __init__.py
├── instance/
│   └── passwords.db
├── config.py
├── run.py
├── requirements.txt
└── encryption.key
```

## Installation

1. Clonez le dépôt :
   ```
   git clone https://github.com/yourusername/password-manager.git
   cd password-manager
   ```

2. Créez un environnement virtuel :
   ```
   python -m venv venv
   ```

3. Activez l'environnement virtuel :
   - Windows :
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux :
     ```
     source venv/bin/activate
     ```

4. Installez les dépendances :
   ```
   pip install -r requirements.txt
   ```

5. Lancez l'application :
   ```
   python run.py
   ```

## Fonctionnalités de Sécurité

- **Chiffrement** : Tous les mots de passe sont chiffrés à l'aide du chiffrement symétrique Fernet
- **Protection CSRF** : Tous les formulaires sont protégés contre les attaques CSRF
- **Gestion Sécurisée des Sessions** : Les sessions utilisateur sont gérées de manière sécurisée
- **Hachage des Mots de Passe** : Les mots de passe utilisateur sont hachés avec bcrypt
- **Partage Sécurisé** : Les mots de passe partagés ont des dates d'expiration et des limites de visualisation

## Technologies Utilisées

- **Backend** : Flask, SQLAlchemy, Flask-Login
- **Frontend** : HTML, CSS, JavaScript, Bootstrap 5
- **Base de Données** : SQLite 
- **Sécurité** : Flask-WTF, bcrypt, cryptography
