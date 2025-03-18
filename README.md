# Gestionnaire de Mots de Passe

Une application web sécurisée pour gérer vos mots de passe, développée avec Flask.

## Fonctionnalités

- Création de compte utilisateur sécurisé
- Stockage chiffré des mots de passe
- Génération de mots de passe aléatoires
- Catégorisation des mots de passe
- Recherche de mots de passe
- Interface utilisateur intuitive et responsive

## Prérequis

- Python 3.8 ou supérieur
- pip (gestionnaire de paquets Python)

## Installation

1. Clonez le dépôt :
```bash
git clone [URL_DU_REPO]
cd password-manager
```

2. Créez un environnement virtuel et activez-le :
```bash
python -m venv venv
# Sur Windows
venv\Scripts\activate
# Sur Linux/Mac
source venv/bin/activate
```

3. Installez les dépendances :
```bash
pip install -r requirements.txt
```

## Configuration

1. Assurez-vous que toutes les dépendances sont installées
2. La base de données SQLite sera créée automatiquement lors du premier lancement

## Lancement de l'application

1. Activez l'environnement virtuel si ce n'est pas déjà fait
2. Lancez l'application :
```bash
python app.py
```

3. Ouvrez votre navigateur et accédez à :
```
http://localhost:5000
```

## Sécurité

- Les mots de passe sont chiffrés avec AES-256
- Les sessions utilisateur sont sécurisées
- Protection contre les injections SQL
- Validation des entrées utilisateur
- Stockage sécurisé des mots de passe

## Structure du Projet

```
password-manager/
├── app.py              # Application principale
├── requirements.txt    # Dépendances du projet
├── README.md          # Documentation
└── templates/         # Templates HTML
    ├── base.html      # Template de base
    ├── index.html     # Page d'accueil
    ├── login.html     # Page de connexion
    ├── register.html  # Page d'inscription
    └── dashboard.html # Tableau de bord
```

## Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails. 