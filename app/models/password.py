from app import db
from datetime import datetime
from app.services.encryption import cipher_suite

class Password(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    encrypted_password = db.Column(db.String(500), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_modified = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def set_password(self, password):
        self.encrypted_password = cipher_suite.encrypt(password.encode()).decode()

    def get_password(self):
        return cipher_suite.decrypt(self.encrypted_password.encode()).decode()

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'username': self.username,
            'category': self.category.to_dict() if self.category else None,
            'notes': self.notes,
            'created_at': self.created_at.isoformat(),
            'last_modified': self.last_modified.isoformat()
        }
