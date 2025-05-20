from flask import Blueprint
from app import db
from app.models.password import Password
from app.models.shared_password import SharedPassword
from flask import jsonify, request, render_template
from flask_login import login_required, current_user
from app.models.password_history import PasswordHistory
from werkzeug.security import check_password_hash
import json
from datetime import datetime
from flask import make_response
from app.services.encryption import cipher_suite


passwords = Blueprint('passwords', __name__)

@passwords.route('/dashboard')
@login_required
def dashboard():
    category_id = request.args.get('category', type=int)
    query = Password.query.filter_by(user_id=current_user.id)
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    passwords = query.all()
    return render_template('dashboard.html', passwords=passwords)

@passwords.route('/add_password', methods=['POST'])
@login_required
def add_password():
    try:
        title = request.form.get('title')
        username = request.form.get('username')
        password = request.form.get('password')
        category_id = request.form.get('category_id')
        notes = request.form.get('notes')

        new_password = Password(
            title=title,
            username=username,
            category_id=category_id if category_id else None,
            notes=notes,
            user_id=current_user.id
        )
        new_password.set_password(password)
        
        db.session.add(new_password)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@passwords.route('/get_password/<int:password_id>')
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
                'category': password.category.to_dict() if password.category else None,
                'notes': password.notes
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@passwords.route('/update_password', methods=['POST'])
@login_required
def update_password():
    try:
        password_id = request.form.get('id')
        password = Password.query.get_or_404(password_id)
        
        if password.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'})
        
        # Create history entry before updating
        history = PasswordHistory(
            password_id=password.id,
            title=password.title,
            username=password.username,
            encrypted_password=password.encrypted_password,
            category_id=password.category_id,
            notes=password.notes,
            modified_by=current_user.id
        )
        db.session.add(history)
        
        password.title = request.form.get('title')
        password.username = request.form.get('username')
        password.category_id = request.form.get('category_id')
        password.notes = request.form.get('notes')
        
        if request.form.get('password'):
            password.set_password(request.form.get('password'))
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})

@passwords.route('/get_password_history/<int:password_id>')
@login_required
def get_password_history(password_id):
    try:
        password = Password.query.get_or_404(password_id)
        if password.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'})
        
        history = PasswordHistory.query.filter_by(password_id=password_id).order_by(PasswordHistory.modified_at.desc()).all()
        return jsonify({
            'success': True,
            'history': [entry.to_dict() for entry in history]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@passwords.route('/delete_password/<int:password_id>', methods=['DELETE'])
@login_required
def delete_password(password_id):
    try:
        password = Password.query.get_or_404(password_id)
        if password.user_id != current_user.id:
            return jsonify({'success': False, 'error': 'Unauthorized'})
        
        # Delete shared passwords
        SharedPassword.query.filter_by(password_id=password_id).delete()
        
        # Delete history entries
        PasswordHistory.query.filter_by(password_id=password_id).delete()
        
        db.session.delete(password)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})
    
@passwords.route('/password_generator')
@login_required
def password_generator():
    return render_template('password_generator.html')

@passwords.route('/export-passwords', methods=['POST'])
@login_required
def export_passwords():
    account_password = request.form.get('password')
    
    # Vérifier le mot de passe de l'utilisateur
    if not current_user.check_password(account_password):
        return jsonify({'error': 'Mot de passe incorrect'}), 401
    
    passwords = Password.query.filter_by(user_id=current_user.id).all()
    
    export_data = {
        'export_date': datetime.now().isoformat(),
        'passwords': []
    }
    
    for pwd in passwords:
        history = PasswordHistory.query.filter_by(password_id=pwd.id).order_by(PasswordHistory.modified_at.desc()).all()
        
        password_data = {
            'title': pwd.title,
            'username': pwd.username,
            'password': pwd.get_password(),
            'notes': pwd.notes,
            'created_at': pwd.created_at.isoformat(),
            'last_modified': pwd.last_modified.isoformat(),
            'history': [{
                'title': entry.title,
                'username': entry.username,
                'password': entry.get_password(),
                'notes': entry.notes,
                'modified_at': entry.modified_at.isoformat(),
                'modified_by': entry.user.username
            } for entry in history]
        }
        export_data['passwords'].append(password_data)
    
    json_data = json.dumps(export_data, ensure_ascii=False).encode('utf-8')
    encrypted_data = cipher_suite.encrypt(json_data)
    
    response = make_response(encrypted_data)
    response.headers['Content-Type'] = 'application/octet-stream'
    response.headers['Content-Disposition'] = 'attachment; filename=passwords.enc'
    return response

@passwords.route('/import-passwords', methods=['POST'])
@login_required
def import_passwords():
    if 'file' not in request.files:
        return jsonify({'error': 'Aucun fichier n\'a été envoyé'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Aucun fichier sélectionné'}), 400
    
    if not file.filename.endswith('.enc'):
        return jsonify({'error': 'Le fichier doit être au format chiffré (.enc)'}), 400
    
    account_password = request.form.get('password')
    if not current_user.check_password(account_password):
        return jsonify({'error': 'Mot de passe incorrect'}), 401
    
    try:
        encrypted_data = file.read()
        try:
            decrypted_data = cipher_suite.decrypt(encrypted_data)
            import_data = json.loads(decrypted_data.decode('utf-8'))
        except Exception as e:
            return jsonify({'error': 'Fichier chiffré invalide ou corrompu'}), 400
        
        if not isinstance(import_data, dict) or 'passwords' not in import_data:
            return jsonify({'error': 'Format de fichier invalide'}), 400
        
        # Importer chaque mot de passe
        for pwd_data in import_data['passwords']:
            # Vérifier les champs requis
            required_fields = ['title', 'username', 'password']
            if not all(field in pwd_data for field in required_fields):
                continue
            
            new_password = Password(
                user_id=current_user.id,
                title=pwd_data['title'],
                username=pwd_data['username'],
                notes=pwd_data.get('notes', '')
            )
            new_password.set_password(pwd_data['password'])
            
            if 'created_at' in pwd_data:
                new_password.created_at = datetime.fromisoformat(pwd_data['created_at'])
            if 'last_modified' in pwd_data:
                new_password.last_modified = datetime.fromisoformat(pwd_data['last_modified'])
            
            db.session.add(new_password)
            db.session.flush()
            
            if 'history' in pwd_data:
                for history_entry in pwd_data['history']:
                    history = PasswordHistory(
                        password_id=new_password.id,
                        title=history_entry['title'],
                        username=history_entry['username'],
                        encrypted_password=cipher_suite.encrypt(history_entry['password'].encode()).decode(),
                        notes=history_entry.get('notes', ''),
                        modified_at=datetime.fromisoformat(history_entry['modified_at']),
                        modified_by=current_user.id
                    )
                    db.session.add(history)
        
        db.session.commit()
        return jsonify({'message': 'Import réussi'})
        
    except json.JSONDecodeError:
        return jsonify({'error': 'Fichier JSON invalide'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erreur lors de l\'import: {str(e)}'}), 500