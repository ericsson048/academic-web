"""
Unit tests for grade management API endpoints.
"""
from datetime import date
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from authentication.models import User
from grades.models import Grade, GradeHistory
from students.models import Class, Semester, Student, Subject


@pytest.mark.django_db
@pytest.mark.unit
class TestGradeManagementAPI:
    """Test grade CRUD, filtering, history, and bulk create behavior."""

    def setup_method(self):
        self.client = APIClient()
        self.list_url = reverse('grades:grade-list')
        self.bulk_url = reverse('grades:grade-bulk-create')

        self.teacher_user = User.objects.create_user(
            username='teacher_grades',
            password='teacher123!@#',
            role='teacher',
        )
        self.admin_user = User.objects.create_user(
            username='admin_grades',
            password='admin123!@#',
            role='admin',
        )

        self.class_a = Class.objects.create(
            name='Class G1',
            level='Grade 10',
            academic_year='2025-2026',
        )
        self.student_a = Student.objects.create(
            student_id='STD-G001',
            first_name='Awa',
            last_name='Diop',
            class_assigned=self.class_a,
            enrollment_date=date(2025, 9, 1),
        )
        self.student_b = Student.objects.create(
            student_id='STD-G002',
            first_name='Ben',
            last_name='Ndiaye',
            class_assigned=self.class_a,
            enrollment_date=date(2025, 9, 1),
        )

        self.subject_math = Subject.objects.create(
            name='Mathematics',
            code='MATH201',
            coefficient=Decimal('1.00'),
        )
        self.subject_physics = Subject.objects.create(
            name='Physics',
            code='PHYS201',
            coefficient=Decimal('1.50'),
        )

        self.semester_1 = Semester.objects.create(
            name='Semester 1',
            start_date=date(2025, 9, 1),
            end_date=date(2026, 1, 31),
            academic_year='2025-2026',
            is_current=True,
        )
        self.semester_2 = Semester.objects.create(
            name='Semester 2',
            start_date=date(2026, 2, 1),
            end_date=date(2026, 6, 30),
            academic_year='2025-2026',
            is_current=False,
        )

    def _authenticate_teacher(self):
        self.client.force_authenticate(user=self.teacher_user)

    def _authenticate_admin(self):
        self.client.force_authenticate(user=self.admin_user)

    def test_teacher_can_create_grade_with_nested_response(self):
        self._authenticate_teacher()

        payload = {
            'student_id': self.student_a.id,
            'subject_id': self.subject_math.id,
            'semester_id': self.semester_1.id,
            'value': '14.50',
        }
        response = self.client.post(self.list_url, payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['student']['id'] == self.student_a.id
        assert response.data['subject']['id'] == self.subject_math.id
        assert response.data['semester']['id'] == self.semester_1.id
        assert response.data['entered_by']['id'] == self.teacher_user.id

    def test_grade_value_range_validation(self):
        self._authenticate_teacher()

        payload = {
            'student_id': self.student_a.id,
            'subject_id': self.subject_math.id,
            'semester_id': self.semester_1.id,
            'value': '22.00',
        }
        response = self.client.post(self.list_url, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'value' in response.data

    def test_grade_uniqueness_validation(self):
        self._authenticate_teacher()
        Grade.objects.create(
            student=self.student_a,
            subject=self.subject_math,
            semester=self.semester_1,
            value=Decimal('12.00'),
            entered_by=self.teacher_user,
        )

        payload = {
            'student_id': self.student_a.id,
            'subject_id': self.subject_math.id,
            'semester_id': self.semester_1.id,
            'value': '13.00',
        }
        response = self.client.post(self.list_url, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'non_field_errors' in response.data

    def test_grade_filters_work(self):
        self._authenticate_teacher()
        Grade.objects.create(
            student=self.student_a,
            subject=self.subject_math,
            semester=self.semester_1,
            value=Decimal('11.00'),
            entered_by=self.teacher_user,
        )
        Grade.objects.create(
            student=self.student_b,
            subject=self.subject_physics,
            semester=self.semester_2,
            value=Decimal('15.00'),
            entered_by=self.teacher_user,
        )

        by_student = self.client.get(self.list_url, {'student_id': self.student_a.id})
        by_subject = self.client.get(self.list_url, {'subject_id': self.subject_physics.id})
        by_semester = self.client.get(self.list_url, {'semester_id': self.semester_2.id})

        assert by_student.status_code == status.HTTP_200_OK
        assert by_subject.status_code == status.HTTP_200_OK
        assert by_semester.status_code == status.HTTP_200_OK

        assert by_student.data['count'] == 1
        assert by_subject.data['count'] == 1
        assert by_semester.data['count'] == 1

    def test_grade_update_creates_history_and_history_endpoint(self):
        self._authenticate_teacher()
        grade = Grade.objects.create(
            student=self.student_a,
            subject=self.subject_math,
            semester=self.semester_1,
            value=Decimal('10.00'),
            entered_by=self.teacher_user,
        )

        detail_url = reverse('grades:grade-detail', args=[grade.id])
        update_payload = {'value': '16.75', 'reason': 'Retake correction'}
        update_response = self.client.patch(detail_url, update_payload, format='json')

        assert update_response.status_code == status.HTTP_200_OK
        assert GradeHistory.objects.filter(grade=grade).count() == 1

        history_url = reverse('grades:grade-history', args=[grade.id])
        history_response = self.client.get(history_url)
        assert history_response.status_code == status.HTTP_200_OK
        assert len(history_response.data) == 1
        assert history_response.data[0]['old_value'] == '10.00'
        assert history_response.data[0]['new_value'] == '16.75'
        assert history_response.data[0]['reason'] == 'Retake correction'

    def test_bulk_create_is_atomic_when_one_item_invalid(self):
        self._authenticate_admin()

        payload = [
            {
                'student_id': self.student_a.id,
                'subject_id': self.subject_math.id,
                'semester_id': self.semester_1.id,
                'value': '13.00',
            },
            {
                'student_id': self.student_b.id,
                'subject_id': self.subject_physics.id,
                'semester_id': self.semester_2.id,
                'value': '25.00',
            },
        ]
        response = self.client.post(self.bulk_url, payload, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Grade.objects.count() == 0

    def test_bulk_create_success(self):
        self._authenticate_admin()

        payload = [
            {
                'student_id': self.student_a.id,
                'subject_id': self.subject_math.id,
                'semester_id': self.semester_1.id,
                'value': '13.00',
            },
            {
                'student_id': self.student_b.id,
                'subject_id': self.subject_physics.id,
                'semester_id': self.semester_2.id,
                'value': '17.00',
            },
        ]
        response = self.client.post(self.bulk_url, payload, format='json')

        assert response.status_code == status.HTTP_201_CREATED
        assert Grade.objects.count() == 2
        assert len(response.data) == 2
