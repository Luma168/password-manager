from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from flask_wtf.csrf import CSRFProtect
import os

# Initialize extensions
db = SQLAlchemy()
csrf = CSRFProtect()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'

def create_app():
    app = Flask(__name__, template_folder='../templates')
    
    # Load configuration
    app.config.from_object('config.Config')
    
    # Initialize extensions
    db.init_app(app)
    csrf.init_app(app)
    login_manager.init_app(app)
    
    # Import models here to avoid circular imports
    from app.models.user import User
    from app.models.password import Password
    from app.models.category import Category
    from app.models.shared_password import SharedPassword
    
    # Create database if it doesn't exist
    with app.app_context():
        if not os.path.exists(app.instance_path):
            os.makedirs(app.instance_path)
        db.create_all()
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    @app.context_processor
    def inject_categories():
        if current_user.is_authenticated:
            categories = Category.query.filter_by(user_id=current_user.id).all()
            return {'categories': categories}
        return {'categories': []}
    
    # Register blueprints
    from app.routes.auth import auth
    from app.routes.passwords import passwords
    from app.routes.categories import categories
    from app.routes.sharing import sharing
    
    app.register_blueprint(auth)
    app.register_blueprint(passwords)
    app.register_blueprint(categories)
    app.register_blueprint(sharing)
    
    return app