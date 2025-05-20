from app import db
from datetime import datetime
import pytz
from app.services.encryption import cipher_suite

paris_tz = pytz.timezone('Europe/Paris')

def get_paris_time():
    return datetime.now(paris_tz)

class PasswordHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    password_id = db.Column(db.Integer, db.ForeignKey('password.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    encrypted_password = db.Column(db.String(500), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    notes = db.Column(db.Text)
    modified_at = db.Column(db.DateTime, default=get_paris_time)
    modified_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    password = db.relationship('Password', backref=db.backref('history', lazy=True, order_by='desc(PasswordHistory.modified_at)'))
    user = db.relationship('User', backref='password_modifications')
    category = db.relationship('Category', backref='password_history')

    def get_password(self):
        return cipher_suite.decrypt(self.encrypted_password.encode()).decode()

    def to_dict(self):
        return {
            'id': self.id,
            'password_id': self.password_id,
            'title': self.title,
            'username': self.username,
            'password': self.get_password(),
            'category': self.category.to_dict() if self.category else None,
            'notes': self.notes,
            'modified_at': self.modified_at.isoformat(),
            'modified_by': self.user.username
        } 