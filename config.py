import os

class Config:
    # Flask configuration
    SECRET_KEY = os.urandom(24)
    WTF_CSRF_ENABLED = True
    WTF_CSRF_SECRET_KEY = os.urandom(24)

    # Database configuration
    SQLALCHEMY_DATABASE_URI = 'sqlite:///password_manager.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
    # Add production-specific settings here
    # For example:
    # SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')

class TestingConfig(Config):
    TESTING = True
    # Use an in-memory database for testing
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

# Dictionary to map environment names to config objects
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}