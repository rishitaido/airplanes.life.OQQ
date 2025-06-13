# limiter_config.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from limits.storage import RedisStorage
from redis import Redis

# Define Redis storage URL
redis_url = "redis://localhost:6379"

# Create a RedisStorage instance
redis_storage = RedisStorage(redis_url)

# Create a Limiter WITHOUT attaching it yet
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["20 per minute"]
)

# Save the storage to apply later in app.py
limiter._storage = redis_storage  # Hacky but effective until .init_app()
