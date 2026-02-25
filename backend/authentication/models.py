"""
User model for APAS authentication system.
"""
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager
from django.db import models


class APASUserManager(UserManager):
    """
    Custom manager preserving the exact username/email representation provided.
    """

    @classmethod
    def normalize_email(cls, email):
        return email

    @classmethod
    def normalize_username(cls, username):
        return username


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    Adds role field for role-based access control.
    """
    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('teacher', 'Teacher'),
    ]
    
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='teacher',
        help_text='User role for access control'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    objects = APASUserManager()

    @classmethod
    def normalize_username(cls, username):
        """
        Preserve the original username representation.
        """
        return username
    
    class Meta:
        db_table = 'auth_user'
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['username']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
