from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.fernet import Fernet
import os
from datetime import datetime, timedelta
import json
import secrets
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from flask_wtf.csrf import CSRFProtect
import pytz

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///password_manager.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['WTF_CSRF_ENABLED'] = True
app.config['WTF_CSRF_SECRET_KEY'] = os.urandom(24)

# Set timezone to Paris
paris_tz = pytz.timezone('Europe/Paris')

db = SQLAlchemy(app)
csrf = CSRFProtect(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Gestion de la clé de chiffrement
def get_or_create_encryption_key():
    key_file = 'encryption.key'
    if os.path.exists(key_file):
        with open(key_file, 'rb') as f:
            return f.read()
    else:
        key = Fernet.generate_key()
        with open(key_file, 'wb') as f:
            f.write(key)
        return key

# Initialisation de la clé de chiffrement
ENCRYPTION_KEY = get_or_create_encryption_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    passwords = db.relationship('Password', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Password(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    encrypted_password = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_modified = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def set_password(self, password):
        self.encrypted_password = cipher_suite.encrypt(password.encode()).decode()

    def get_password(self):
        return cipher_suite.decrypt(self.encrypted_password.encode()).decode()

class SharedPassword(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    password_id = db.Column(db.Integer, db.ForeignKey('password.id'), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    max_views = db.Column(db.Integer, nullable=False, default=1)  # Default to 1 view
    current_views = db.Column(db.Integer, nullable=False, default=0)  # Track number of views
    is_active = db.Column(db.Boolean, default=True)

    password = db.relationship('Password', backref=db.backref('shares', lazy=True))

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form.get('username')).first()
        if user and user.check_password(request.form.get('password')):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Invalid username or password', 'danger')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'danger')
            return redirect(url_for('register'))
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'danger')
            return redirect(url_for('register'))
        
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    passwords = Password.query.filter_by(user_id=current_user.id).all()
    return render_template('dashboard.html', passwords=passwords)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

# Routes API pour la gestion des mots de passe
@app.route('/add_password', methods=['POST'])
@login_required
def add_password():
    try:
        title = request.form.get('title')
        username = request.form.get('username')
        password = request.form.get('password')
        category = request.form.get('category')
        notes = request.form.get('notes')

        new_password = Password(
            title=title,
            username=username,
            category=category,
            notes=notes,
            user_id=current_user.id
        )
        new_password.set_password(password)
        
        db.session.add(new_password)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/get_password/<int:password_id>')
@login_required
def get_password(password_id):
    try:
        password = Password.query.get_or_404(password_id)
        if password.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'})
        
        return jsonify({
            'success': True,
            'password': {
                'id': password.id,
                'title': password.title,
                'username': password.username,
                'password': password.get_password(),
                'category': password.category,
                'notes': password.notes
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/update_password', methods=['POST'])
@login_required
def update_password():
    try:
        password_id = request.form.get('id')
        password = Password.query.get_or_404(password_id)
        
        if password.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'})
        
        password.title = request.form.get('title')
        password.username = request.form.get('username')
        password.category = request.form.get('category')
        password.notes = request.form.get('notes')
        
        if request.form.get('password'):
            password.set_password(request.form.get('password'))
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/delete_password/<int:password_id>', methods=['DELETE'])
@login_required
def delete_password(password_id):
    try:
        password = Password.query.get_or_404(password_id)
        if password.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'})
        
        db.session.delete(password)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/password_generator')
@login_required
def password_generator():
    return render_template('password_generator.html')

@app.route('/share_password/<int:password_id>', methods=['POST'])
@login_required
def share_password(password_id):
    try:
        # Get the password
        password = Password.query.filter_by(id=password_id, user_id=current_user.id).first()
        if not password:
            return jsonify({'error': 'Mot de passe non trouvé'}), 404

        # Get expiration datetime and max views from request
        data = request.get_json()
        expires_at = datetime.fromisoformat(data.get('expires_at').replace('Z', '+00:00'))
        max_views = int(data.get('max_views', 1))  # Default to 1 view if not specified
        
        # Validate max views
        if max_views < 1 or max_views > 10:
            return jsonify({'error': 'Le nombre de vues doit être entre 1 et 10'}), 400
        
        # Convert to Paris timezone
        expires_at = paris_tz.localize(expires_at)
        
        # Validate expiration datetime
        now = datetime.now(paris_tz)
        if expires_at <= now:
            return jsonify({'error': 'La date d\'expiration doit être dans le futur'}), 400
        
        if expires_at > now + timedelta(days=90):
            return jsonify({'error': 'La date d\'expiration ne peut pas être plus de 90 jours dans le futur'}), 400

        # Generate a unique token
        token = secrets.token_urlsafe(32)
        
        # Create shared password entry
        shared_password = SharedPassword(
            password_id=password.id,
            token=token,
            expires_at=expires_at,
            max_views=max_views,
            current_views=0
        )
        
        db.session.add(shared_password)
        db.session.commit()
        
        # Generate the share URL
        share_url = url_for('view_shared_password', token=token, _external=True)
        
        return jsonify({
            'success': True,
            'share_url': share_url,
            'expires_at': shared_password.expires_at.astimezone(paris_tz).isoformat(),
            'max_views': max_views
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/shared/<token>')
def view_shared_password(token):
    try:
        # Get the shared password
        shared = SharedPassword.query.filter_by(token=token).first_or_404()
        
        # Check if the link has expired
        now = datetime.now(paris_tz)
        if shared.expires_at.astimezone(paris_tz) < now:
            return render_template('shared_password.html', 
                                 error='Ce lien de partage a expiré.',
                                 password=None,
                                 expires_at=None)
        
        # Check if max views reached
        if shared.current_views >= shared.max_views:
            return render_template('shared_password.html', 
                                 error='Ce lien a atteint le nombre maximum de vues autorisées.',
                                 password=None,
                                 expires_at=None)
        
        # Increment view count
        shared.current_views += 1
        db.session.commit()
        
        # Get the password details
        password = shared.password
        
        return render_template('shared_password.html', 
                             password=password, 
                             expires_at=shared.expires_at.astimezone(paris_tz),
                             error=None,
                             views_remaining=shared.max_views - shared.current_views)
    except Exception as e:
        return render_template('shared_password.html', 
                             error=str(e),
                             password=None,
                             expires_at=None)

@app.route('/revoke_share/<int:share_id>', methods=['POST'])
@login_required
def revoke_share(share_id):
    share = SharedPassword.query.get_or_404(share_id)
    
    # Check if user owns the password
    if share.password.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    share.is_active = False
    db.session.commit()
    
    return jsonify({'success': True})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True) 