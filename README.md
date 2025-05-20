# Gestionnaire de Mots de Passe

Une application de gestion de mots de passe développée avec Flask.

## Fonctionnalités

- **Stockage Sécurisé des Mots de Passe** : Tous les mots de passe sont chiffrés avant d'être stockés
- **Authentification Utilisateur** : Système sécurisé de connexion et d'inscription
- **Catégories de Mots de Passe** : Organisez vos mots de passe en catégories personnalisées
- **Partage de Mots de Passe** : Partagez des mots de passe de manière sécurisée avec d'autres utilisateurs
- **Générateur de Mots de Passe** : Générez des mots de passe forts et aléatoires
- **Fonction de Recherche** : Trouvez rapidement des mots de passe par titre, nom d'utilisateur ou catégorie
- **Menu Contextuel Personnalisé** : Clic droit sur les mots de passe pour copier rapidement les champs (identifiant, mot de passe, notes) ou partager le mot de passe

## Chiffrement des Données

L'application utilise l'algorithme Fernet (implémentation de la bibliothèque `cryptography`) pour le chiffrement symétrique des données sensibles. Fernet garantit que les données chiffrées ne peuvent pas être manipulées ou lues sans la clé de chiffrement.

⚠️ **Important** : 
- Ne partagez jamais votre clé de chiffrement
- Faites une sauvegarde sécurisée de votre clé
- Si vous perdez la clé, vous ne pourrez plus accéder aux données chiffrées

## Structure du Projet

```
password-manager/
├── app/
│   ├── models/
│   │   ├── user.py
│   │   ├── password.py
│   │   ├── category.py
│   │   ├── shared_password.py
|   |   └── password_history.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── passwords.py
│   │   ├── categories.py
│   │   └── sharing.py
│   ├── services/
│   │   └── encryption.py
│   ├── static/
│   │   ├── css/
│   │   │   ├── base.css
│   │   │   └── dashboard.css
│   │   └── js/
│   │       └── dashboard.js
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── password_generator.html
│   └── shared_password.html
├── instance/
│   └── password_manager.db
├── config.py
├── run.py
├── requirements.txt
├── encryption.key
└── .gitignore
```

## Installation et Lancement

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
     .\venv\Scripts\activate
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

6. Accédez à l'application dans votre navigateur à l'adresse : `http://localhost:5000`