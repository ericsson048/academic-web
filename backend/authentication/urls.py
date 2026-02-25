"""
URL patterns for authentication endpoints.
"""
from django.urls import path
from .views import LoginView, LogoutView, TokenRefreshView, CurrentUserView

app_name = 'authentication'

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
]
