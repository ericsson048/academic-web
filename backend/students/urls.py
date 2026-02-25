"""
URL patterns for student management endpoints.
"""
from django.urls import path

from .views import ClassViewSet, SemesterViewSet, StudentViewSet, SubjectViewSet

app_name = 'students'

student_list = StudentViewSet.as_view({'get': 'list', 'post': 'create'})
student_detail = StudentViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

class_list = ClassViewSet.as_view({'get': 'list', 'post': 'create'})
class_detail = ClassViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

subject_list = SubjectViewSet.as_view({'get': 'list', 'post': 'create'})
subject_detail = SubjectViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

semester_list = SemesterViewSet.as_view({'get': 'list', 'post': 'create'})
semester_detail = SemesterViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = [
    path('', student_list, name='student-list'),
    path('<int:pk>/', student_detail, name='student-detail'),
    path('classes/', class_list, name='class-list'),
    path('classes/<int:pk>/', class_detail, name='class-detail'),
    path('subjects/', subject_list, name='subject-list'),
    path('subjects/<int:pk>/', subject_detail, name='subject-detail'),
    path('semesters/', semester_list, name='semester-list'),
    path('semesters/<int:pk>/', semester_detail, name='semester-detail'),
]
