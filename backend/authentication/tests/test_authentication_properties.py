"""
Property-based tests for authentication using Hypothesis.

These tests validate universal correctness properties that should hold
for all valid inputs, ensuring robust authentication behavior.
"""
import pytest
import uuid
from hypothesis import given, strategies as st, settings, assume
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from authentication.models import User


# Custom strategies for generating test data
@st.composite
def valid_username(draw):
    """Generate valid usernames (3-150 chars, alphanumeric + underscore) with UUID suffix for uniqueness"""
    length = draw(st.integers(min_value=3, max_value=20))
    # Start with letter, then alphanumeric + underscore
    first_char = draw(st.characters(whitelist_categories=('Lu', 'Ll')))
    rest = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')) | st.just('_'),
        min_size=length - 1,
        max_size=length - 1
    ))
    # Add UUID suffix to ensure uniqueness across test runs
    unique_suffix = str(uuid.uuid4())[:8]
    return f"{first_char}{rest}_{unique_suffix}"


@st.composite
def valid_password(draw):
    """Generate valid passwords (8+ chars with variety)"""
    length = draw(st.integers(min_value=8, max_value=30))
    # Ensure password has letters and numbers
    password = draw(st.text(
        alphabet=st.characters(
            whitelist_categories=('Lu', 'Ll', 'Nd'),
            min_codepoint=33,
            max_codepoint=126
        ),
        min_size=length,
        max_size=length
    ))
    # Ensure at least one letter and one number
    assume(any(c.isalpha() for c in password))
    assume(any(c.isdigit() for c in password))
    return password


@st.composite
def valid_email(draw):
    """Generate valid email addresses with UUID for uniqueness"""
    local_part = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd')),
        min_size=1,
        max_size=15
    ))
    domain = draw(st.text(
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll')),
        min_size=2,
        max_size=10
    ))
    tld = draw(st.sampled_from(['com', 'org', 'net', 'edu', 'io']))
    # Add UUID suffix to ensure uniqueness
    unique_suffix = str(uuid.uuid4())[:8]
    return f"{local_part}{unique_suffix}@{domain}.{tld}"


@st.composite
def user_role(draw):
    """Generate valid user roles"""
    return draw(st.sampled_from(['admin', 'teacher']))


@pytest.mark.django_db
class TestAuthenticationRoundTripProperty:
    """
    Property 1: Authentication Round Trip
    
    For any valid username and password combination, logging in should return
    a valid JWT token, and using that token should successfully authenticate
    subsequent requests. For any invalid credentials, login should fail with
    an appropriate error message.
    
    Validates: Requirements 1.1, 1.2, 1.3
    """
    
    @given(
        username=valid_username(),
        password=valid_password(),
        email=valid_email(),
        role=user_role()
    )
    @settings(max_examples=100, deadline=None)
    def test_valid_credentials_round_trip(self, username, password, email, role):
        """
        Property: For any valid user credentials, the authentication round trip
        should succeed:
        1. Create user with credentials
        2. Login with same credentials returns valid tokens
        3. Using access token authenticates subsequent requests
        4. User data returned matches created user
        """
        client = APIClient()
        
        # Step 1: Create user with generated credentials
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            role=role
        )
        
        # Step 2: Login with valid credentials
        login_url = reverse('authentication:login')
        login_data = {
            'username': username,
            'password': password
        }
        
        login_response = client.post(login_url, login_data, format='json')
        
        # Assert login succeeds
        assert login_response.status_code == status.HTTP_200_OK, \
            f"Login failed for valid credentials: {login_response.data}"
        
        # Assert tokens are present
        assert 'access' in login_response.data, "Access token missing from response"
        assert 'refresh' in login_response.data, "Refresh token missing from response"
        assert 'user' in login_response.data, "User data missing from response"
        
        # Assert tokens are non-empty strings
        assert isinstance(login_response.data['access'], str), "Access token is not a string"
        assert isinstance(login_response.data['refresh'], str), "Refresh token is not a string"
        assert len(login_response.data['access']) > 0, "Access token is empty"
        assert len(login_response.data['refresh']) > 0, "Refresh token is empty"
        
        # Assert user data matches
        assert login_response.data['user']['username'] == username, \
            "Returned username doesn't match"
        assert login_response.data['user']['role'] == role, \
            "Returned role doesn't match"
        assert login_response.data['user']['email'] == email, \
            "Returned email doesn't match"
        
        # Step 3: Use access token to authenticate subsequent request
        access_token = login_response.data['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        current_user_url = reverse('authentication:current_user')
        auth_response = client.get(current_user_url)
        
        # Assert authenticated request succeeds
        assert auth_response.status_code == status.HTTP_200_OK, \
            f"Authenticated request failed: {auth_response.data}"
        
        # Assert returned user data is consistent
        assert auth_response.data['username'] == username, \
            "Current user username doesn't match"
        assert auth_response.data['role'] == role, \
            "Current user role doesn't match"
        assert auth_response.data['id'] == user.id, \
            "Current user ID doesn't match"
    
    @given(
        username=valid_username(),
        correct_password=valid_password(),
        wrong_password=valid_password(),
        email=valid_email(),
        role=user_role()
    )
    @settings(max_examples=100, deadline=None)
    def test_invalid_credentials_fail(self, username, correct_password, 
                                     wrong_password, email, role):
        """
        Property: For any invalid credentials (wrong password), login should fail
        with appropriate error message and no tokens should be returned.
        """
        # Ensure passwords are different
        assume(correct_password != wrong_password)
        
        client = APIClient()
        
        # Create user with correct password
        User.objects.create_user(
            username=username,
            password=correct_password,
            email=email,
            role=role
        )
        
        # Attempt login with wrong password
        login_url = reverse('authentication:login')
        login_data = {
            'username': username,
            'password': wrong_password
        }
        
        login_response = client.post(login_url, login_data, format='json')
        
        # Assert login fails
        assert login_response.status_code == status.HTTP_400_BAD_REQUEST, \
            "Login should fail with invalid credentials"
        
        # Assert no tokens are returned
        assert 'access' not in login_response.data, \
            "Access token should not be returned for invalid credentials"
        assert 'refresh' not in login_response.data, \
            "Refresh token should not be returned for invalid credentials"
        
        # Assert error message is present
        assert 'non_field_errors' in login_response.data or 'detail' in login_response.data, \
            "Error message should be present for invalid credentials"
    
    @given(
        username=valid_username(),
        password=valid_password(),
        email=valid_email(),
        role=user_role()
    )
    @settings(max_examples=100, deadline=None)
    def test_token_refresh_round_trip(self, username, password, email, role):
        """
        Property: For any valid user, the refresh token should be able to
        generate a new access token, and the new token should work for
        authenticated requests.
        """
        client = APIClient()
        
        # Create user and login
        User.objects.create_user(
            username=username,
            password=password,
            email=email,
            role=role
        )
        
        login_url = reverse('authentication:login')
        login_data = {'username': username, 'password': password}
        login_response = client.post(login_url, login_data, format='json')
        
        assert login_response.status_code == status.HTTP_200_OK
        refresh_token = login_response.data['refresh']
        
        # Refresh the access token
        refresh_url = reverse('authentication:token_refresh')
        refresh_data = {'refresh': refresh_token}
        refresh_response = client.post(refresh_url, refresh_data, format='json')
        
        # Assert refresh succeeds
        assert refresh_response.status_code == status.HTTP_200_OK, \
            f"Token refresh failed: {refresh_response.data}"
        assert 'access' in refresh_response.data, \
            "New access token missing from refresh response"
        
        # Use new access token for authenticated request
        new_access_token = refresh_response.data['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
        
        current_user_url = reverse('authentication:current_user')
        auth_response = client.get(current_user_url)
        
        # Assert new token works
        assert auth_response.status_code == status.HTTP_200_OK, \
            "New access token should authenticate requests"
        assert auth_response.data['username'] == username, \
            "User data should match with refreshed token"
    
    @given(
        username=valid_username(),
        password=valid_password(),
        email=valid_email(),
        role=user_role()
    )
    @settings(max_examples=100, deadline=None)
    def test_logout_invalidates_token(self, username, password, email, role):
        """
        Property: For any valid user, after logout, the refresh token should
        be invalidated and cannot be used to refresh access tokens.
        """
        client = APIClient()
        
        # Create user and login
        User.objects.create_user(
            username=username,
            password=password,
            email=email,
            role=role
        )
        
        login_url = reverse('authentication:login')
        login_data = {'username': username, 'password': password}
        login_response = client.post(login_url, login_data, format='json')
        
        assert login_response.status_code == status.HTTP_200_OK
        access_token = login_response.data['access']
        refresh_token = login_response.data['refresh']
        
        # Logout
        logout_url = reverse('authentication:logout')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        logout_data = {'refresh': refresh_token}
        logout_response = client.post(logout_url, logout_data, format='json')
        
        # Assert logout succeeds
        assert logout_response.status_code == status.HTTP_205_RESET_CONTENT, \
            f"Logout failed: {logout_response.data}"
        
        # Try to use the refresh token after logout
        refresh_url = reverse('authentication:token_refresh')
        refresh_data = {'refresh': refresh_token}
        refresh_response = client.post(refresh_url, refresh_data, format='json')
        
        # Assert refresh fails with blacklisted token
        assert refresh_response.status_code == status.HTTP_401_UNAUTHORIZED, \
            "Blacklisted refresh token should not work after logout"
    
    @given(
        username=valid_username(),
        password=valid_password()
    )
    @settings(max_examples=50, deadline=None)
    def test_missing_credentials_fail(self, username, password):
        """
        Property: For any credentials, if username or password is missing,
        login should fail with validation error.
        """
        client = APIClient()
        login_url = reverse('authentication:login')
        
        # Test missing password
        response1 = client.post(login_url, {'username': username}, format='json')
        assert response1.status_code == status.HTTP_400_BAD_REQUEST, \
            "Login should fail when password is missing"
        
        # Test missing username
        response2 = client.post(login_url, {'password': password}, format='json')
        assert response2.status_code == status.HTTP_400_BAD_REQUEST, \
            "Login should fail when username is missing"
        
        # Test empty request
        response3 = client.post(login_url, {}, format='json')
        assert response3.status_code == status.HTTP_400_BAD_REQUEST, \
            "Login should fail when both credentials are missing"
    
    @given(
        username=valid_username(),
        password=valid_password(),
        email=valid_email(),
        role=user_role()
    )
    @settings(max_examples=100, deadline=None)
    def test_unauthenticated_request_fails(self, username, password, email, role):
        """
        Property: For any user, accessing protected endpoints without
        authentication token should fail with 401 Unauthorized.
        """
        client = APIClient()
        
        # Create user (but don't login)
        User.objects.create_user(
            username=username,
            password=password,
            email=email,
            role=role
        )
        
        # Try to access protected endpoint without token
        current_user_url = reverse('authentication:current_user')
        response = client.get(current_user_url)
        
        # Assert request fails
        assert response.status_code == status.HTTP_401_UNAUTHORIZED, \
            "Protected endpoint should reject unauthenticated requests"
    
    @given(
        username=valid_username(),
        password=valid_password(),
        email=valid_email(),
        role=user_role()
    )
    @settings(max_examples=50, deadline=None)
    def test_invalid_token_fails(self, username, password, email, role):
        """
        Property: For any user, using an invalid or malformed token should
        fail with 401 Unauthorized.
        """
        client = APIClient()
        
        # Create user
        User.objects.create_user(
            username=username,
            password=password,
            email=email,
            role=role
        )
        
        # Try to access protected endpoint with invalid token
        current_user_url = reverse('authentication:current_user')
        client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token_12345')
        response = client.get(current_user_url)
        
        # Assert request fails
        assert response.status_code == status.HTTP_401_UNAUTHORIZED, \
            "Protected endpoint should reject invalid tokens"

