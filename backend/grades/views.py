"""
Views for grade management endpoints.
"""
from django.db import IntegrityError, transaction
from rest_framework import status, viewsets
from rest_framework.response import Response

from authentication.permissions import IsTeacherOrAdmin

from .audit_context import audit_user
from .models import Grade
from .serializers import BulkGradeItemSerializer, GradeHistorySerializer, GradeSerializer


class GradeViewSet(viewsets.ModelViewSet):
    """
    CRUD API for grades with filtering, history retrieval, and bulk entry.
    """

    queryset = Grade.objects.select_related(
        'student',
        'student__class_assigned',
        'subject',
        'semester',
        'entered_by',
    ).all()
    serializer_class = GradeSerializer
    permission_classes = [IsTeacherOrAdmin]
    ordering_fields = ['entered_at', 'updated_at', 'value']
    ordering = ['-updated_at']

    def get_queryset(self):
        """
        Apply optional filters by student_id, subject_id, and semester_id.
        """
        queryset = super().get_queryset()

        student_id = self.request.query_params.get('student_id')
        if student_id:
            if student_id.isdigit():
                queryset = queryset.filter(student_id=int(student_id))
            else:
                queryset = queryset.filter(student__student_id__iexact=student_id)

        subject_id = self.request.query_params.get('subject_id')
        if subject_id and subject_id.isdigit():
            queryset = queryset.filter(subject_id=int(subject_id))

        semester_id = self.request.query_params.get('semester_id')
        if semester_id and semester_id.isdigit():
            queryset = queryset.filter(semester_id=int(semester_id))

        return queryset

    def perform_create(self, serializer):
        """
        Set entered_by from the authenticated user.
        """
        with audit_user(self.request.user):
            serializer.save(entered_by=self.request.user)

    def perform_update(self, serializer):
        """
        Update grade while exposing the acting user to audit signal.
        """
        with audit_user(self.request.user):
            serializer.save()

    def history(self, request, pk=None):
        """
        GET /api/grades/{id}/history/
        Return the history entries for one grade.
        """
        grade = self.get_object()
        queryset = grade.history.select_related('modified_by').all()
        serializer = GradeHistorySerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def bulk_create(self, request):
        """
        POST /api/grades/bulk-create/
        Validate a list of grade objects and create them atomically.
        """
        serializer = BulkGradeItemSerializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        validated_items = serializer.validated_data

        seen = {}
        duplicate_errors = {}
        for index, item in enumerate(validated_items):
            key = (item['student'].id, item['subject'].id, item['semester'].id)
            if key in seen:
                duplicate_errors[index] = {
                    'non_field_errors': [
                        (
                            'Duplicate grade in bulk payload for '
                            f'student={item["student"].id}, '
                            f'subject={item["subject"].id}, '
                            f'semester={item["semester"].id}.'
                        )
                    ]
                }
            else:
                seen[key] = index

        if duplicate_errors:
            return Response({'errors': duplicate_errors}, status=status.HTTP_400_BAD_REQUEST)

        created_grades = []
        try:
            with transaction.atomic(), audit_user(request.user):
                for item in validated_items:
                    created_grades.append(
                        Grade.objects.create(
                            student=item['student'],
                            subject=item['subject'],
                            semester=item['semester'],
                            value=item['value'],
                            entered_by=request.user,
                        )
                    )
        except IntegrityError:
            return Response(
                {
                    'error': (
                        'Bulk grade creation failed due to integrity constraints. '
                        'No grade was created.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = self.get_serializer(created_grades, many=True)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
