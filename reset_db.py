import os
from app import db

# Supprimer le fichier de base de données existant
if os.path.exists('password_manager.db'):
    os.remove('password_manager.db')

# Supprimer le fichier de clé de chiffrement existant
if os.path.exists('encryption.key'):
    os.remove('encryption.key')

# Créer une nouvelle base de données
with app.app_context():
    db.create_all()

print("Base de données réinitialisée avec succès!") 