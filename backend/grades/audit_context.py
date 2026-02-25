"""
Thread-local helpers to expose the current request user to model signals.
"""
from contextlib import contextmanager
from threading import local


_storage = local()


def get_current_user():
    """
    Return the current request user if available.
    """
    return getattr(_storage, 'user', None)


@contextmanager
def audit_user(user):
    """
    Temporarily store the acting user for grade audit signal handlers.
    """
    previous_user = getattr(_storage, 'user', None)
    _storage.user = user
    try:
        yield
    finally:
        if previous_user is None:
            if hasattr(_storage, 'user'):
                delattr(_storage, 'user')
        else:
            _storage.user = previous_user
