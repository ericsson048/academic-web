"""
Unit tests for class, subject, and semester API endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from authentication.models import User
from students.models import Class, Semester, Subject


@pytest.mark.django_db
@pytest.mark.unit
class TestSupportingEntitiesAPI:
    """Verify teacher read-only and admin write access for supporting entities."""

    def setup_method(self):
        self.client = APIClient()

        self.admin_user = User.objects.create_user(
            username='admin_support',
            password='admin123!@#',
            role='admin',
        )
        self.teacher_user = User.objects.create_user(
            username='teacher_support',
            password='teacher123!@#',
            role='teacher',
        )

        self.class_instance = Class.objects.create(
            name='Class C',
            level='Grade 11',
            academic_year='2025-2026',
        )
        self.subject_instance = Subject.objects.create(
            name='Physics',
            code='PHYS101',
            coefficient='1.50',
        )
        self.semester_instance = Semester.objects.create(
            name='Semester 2',
            start_date='2026-02-01',
            end_date='2026-06-30',
            academic_year='2025-2026',
            is_current=False,
        )

    def _authenticate_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)

    def _authenticate_as_teacher(self):
        self.client.force_authenticate(user=self.teacher_user)

    def test_teacher_can_read_supporting_entities(self):
        self._authenticate_as_teacher()

        class_response = self.client.get(reverse('students:class-list'))
        subject_response = self.client.get(reverse('students:subject-list'))
        semester_response = self.client.get(reverse('students:semester-list'))

        assert class_response.status_code == status.HTTP_200_OK
        assert subject_response.status_code == status.HTTP_200_OK
        assert semester_response.status_code == status.HTTP_200_OK

        assert class_response.data['count'] == 1
        assert subject_response.data['count'] == 1
        assert semester_response.data['count'] == 1

    def test_teacher_cannot_create_class(self):
        self._authenticate_as_teacher()

        payload = {
            'name': 'Class D',
            'level': 'Grade 11',
            'academic_year': '2025-2026',
        }
        response = self.client.post(reverse('students:class-list'), payload, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_teacher_cannot_create_subject(self):
        self._authenticate_as_teacher()

        payload = {
            'name': 'Chemistry',
            'code': 'CHEM101',
            'coefficient': '1.20',
            'description': 'Intro chemistry',
        }
        response = self.client.post(reverse('students:subject-list'), payload, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_teacher_cannot_create_semester(self):
        self._authenticate_as_teacher()

        payload = {
            'name': 'Semester 3',
            'start_date': '2026-09-01',
            'end_date': '2027-01-31',
            'academic_year': '2026-2027',
            'is_current': False,
        }
        response = self.client.post(reverse('students:semester-list'), payload, format='json')

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_admin_can_create_supporting_entities(self):
        self._authenticate_as_admin()

        class_payload = {
            'name': 'Class E',
            'level': 'Grade 12',
            'academic_year': '2025-2026',
        }
        subject_payload = {
            'name': 'History',
            'code': 'HIST101',
            'coefficient': '1.00',
            'description': 'World history',
        }
        semester_payload = {
            'name': 'Summer Term',
            'start_date': '2026-07-01',
            'end_date': '2026-08-15',
            'academic_year': '2025-2026',
            'is_current': False,
        }

        class_response = self.client.post(
            reverse('students:class-list'),
            class_payload,
            format='json',
        )
        subject_response = self.client.post(
            reverse('students:subject-list'),
            subject_payload,
            format='json',
        )
        semester_response = self.client.post(
            reverse('students:semester-list'),
            semester_payload,
            format='json',
        )

        assert class_response.status_code == status.HTTP_201_CREATED
        assert subject_response.status_code == status.HTTP_201_CREATED
        assert semester_response.status_code == status.HTTP_201_CREATED

        assert Class.objects.filter(name='Class E').exists()
        assert Subject.objects.filter(code='HIST101').exists()
        assert Semester.objects.filter(name='Summer Term').exists()

    def test_semester_validation_rejects_invalid_dates(self):
        self._authenticate_as_admin()

        payload = {
            'name': 'Invalid Semester',
            'start_date': '2026-09-01',
            'end_date': '2026-09-01',
            'academic_year': '2026-2027',
            'is_current': False,
        }
        response = self.client.post(reverse('students:semester-list'), payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'end_date' in response.data
