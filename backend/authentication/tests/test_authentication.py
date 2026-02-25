"""
Unit tests for authentication endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from authentication.models import User


@pytest.mark.django_db
class TestAuthenticationEndpoints:
    """Test authentication API endpoints"""
    
    def setup_method(self):
        """Set up test client and test user"""
        self.client = APIClient()
        
        # Create test users
        self.admin_user = User.objects.create_user(
            username='admin_test',
            password='admin123!@#',
            email='admin@test.com',
            role='admin'
        )
        
        self.teacher_user = User.objects.create_user(
            username='teacher_test',
            password='teacher123!@#',
            email='teacher@test.com',
            role='teacher'
        )
    
    def test_login_with_valid_credentials(self):
        """Test login with valid admin credentials returns tokens"""
        url = reverse('authentication:login')
        data = {
            'username': 'admin_test',
            'password': 'admin123!@#'
        }
        
        response = self.client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data
        assert response.data['user']['username'] == 'admin_test'
        assert response.data['user']['role'] == 'admin'
    
    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials returns error"""
        url = reverse('authentication:login')
        data = {
            'username': 'admin_test',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'non_field_errors' in response.data
    
    def test_login_with_missing_fields(self):
        """Test login with missing fields returns validation error"""
        url = reverse('authentication:login')
        data = {
            'username': 'admin_test'
            # Missing password
        }
        
        response = self.client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    def test_get_current_user_authenticated(self):
        """Test getting current user info when authenticated"""
        # Login first
        login_url = reverse('authentication:login')
        login_data = {
            'username': 'teacher_test',
            'password': 'teacher123!@#'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        access_token = login_response.data['access']
        
        # Get current user
        url = reverse('authentication:current_user')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['username'] == 'teacher_test'
        assert response.data['role'] == 'teacher'
        assert 'id' in response.data
        assert 'email' in response.data
    
    def test_get_current_user_unauthenticated(self):
        """Test getting current user without authentication fails"""
        url = reverse('authentication:current_user')
        response = self.client.get(url)
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_logout_with_valid_token(self):
        """Test logout with valid refresh token"""
        # Login first
        login_url = reverse('authentication:login')
        login_data = {
            'username': 'admin_test',
            'password': 'admin123!@#'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        access_token = login_response.data['access']
        refresh_token = login_response.data['refresh']
        
        # Logout
        logout_url = reverse('authentication:logout')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_data = {'refresh': refresh_token}
        response = self.client.post(logout_url, logout_data, format='json')
        
        assert response.status_code == status.HTTP_205_RESET_CONTENT
        assert 'message' in response.data
    
    def test_token_refresh(self):
        """Test refreshing access token with valid refresh token"""
        # Login first
        login_url = reverse('authentication:login')
        login_data = {
            'username': 'admin_test',
            'password': 'admin123!@#'
        }
        login_response = self.client.post(login_url, login_data, format='json')
        refresh_token = login_response.data['refresh']
        
        # Refresh token
        refresh_url = reverse('authentication:token_refresh')
        refresh_data = {'refresh': refresh_token}
        response = self.client.post(refresh_url, refresh_data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
    
    def test_teacher_role_assignment(self):
        """Test that teacher user has correct role"""
        url = reverse('authentication:login')
        data = {
            'username': 'teacher_test',
            'password': 'teacher123!@#'
        }
        
        response = self.client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['role'] == 'teacher'
