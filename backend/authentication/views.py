"""
Authentication views for login, logout, token refresh, and user profile.
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .serializers import LoginSerializer, UserSerializer


class LoginView(APIView):
    """
    POST /api/auth/login/
    
    Authenticates user with username and password.
    Returns JWT access and refresh tokens on success.
    
    Request body:
        {
            "username": "string",
            "password": "string"
        }
    
    Response (200 OK):
        {
            "access": "jwt_access_token",
            "refresh": "jwt_refresh_token",
            "user": {
                "id": 1,
                "username": "string",
                "email": "string",
                "role": "admin|teacher"
            }
        }
    
    Response (400 Bad Request):
        {
            "non_field_errors": ["Invalid credentials..."]
        }
    """
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request):
        """
        Validate credentials and return JWT tokens.
        """
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = serializer.validated_data['user']
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        # Serialize user data
        user_serializer = UserSerializer(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': user_serializer.data
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    
    Invalidates the refresh token to log out the user.
    
    Request body:
        {
            "refresh": "jwt_refresh_token"
        }
    
    Response (205 Reset Content):
        {
            "message": "Successfully logged out."
        }
    
    Response (400 Bad Request):
        {
            "error": "Invalid or expired token."
        }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Blacklist the refresh token to invalidate it.
        """
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Blacklist the token
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {'message': 'Successfully logged out.'},
                status=status.HTTP_205_RESET_CONTENT
            )
        
        except TokenError:
            return Response(
                {'error': 'Invalid or expired token.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Logout failed. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class TokenRefreshView(TokenRefreshView):
    """
    POST /api/auth/refresh/
    
    Refreshes the access token using a valid refresh token.
    
    Request body:
        {
            "refresh": "jwt_refresh_token"
        }
    
    Response (200 OK):
        {
            "access": "new_jwt_access_token"
        }
    
    Response (401 Unauthorized):
        {
            "detail": "Token is invalid or expired",
            "code": "token_not_valid"
        }
    """
    pass


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    
    Returns the currently authenticated user's profile information.
    
    Response (200 OK):
        {
            "id": 1,
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string",
            "role": "admin|teacher",
            "created_at": "2024-01-01T00:00:00Z"
        }
    
    Response (401 Unauthorized):
        {
            "detail": "Authentication credentials were not provided."
        }
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Return current user's profile data.
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
