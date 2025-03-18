from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.fernet import Fernet
import os
from datetime import datetime
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///password_manager.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True) 