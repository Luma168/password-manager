from flask import Blueprint
from app import db
from app.models.password import Password
from app.models.shared_password import SharedPassword
from flask import jsonify, request, render_template, url_for
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import pytz
import secrets

paris_tz = pytz.timezone('Europe/Paris')

sharing = Blueprint('sharing', __name__)

@sharing.route('/share_password/<int:password_id>', methods=['POST'])
@login_required
def share_password(password_id):
    """
    Route pour partager un mot de passe.
    """
    try:
        password = Password.query.filter_by(id=password_id, user_id=current_user.id).first()
        if not password:
            return jsonify({'error': 'Mot de passe non trouvé'}), 404

        data = request.get_json()
        expires_at = datetime.fromisoformat(data.get('expires_at').replace('Z', '+00:00'))
        max_views = data.get('max_views')
        
        expires_at = paris_tz.localize(expires_at)
        
        now = datetime.now(paris_tz)
        if expires_at <= now:
            return jsonify({'error': 'La date d\'expiration doit être dans le futur'}), 400
        
        if expires_at > now + timedelta(days=90):
            return jsonify({'error': 'La date d\'expiration ne peut pas être plus de 90 jours dans le futur'}), 400

        if max_views is not None:
            try:
                max_views = int(max_views)
                if max_views < 1 or max_views > 100:
                    return jsonify({'error': 'Le nombre maximum de vues doit être entre 1 et 100'}), 400
            except ValueError:
                return jsonify({'error': 'Le nombre maximum de vues doit être un nombre entier'}), 400

        # Generate a unique token
        token = secrets.token_urlsafe(32)
        
        shared_password = SharedPassword(
            password_id=password.id,
            token=token,
            expires_at=expires_at,
            max_views=max_views
        )
        
        db.session.add(shared_password)
        db.session.commit()
        
        # Generate the share URL
        share_url = url_for('sharing.view_shared_password', token=token, _external=True)
        
        return jsonify({
            'success': True,
            'share_url': share_url,
            'expires_at': shared_password.expires_at.astimezone(paris_tz).isoformat(),
            'max_views': shared_password.max_views
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@sharing.route('/shared/<token>')
def view_shared_password(token):
    """
    Route pour afficher un mot de passe partagé.
    """
    try:
        shared = SharedPassword.query.filter_by(token=token).first_or_404()
        
        # Check if the link has expired
        now = datetime.now(paris_tz)
        if shared.expires_at.astimezone(paris_tz) < now:
            return render_template('shared_password.html', 
                                 error='Ce lien de partage a expiré.',
                                 password=None,
                                 expires_at=None)
        
        # Check if max views limit is reached
        if shared.max_views is not None and shared.views_count >= shared.max_views:
            return render_template('shared_password.html', 
                                 error='Ce lien de partage a atteint le nombre maximum de vues autorisées.',
                                 password=None,
                                 expires_at=None)
        
        # Increment view count
        shared.views_count += 1
        db.session.commit()
        
        # Get the password details
        password = shared.password
        
        return render_template('shared_password.html', 
                             password=password, 
                             expires_at=shared.expires_at.astimezone(paris_tz),
                             error=None,
                             views_count=shared.views_count,
                             max_views=shared.max_views)
    except Exception as e:
        return render_template('shared_password.html', 
                             error=str(e),
                             password=None,
                             expires_at=None)