from flask import Blueprint
from app import db
from app.models.category import Category
from app.models.password import Password
from flask import jsonify, request
from flask_login import login_required, current_user

categories = Blueprint('categories', __name__)

@categories.route('/categories')
@login_required
def get_categories():
    """
    Route pour récupérer toutes les catégories de l'utilisateur.
    """
    categories = Category.query.filter_by(user_id=current_user.id).all()
    return jsonify([category.to_dict() for category in categories])

@categories.route('/add_category', methods=['POST'])
@login_required
def add_category():
    """
    Route pour ajouter une nouvelle catégorie.
    """
    try:
        name = request.form.get('name')
        icon = request.form.get('icon')
        
        if not name or not icon:
            return jsonify({'success': False, 'error': 'Le nom et l\'icône sont requis'})
        
        # Check if category name already exists for this user
        if Category.query.filter_by(user_id=current_user.id, name=name).first():
            return jsonify({'success': False, 'error': 'Cette catégorie existe déjà'})
        
        category = Category(
            name=name,
            icon=icon,
            user_id=current_user.id
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify({'success': True, 'category': category.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)})
    
@categories.route('/update_category/<int:id>', methods=['POST'])
@login_required
def update_category(id):
    """
    Route pour mettre à jour une catégorie.
    """
    try:
        data = request.get_json()
        name = data.get('name')
        icon = data.get('icon')
        
        if not name:
            return jsonify({'success': False, 'error': 'Le nom de la catégorie est requis'}), 400
            
        # Check if category exists and belongs to user
        category = Category.query.filter_by(id=id, user_id=current_user.id).first()
        if not category:
            return jsonify({'success': False, 'error': 'Catégorie non trouvée'}), 404
            
        # Check if another category with the same name exists
        existing_category = Category.query.filter(
            Category.name == name,
            Category.user_id == current_user.id,
            Category.id != id
        ).first()
        if existing_category:
            return jsonify({'success': False, 'error': 'Cette catégorie existe déjà'}), 400
            
        category.name = name
        category.icon = icon
        db.session.commit()
        
        return jsonify({
            'success': True,
            'category': category.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    
@categories.route('/delete_category/<int:id>', methods=['DELETE'])
@login_required
def delete_category(id):
    """
    Route pour supprimer une catégorie.
    """
    try:
        # Check if category exists and belongs to user
        category = Category.query.filter_by(id=id, user_id=current_user.id).first()
        if not category:
            return jsonify({'success': False, 'error': 'Catégorie non trouvée'}), 404
            
        # Update all passwords in this category to have no category
        Password.query.filter_by(category_id=id, user_id=current_user.id).update({'category_id': None})
        
        db.session.delete(category)
        db.session.commit()
        
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500