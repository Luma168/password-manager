from flask import Blueprint
from app import db
from app.models.password import Password
from app.models.shared_password import SharedPassword
from flask import jsonify, request, render_template
from flask_login import login_required, current_user
from app.models.password_history import PasswordHistory


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



# Routes API pour la gestion des mots de passe
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
        
        # Update password
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
        
        # Delete history entries first
        PasswordHistory.query.filter_by(password_id=password_id).delete()
        
        # Then delete the password
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