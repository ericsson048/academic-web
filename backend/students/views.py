"""
Views for student management endpoints.
"""
from rest_framework import viewsets

from authentication.permissions import IsAdminOrReadOnly

from .models import Class, Semester, Student, Subject
from .serializers import (
    ClassSerializer,
    SemesterSerializer,
    StudentSerializer,
    SubjectSerializer,
)


class StudentViewSet(viewsets.ModelViewSet):
    """
    CRUD API for students with search, filtering, and soft-delete support.
    """

    queryset = Student.objects.select_related('class_assigned').all()
    serializer_class = StudentSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['student_id', 'first_name', 'last_name']
    ordering_fields = ['student_id', 'first_name', 'last_name', 'enrollment_date']
    ordering = ['last_name', 'first_name']

    def get_queryset(self):
        """
        Apply optional filters:
        - class_id: filter by assigned class primary key
        - is_active: filter by active status
        """
        queryset = super().get_queryset()

        class_id = self.request.query_params.get('class_id')
        if class_id:
            queryset = queryset.filter(class_assigned_id=class_id)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            normalized_value = is_active.strip().lower()
            if normalized_value in ['true', '1', 'yes']:
                queryset = queryset.filter(is_active=True)
            elif normalized_value in ['false', '0', 'no']:
                queryset = queryset.filter(is_active=False)

        return queryset

    def perform_destroy(self, instance):
        """
        Soft-delete a student to preserve related grade history.
        """
        if instance.is_active:
            instance.is_active = False
            instance.save(update_fields=['is_active', 'updated_at'])


class ClassViewSet(viewsets.ModelViewSet):
    """
    CRUD API for academic classes.
    Teachers have read-only access; admins can modify data.
    """

    queryset = Class.objects.all()
    serializer_class = ClassSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'level', 'academic_year']
    ordering_fields = ['name', 'level', 'academic_year', 'created_at']
    ordering = ['academic_year', 'name']


class SubjectViewSet(viewsets.ModelViewSet):
    """
    CRUD API for subjects.
    Teachers have read-only access; admins can modify data.
    """

    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['name']


class SemesterViewSet(viewsets.ModelViewSet):
    """
    CRUD API for semesters.
    Teachers have read-only access; admins can modify data.
    """

    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ['name', 'academic_year']
    ordering_fields = ['name', 'academic_year', 'start_date', 'end_date', 'created_at']
    ordering = ['-start_date']
