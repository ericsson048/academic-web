"""
Unit tests for role-based permission classes.
"""
import pytest
from django.test import RequestFactory
from rest_framework.views import APIView
from authentication.models import User
from authentication.permissions import (
    IsAdministrator,
    IsTeacherOrAdmin,
    IsAdminOrReadOnly
)


@pytest.mark.django_db
class TestPermissionClasses:
    """Test role-based permission classes"""
    
    def setup_method(self):
        """Set up test users and request factory"""
        self.factory = RequestFactory()
        
        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin_test',
            password='admin123',
            role='admin'
        )
        
        self.teacher_user = User.objects.create_user(
            username='teacher_test',
            password='teacher123',
            role='teacher'
        )
        
        # Create a mock view
        self.view = APIView()
    
    def test_is_administrator_allows_admin(self):
        """Test IsAdministrator allows admin users"""
        permission = IsAdministrator()
        request = self.factory.get('/')
        request.user = self.admin_user
        
        assert permission.has_permission(request, self.view) is True
    
    def test_is_administrator_denies_teacher(self):
        """Test IsAdministrator denies teacher users"""
        permission = IsAdministrator()
        request = self.factory.get('/')
        request.user = self.teacher_user
        
        assert permission.has_permission(request, self.view) is False
    
    def test_is_administrator_denies_unauthenticated(self):
        """Test IsAdministrator denies unauthenticated users"""
        permission = IsAdministrator()
        request = self.factory.get('/')
        request.user = None
        
        assert permission.has_permission(request, self.view) is False
    
    def test_is_teacher_or_admin_allows_admin(self):
        """Test IsTeacherOrAdmin allows admin users"""
        permission = IsTeacherOrAdmin()
        request = self.factory.get('/')
        request.user = self.admin_user
        
        assert permission.has_permission(request, self.view) is True
    
    def test_is_teacher_or_admin_allows_teacher(self):
        """Test IsTeacherOrAdmin allows teacher users"""
        permission = IsTeacherOrAdmin()
        request = self.factory.get('/')
        request.user = self.teacher_user
        
        assert permission.has_permission(request, self.view) is True
    
    def test_is_teacher_or_admin_denies_unauthenticated(self):
        """Test IsTeacherOrAdmin denies unauthenticated users"""
        permission = IsTeacherOrAdmin()
        request = self.factory.get('/')
        request.user = None
        
        assert permission.has_permission(request, self.view) is False
    
    def test_is_admin_or_readonly_allows_admin_write(self):
        """Test IsAdminOrReadOnly allows admin to write"""
        permission = IsAdminOrReadOnly()
        request = self.factory.post('/')
        request.user = self.admin_user
        
        assert permission.has_permission(request, self.view) is True
    
    def test_is_admin_or_readonly_allows_teacher_read(self):
        """Test IsAdminOrReadOnly allows teacher to read"""
        permission = IsAdminOrReadOnly()
        request = self.factory.get('/')
        request.user = self.teacher_user
        
        assert permission.has_permission(request, self.view) is True
    
    def test_is_admin_or_readonly_denies_teacher_write(self):
        """Test IsAdminOrReadOnly denies teacher write operations"""
        permission = IsAdminOrReadOnly()
        request = self.factory.post('/')
        request.user = self.teacher_user
        
        assert permission.has_permission(request, self.view) is False
    
    def test_is_admin_or_readonly_allows_admin_read(self):
        """Test IsAdminOrReadOnly allows admin to read"""
        permission = IsAdminOrReadOnly()
        request = self.factory.get('/')
        request.user = self.admin_user
        
        assert permission.has_permission(request, self.view) is True
