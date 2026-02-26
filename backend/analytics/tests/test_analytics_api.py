"""
Tests for analytics API endpoints.
"""
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from students.models import Student, Class, Subject, Semester
from grades.models import Grade
from analytics.models import PerformanceIndicator

User = get_user_model()


@pytest.fixture
def api_client():
    """Create API client."""
    return APIClient()


@pytest.fixture
def admin_user(db):
    """Create admin user."""
    return User.objects.create_user(
        username='admin',
        email='admin@test.com',
        password='admin123',
        role='admin'
    )


@pytest.fixture
def teacher_user(db):
    """Create teacher user."""
    return User.objects.create_user(
        username='teacher',
        email='teacher@test.com',
        password='teacher123',
        role='teacher'
    )


@pytest.fixture
def test_class(db):
    """Create test class."""
    return Class.objects.create(
        name='Class A',
        level='Level 1',
        academic_year='2024-2025'
    )


@pytest.fixture
def test_semester(db):
    """Create test semester."""
    return Semester.objects.create(
        name='Semester 1',
        start_date='2024-01-01',
        end_date='2024-06-30',
        academic_year='2024-2025',
        is_current=True
    )


@pytest.fixture
def test_subjects(db):
    """Create test subjects."""
    return [
        Subject.objects.create(name='Mathematics', code='MATH101', coefficient=Decimal('2.0')),
        Subject.objects.create(name='Physics', code='PHYS101', coefficient=Decimal('1.5')),
        Subject.objects.create(name='English', code='ENG101', coefficient=Decimal('1.0'))
    ]


@pytest.fixture
def test_students(db, test_class):
    """Create test students."""
    return [
        Student.objects.create(
            student_id='STU001',
            first_name='John',
            last_name='Doe',
            class_assigned=test_class,
            enrollment_date='2024-01-01',
            is_active=True
        ),
        Student.objects.create(
            student_id='STU002',
            first_name='Jane',
            last_name='Smith',
            class_assigned=test_class,
            enrollment_date='2024-01-01',
            is_active=True
        ),
        Student.objects.create(
            student_id='STU003',
            first_name='Bob',
            last_name='Johnson',
            class_assigned=test_class,
            enrollment_date='2024-01-01',
            is_active=True
        )
    ]


@pytest.fixture
def test_grades(db, test_students, test_subjects, test_semester, admin_user):
    """Create test grades and performance indicators."""
    grades = []
    
    # Student 1: Excellent (18, 17, 19)
    for i, subject in enumerate(test_subjects):
        grade = Grade.objects.create(
            student=test_students[0],
            subject=subject,
            semester=test_semester,
            value=Decimal(str(18 + i - 1)),
            entered_by=admin_user
        )
        grades.append(grade)
        # Create subject-specific indicator
        PerformanceIndicator.objects.create(
            student=test_students[0],
            semester=test_semester,
            subject=subject,
            average=grade.value
        )
    
    # Create overall indicator for student 1
    PerformanceIndicator.objects.create(
        student=test_students[0],
        semester=test_semester,
        subject=None,
        average=Decimal('18.0'),
        class_rank=1
    )
    
    # Student 2: Good (15, 14, 15)
    for i, subject in enumerate(test_subjects):
        grade = Grade.objects.create(
            student=test_students[1],
            subject=subject,
            semester=test_semester,
            value=Decimal(str(15 - i % 2)),
            entered_by=admin_user
        )
        grades.append(grade)
        # Create subject-specific indicator
        PerformanceIndicator.objects.create(
            student=test_students[1],
            semester=test_semester,
            subject=subject,
            average=grade.value
        )
    
    # Create overall indicator for student 2
    PerformanceIndicator.objects.create(
        student=test_students[1],
        semester=test_semester,
        subject=None,
        average=Decimal('14.67'),
        class_rank=2
    )
    
    # Student 3: Average (12, 11, 13)
    for i, subject in enumerate(test_subjects):
        grade = Grade.objects.create(
            student=test_students[2],
            subject=subject,
            semester=test_semester,
            value=Decimal(str(12 + i - 1)),
            entered_by=admin_user
        )
        grades.append(grade)
        # Create subject-specific indicator
        PerformanceIndicator.objects.create(
            student=test_students[2],
            semester=test_semester,
            subject=subject,
            average=grade.value
        )
    
    # Create overall indicator for student 3
    PerformanceIndicator.objects.create(
        student=test_students[2],
        semester=test_semester,
        subject=None,
        average=Decimal('12.0'),
        class_rank=3
    )
    
    return grades


@pytest.mark.django_db
class TestAnalyticsSummaryView:
    """Tests for analytics summary endpoint."""
    
    def test_summary_requires_authentication(self, api_client):
        """Test that summary endpoint requires authentication."""
        response = api_client.get('/api/analytics/summary/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_summary_returns_correct_data(
        self, api_client, teacher_user, test_grades, test_students, test_class, test_semester
    ):
        """Test that summary returns correct aggregated data."""
        api_client.force_authenticate(user=teacher_user)
        response = api_client.get('/api/analytics/summary/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Check structure
        assert 'total_students' in data
        assert 'overall_average' in data
        assert 'progression_rate' in data
        assert 'performance_distribution' in data
        
        # Check values
        assert data['total_students'] == 3
        assert data['overall_average'] > 0
        
        # Check performance distribution
        dist = data['performance_distribution']
        assert 'excellent' in dist
        assert 'good' in dist
        assert 'average' in dist
        assert 'poor' in dist
        assert dist['excellent'] == 1  # Student 1 (18.0)
        assert dist['good'] == 1  # Student 2 (14.67)
        assert dist['average'] == 1  # Student 3 (12.0)
        assert dist['poor'] == 0
    
    def test_summary_filters_by_class(
        self, api_client, teacher_user, test_grades, test_class
    ):
        """Test that summary can be filtered by class."""
        api_client.force_authenticate(user=teacher_user)
        response = api_client.get(f'/api/analytics/summary/?class_id={test_class.id}')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['total_students'] == 3
    
    def test_summary_filters_by_semester(
        self, api_client, teacher_user, test_grades, test_semester
    ):
        """Test that summary can be filtered by semester."""
        api_client.force_authenticate(user=teacher_user)
        response = api_client.get(f'/api/analytics/summary/?semester_id={test_semester.id}')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['overall_average'] > 0


@pytest.mark.django_db
class TestPerformanceBySubjectView:
    """Tests for performance by subject endpoint."""
    
    def test_performance_by_subject_requires_authentication(self, api_client):
        """Test that endpoint requires authentication."""
        response = api_client.get('/api/analytics/performance-by-subject/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_performance_by_subject_returns_correct_data(
        self, api_client, teacher_user, test_grades, test_subjects
    ):
        """Test that endpoint returns correct subject averages."""
        api_client.force_authenticate(user=teacher_user)
        response = api_client.get('/api/analytics/performance-by-subject/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Should return 3 subjects
        assert len(data) == 3
        
        # Check structure
        for item in data:
            assert 'subject_id' in item
            assert 'subject_code' in item
            assert 'subject_name' in item
            assert 'average' in item
            assert 'student_count' in item
            assert item['student_count'] == 3  # All 3 students have grades


@pytest.mark.django_db
class TestPerformanceEvolutionView:
    """Tests for performance evolution endpoint."""
    
    def test_performance_evolution_requires_authentication(self, api_client):
        """Test that endpoint requires authentication."""
        response = api_client.get('/api/analytics/performance-evolution/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_performance_evolution_returns_correct_data(
        self, api_client, teacher_user, test_grades, test_semester
    ):
        """Test that endpoint returns time series data."""
        api_client.force_authenticate(user=teacher_user)
        response = api_client.get('/api/analytics/performance-evolution/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Should return at least 1 semester
        assert len(data) >= 1
        
        # Check structure
        for item in data:
            assert 'semester_id' in item
            assert 'semester_name' in item
            assert 'average' in item
            assert 'start_date' in item
    
    def test_performance_evolution_filters_by_student(
        self, api_client, teacher_user, test_grades, test_students
    ):
        """Test that endpoint can filter by student."""
        api_client.force_authenticate(user=teacher_user)
        response = api_client.get(
            f'/api/analytics/performance-evolution/?student_id={test_students[0].id}'
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1


@pytest.mark.django_db
class TestStudentPerformanceDetailView:
    """Tests for student performance detail endpoint."""
    
    def test_student_detail_requires_authentication(self, api_client, test_students):
        """Test that endpoint requires authentication."""
        response = api_client.get(f'/api/analytics/student/{test_students[0].id}/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_student_detail_returns_404_for_nonexistent_student(
        self, api_client, teacher_user
    ):
        """Test that endpoint returns 404 for non-existent student."""
        api_client.force_authenticate(user=teacher_user)
        response = api_client.get('/api/analytics/student/99999/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_student_detail_returns_comprehensive_data(
        self, api_client, teacher_user, test_grades, test_students
    ):
        """Test that endpoint returns complete student data."""
        api_client.force_authenticate(user=teacher_user)
        response = api_client.get(f'/api/analytics/student/{test_students[0].id}/')
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Check structure
        assert 'student' in data
        assert 'grades' in data
        assert 'indicators' in data
        assert 'charts_data' in data
        
        # Check student info
        student = data['student']
        assert student['student_id'] == 'STU001'
        assert student['first_name'] == 'John'
        assert student['last_name'] == 'Doe'
        
        # Check grades
        assert len(data['grades']) == 3  # 3 subjects
        
        # Check indicators
        assert len(data['indicators']) == 4  # 3 subjects + 1 overall
        
        # Check charts data
        charts = data['charts_data']
        assert 'performance_by_subject' in charts
        assert 'performance_evolution' in charts
        assert len(charts['performance_by_subject']) == 3
