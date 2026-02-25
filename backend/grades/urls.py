"""
URL patterns for grade management endpoints.
"""
from django.urls import path

from .views import GradeViewSet

app_name = 'grades'

grade_list = GradeViewSet.as_view({'get': 'list', 'post': 'create'})
grade_detail = GradeViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})
grade_bulk_create = GradeViewSet.as_view({'post': 'bulk_create'})
grade_history = GradeViewSet.as_view({'get': 'history'})

urlpatterns = [
    path('', grade_list, name='grade-list'),
    path('bulk-create/', grade_bulk_create, name='grade-bulk-create'),
    path('<int:pk>/history/', grade_history, name='grade-history'),
    path('<int:pk>/', grade_detail, name='grade-detail'),
]
