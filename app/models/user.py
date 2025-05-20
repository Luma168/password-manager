from app import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

class User(UserMixin, db.Model):
    """
    Modèle pour les utilisateurs.
    """
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))

    # Relationships
    passwords = db.relationship('Password', backref='user', lazy=True)

    def set_password(self, password):
        """
        Chiffre le mot de passe et le stocke dans la base de données.
        """
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """
        Vérifie si le mot de passe est correct.
        """
        return check_password_hash(self.password_hash, password)