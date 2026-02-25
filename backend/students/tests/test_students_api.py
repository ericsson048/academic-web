"""
Unit tests for student management API endpoints.
"""
from datetime import date
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from authentication.models import User
from grades.models import Grade
from students.models import Class, Semester, Student, Subject


@pytest.mark.django_db
@pytest.mark.unit
class TestStudentManagementAPI:
    """Test student CRUD, permissions, filtering, search, and soft delete behavior."""

    def setup_method(self):
        self.client = APIClient()
        self.list_url = reverse('students:student-list')

        self.admin_user = User.objects.create_user(
            username='admin_students',
            password='admin123!@#',
            role='admin',
        )
        self.teacher_user = User.objects.create_user(
            username='teacher_students',
            password='teacher123!@#',
            role='teacher',
        )

        self.class_a = Class.objects.create(
            name='Class A',
            level='Grade 10',
            academic_year='2025-2026',
        )
        self.class_b = Class.objects.create(
            name='Class B',
            level='Grade 10',
            academic_year='2025-2026',
        )

        self.student_active = Student.objects.create(
            student_id='STD-001',
            first_name='Alice',
            last_name='Martin',
            class_assigned=self.class_a,
            enrollment_date=date(2025, 9, 1),
            is_active=True,
        )
        self.student_inactive = Student.objects.create(
            student_id='STD-002',
            first_name='Bob',
            last_name='Durand',
            class_assigned=self.class_b,
            enrollment_date=date(2025, 9, 1),
            is_active=False,
        )

    def _authenticate_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)

    def _authenticate_as_teacher(self):
        self.client.force_authenticate(user=self.teacher_user)

    def test_teacher_can_list_students(self):
        self._authenticate_as_teacher()

        response = self.client.get(self.list_url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['count'] == 2
        assert len(response.data['results']) == 2

    def test_admin_can_create_student(self):
        self._authenticate_as_admin()

        payload = {
            'student_id': 'STD-003',
            'first_name': 'Claire',
            'last_name': 'Nadia',
            'class_id': self.class_a.id,
            'enrollment_date': '2025-10-01',
            'is_active': True,
        }
        response = self.client.post(self.list_url, payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Student.objects.filter(student_id='STD-003').exists()
        assert response.data['class_id'] == self.class_a.id

    def test_teacher_cannot_create_student(self):
        self._authenticate_as_teacher()

        payload = {
            'student_id': 'STD-003',
            'first_name': 'Claire',
            'last_name': 'Nadia',
            'class_id': self.class_a.id,
            'enrollment_date': '2025-10-01',
            'is_active': True,
        }
        response = self.client.post(self.list_url, payload, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_student_id_must_be_unique(self):
        self._authenticate_as_admin()

        payload = {
            'student_id': 'STD-001',
            'first_name': 'Another',
            'last_name': 'Student',
            'class_id': self.class_a.id,
            'enrollment_date': '2025-10-01',
            'is_active': True,
        }
        response = self.client.post(self.list_url, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'student_id' in response.data

    def test_students_support_search_and_filters(self):
        self._authenticate_as_teacher()

        search_response = self.client.get(self.list_url, {'search': 'Alice'})
        assert search_response.status_code == status.HTTP_200_OK
        assert search_response.data['count'] == 1
        assert search_response.data['results'][0]['student_id'] == 'STD-001'

        class_filter_response = self.client.get(
            self.list_url,
            {'class_id': self.class_b.id},
        )
        assert class_filter_response.status_code == status.HTTP_200_OK
        assert class_filter_response.data['count'] == 1
        assert class_filter_response.data['results'][0]['student_id'] == 'STD-002'

        active_filter_response = self.client.get(
            self.list_url,
            {'is_active': 'false'},
        )
        assert active_filter_response.status_code == status.HTTP_200_OK
        assert active_filter_response.data['count'] == 1
        assert active_filter_response.data['results'][0]['student_id'] == 'STD-002'

    def test_delete_is_soft_delete_and_preserves_grades(self):
        self._authenticate_as_admin()

        subject = Subject.objects.create(
            name='Mathematics',
            code='MATH101',
            coefficient=Decimal('1.00'),
        )
        semester = Semester.objects.create(
            name='Semester 1',
            start_date=date(2025, 9, 1),
            end_date=date(2026, 1, 31),
            academic_year='2025-2026',
            is_current=True,
        )
        grade = Grade.objects.create(
            student=self.student_active,
            subject=subject,
            semester=semester,
            value=Decimal('14.50'),
            entered_by=self.admin_user,
        )

        detail_url = reverse('students:student-detail', args=[self.student_active.id])
        response = self.client.delete(detail_url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        self.student_active.refresh_from_db()
        assert self.student_active.is_active is False
        assert Student.objects.filter(id=self.student_active.id).exists()
        assert Grade.objects.filter(id=grade.id).exists()
