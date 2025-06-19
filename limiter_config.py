# limiter_config.py
# =========================================================
# Flask-Limiter config with Redis backend
# Uses per-IP limiting (can switch to per-user later)
# =========================================================

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Redis URL — adjust if needed (Docker, prod, etc)
redis_url = "redis://localhost:6379"

# Create Limiter instance with Redis backend
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["20 per minute"],
    storage_uri=redis_url
)
