from app import db
from datetime import datetime

class SharedPassword(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    password_id = db.Column(db.Integer, db.ForeignKey('password.id'), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    max_views = db.Column(db.Integer, nullable=True)
    views_count = db.Column(db.Integer, default=0)

    # Relationships
    password = db.relationship('Password', backref=db.backref('shares', lazy=True))