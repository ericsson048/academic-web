"""
Custom permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission


class IsAdministrator(BasePermission):
    """
    Permission class that allows access only to users with 'admin' role.
    
    Used for endpoints that require administrative privileges:
    - Student management (create, update, delete)
    - User management
    - System configuration
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and has admin role.
        """
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # User must have admin role
        return request.user.role == 'admin'
    
    message = 'Only administrators can perform this action.'


class IsTeacherOrAdmin(BasePermission):
    """
    Permission class that allows access to users with 'teacher' or 'admin' role.
    
    Used for endpoints that both teachers and admins can access:
    - Grade entry and management
    - Report generation
    - Analytics viewing
    - Student data viewing (read-only for teachers)
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and has teacher or admin role.
        """
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # User must have teacher or admin role
        return request.user.role in ['teacher', 'admin']
    
    message = 'Only teachers and administrators can perform this action.'


class IsAdminOrReadOnly(BasePermission):
    """
    Permission class that allows:
    - Full access (read and write) for admins
    - Read-only access for teachers
    
    Used for endpoints where teachers need to view data but only admins can modify:
    - Subject list (teachers view, admins manage)
    - Class list (teachers view, admins manage)
    - Semester list (teachers view, admins manage)
    """
    
    def has_permission(self, request, view):
        """
        Check permissions based on request method and user role.
        """
        # User must be authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # User must be teacher or admin
        if request.user.role not in ['teacher', 'admin']:
            return False
        
        # Read operations (GET, HEAD, OPTIONS) allowed for both
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write operations (POST, PUT, PATCH, DELETE) only for admins
        return request.user.role == 'admin'
    
    message = 'Only administrators can modify this resource.'
