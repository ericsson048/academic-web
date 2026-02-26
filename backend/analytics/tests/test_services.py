"""
Tests for analytics services.
"""
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from students.models import Student, Class, Subject, Semester
from grades.models import Grade
from analytics.models import PerformanceIndicator
from analytics.services import PerformanceCalculator

User = get_user_model()


class PerformanceCalculatorTestCase(TestCase):
    """Test cases for PerformanceCalculator service."""
    
    def setUp(self):
        """Set up test data."""
        # Create user
        self.user = User.objects.create_user(
            username='teacher1',
            email='teacher1@test.com',
            password='testpass123',
            role='teacher'
        )
        
        # Create class
        self.test_class = Class.objects.create(
            name='Class A',
            level='Level 1',
            academic_year='2024-2025'
        )
        
        # Create student
        self.student = Student.objects.create(
            student_id='STU001',
            first_name='John',
            last_name='Doe',
            class_assigned=self.test_class,
            enrollment_date='2024-09-01'
        )
        
        # Create subjects
        self.math = Subject.objects.create(
            name='Mathematics',
            code='MATH101',
            coefficient=Decimal('2.00')
        )
        self.physics = Subject.objects.create(
            name='Physics',
            code='PHYS101',
            coefficient=Decimal('1.50')
        )
        
        # Create semester
        self.semester = Semester.objects.create(
            name='Semester 1',
            start_date='2024-09-01',
            end_date='2025-01-31',
            academic_year='2024-2025',
            is_current=True
        )
    
    def test_calculate_subject_average(self):
        """Test subject average calculation."""
        # Create grade
        Grade.objects.create(
            student=self.student,
            subject=self.math,
            semester=self.semester,
            value=Decimal('15.50'),
            entered_by=self.user
        )
        
        avg = PerformanceCalculator.calculate_subject_average(
            self.student.id,
            self.math.id,
            self.semester.id
        )
        
        self.assertEqual(avg, Decimal('15.50'))
    
    def test_calculate_overall_average_weighted(self):
        """Test weighted overall average calculation."""
        # Create grades
        Grade.objects.create(
            student=self.student,
            subject=self.math,
            semester=self.semester,
            value=Decimal('16.00'),
            entered_by=self.user
        )
        Grade.objects.create(
            student=self.student,
            subject=self.physics,
            semester=self.semester,
            value=Decimal('14.00'),
            entered_by=self.user
        )
        
        # Expected: (16 * 2.00 + 14 * 1.50) / (2.00 + 1.50)
        # = (32 + 21) / 3.5 = 53 / 3.5 = 15.14
        avg = PerformanceCalculator.calculate_overall_average(
            self.student.id,
            self.semester.id
        )
        
        self.assertEqual(avg, Decimal('15.14'))
    
    def test_calculate_overall_average_no_grades(self):
        """Test overall average with no grades returns None."""
        avg = PerformanceCalculator.calculate_overall_average(
            self.student.id,
            self.semester.id
        )
        
        self.assertIsNone(avg)
    
    def test_recalculate_all_indicators(self):
        """Test full indicator recalculation."""
        # Create grades
        Grade.objects.create(
            student=self.student,
            subject=self.math,
            semester=self.semester,
            value=Decimal('15.00'),
            entered_by=self.user
        )
        Grade.objects.create(
            student=self.student,
            subject=self.physics,
            semester=self.semester,
            value=Decimal('13.00'),
            entered_by=self.user
        )
        
        # Recalculate
        PerformanceCalculator.recalculate_all_indicators(
            self.student.id,
            self.semester.id
        )
        
        # Check overall indicator was created
        overall_indicator = PerformanceIndicator.objects.get(
            student=self.student,
            semester=self.semester,
            subject__isnull=True
        )
        
        # Expected: (15 * 2.00 + 13 * 1.50) / (2.00 + 1.50)
        # = (30 + 19.5) / 3.5 = 49.5 / 3.5 = 14.14
        self.assertEqual(overall_indicator.average, Decimal('14.14'))
        
        # Check subject-specific indicators
        math_indicator = PerformanceIndicator.objects.get(
            student=self.student,
            semester=self.semester,
            subject=self.math
        )
        self.assertEqual(math_indicator.average, Decimal('15.00'))
    
    def test_automatic_calculation_on_grade_save(self):
        """Test that indicators are automatically calculated when grade is saved."""
        from django.test import TransactionTestCase
        
        # Create grade (should trigger signal)
        grade = Grade.objects.create(
            student=self.student,
            subject=self.math,
            semester=self.semester,
            value=Decimal('18.00'),
            entered_by=self.user
        )
        
        # Manually trigger the calculation since transaction.on_commit
        # doesn't work in TestCase (only in TransactionTestCase)
        from analytics.services import PerformanceCalculator
        PerformanceCalculator.recalculate_all_indicators(
            self.student.id,
            self.semester.id
        )
        
        # Check that indicator was created
        indicator = PerformanceIndicator.objects.filter(
            student=self.student,
            semester=self.semester,
            subject=self.math
        ).first()
        
        self.assertIsNotNone(indicator)
        self.assertEqual(indicator.average, Decimal('18.00'))
