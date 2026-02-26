"""
Performance calculation service for APAS.
Handles all statistical calculations for student performance.
"""
from decimal import Decimal, InvalidOperation
from typing import Dict, Optional
from django.db import transaction
from django.db.models import Avg, StdDev, Count, Q
from grades.models import Grade
from students.models import Student, Subject, Semester, Class
from analytics.models import PerformanceIndicator
import logging

logger = logging.getLogger(__name__)


class PerformanceCalculator:
    """
    Service class for calculating student performance indicators.
    All methods are static and handle edge cases gracefully.
    """
    
    @staticmethod
    def calculate_subject_average(
        student_id: int,
        subject_id: int,
        semester_id: int
    ) -> Optional[Decimal]:
        """
        Calculate average grade for a specific subject.
        
        Args:
            student_id: Student ID
            subject_id: Subject ID
            semester_id: Semester ID
            
        Returns:
            Decimal: Average grade (0-20 scale) or None if no grades exist
        """
        try:
            grade = Grade.objects.filter(
                student_id=student_id,
                subject_id=subject_id,
                semester_id=semester_id
            ).first()
            
            # In this system, there's only one grade per student/subject/semester
            # due to unique_together constraint
            return grade.value if grade else None
            
        except Exception as e:
            logger.error(
                f"Error calculating subject average for student {student_id}, "
                f"subject {subject_id}, semester {semester_id}: {e}"
            )
            return None
    
    @staticmethod
    def calculate_overall_average(
        student_id: int,
        semester_id: int
    ) -> Optional[Decimal]:
        """
        Calculate weighted overall average across all subjects.
        Uses subject coefficients for weighting.
        
        Formula: Σ(grade × coefficient) / Σ(coefficient)
        
        Args:
            student_id: Student ID
            semester_id: Semester ID
            
        Returns:
            Decimal: Weighted average (0-20 scale) or None if no grades exist
        """
        try:
            grades = Grade.objects.filter(
                student_id=student_id,
                semester_id=semester_id
            ).select_related('subject')
            
            if not grades.exists():
                return None
            
            total_weighted_grade = Decimal('0')
            total_coefficient = Decimal('0')
            
            for grade in grades:
                coefficient = grade.subject.coefficient
                total_weighted_grade += grade.value * coefficient
                total_coefficient += coefficient
            
            # Avoid division by zero
            if total_coefficient == 0:
                logger.warning(
                    f"Total coefficient is zero for student {student_id}, "
                    f"semester {semester_id}"
                )
                return None
            
            average = total_weighted_grade / total_coefficient
            # Round to 2 decimal places
            return round(average, 2)
            
        except (InvalidOperation, ZeroDivisionError) as e:
            logger.error(
                f"Error calculating overall average for student {student_id}, "
                f"semester {semester_id}: {e}"
            )
            return None
    
    @staticmethod
    def calculate_progression(
        student_id: int,
        current_semester_id: int,
        previous_semester_id: int
    ) -> Optional[Decimal]:
        """
        Calculate progression percentage between two semesters.
        
        Formula: ((current_avg - previous_avg) / previous_avg) × 100
        
        Args:
            student_id: Student ID
            current_semester_id: Current semester ID
            previous_semester_id: Previous semester ID
            
        Returns:
            Decimal: Progression percentage or None if calculation not possible
        """
        try:
            current_avg = PerformanceCalculator.calculate_overall_average(
                student_id, current_semester_id
            )
            previous_avg = PerformanceCalculator.calculate_overall_average(
                student_id, previous_semester_id
            )
            
            if current_avg is None or previous_avg is None:
                return None
            
            # Avoid division by zero
            if previous_avg == 0:
                logger.warning(
                    f"Previous average is zero for student {student_id}"
                )
                return None
            
            progression = ((current_avg - previous_avg) / previous_avg) * 100
            # Round to 2 decimal places
            return round(progression, 2)
            
        except (InvalidOperation, ZeroDivisionError) as e:
            logger.error(
                f"Error calculating progression for student {student_id}: {e}"
            )
            return None
    
    @staticmethod
    def calculate_class_statistics(
        class_id: int,
        semester_id: int
    ) -> Dict[str, Optional[Decimal]]:
        """
        Calculate mean and standard deviation for entire class.
        
        Args:
            class_id: Class ID
            semester_id: Semester ID
            
        Returns:
            Dict with 'mean', 'std_dev', and 'student_count' keys
        """
        try:
            # Get all students in the class
            students = Student.objects.filter(
                class_assigned_id=class_id,
                is_active=True
            )
            
            if not students.exists():
                return {
                    'mean': None,
                    'std_dev': None,
                    'student_count': 0
                }
            
            # Calculate overall average for each student
            averages = []
            for student in students:
                avg = PerformanceCalculator.calculate_overall_average(
                    student.id, semester_id
                )
                if avg is not None:
                    averages.append(float(avg))
            
            if not averages:
                return {
                    'mean': None,
                    'std_dev': None,
                    'student_count': len(students)
                }
            
            # Calculate mean
            mean = sum(averages) / len(averages)
            
            # Calculate standard deviation
            if len(averages) > 1:
                variance = sum((x - mean) ** 2 for x in averages) / len(averages)
                std_dev = variance ** 0.5
            else:
                std_dev = 0.0
            
            return {
                'mean': round(Decimal(str(mean)), 2),
                'std_dev': round(Decimal(str(std_dev)), 2),
                'student_count': len(averages)
            }
            
        except Exception as e:
            logger.error(
                f"Error calculating class statistics for class {class_id}, "
                f"semester {semester_id}: {e}"
            )
            return {
                'mean': None,
                'std_dev': None,
                'student_count': 0
            }
    
    @staticmethod
    @transaction.atomic
    def recalculate_all_indicators(
        student_id: int,
        semester_id: int
    ) -> None:
        """
        Recalculate all performance indicators for a student in a semester.
        This is the orchestration method called when grades change.
        
        Calculates:
        - Subject-specific averages
        - Overall average
        - Progression (if previous semester exists)
        - Class rank
        
        Args:
            student_id: Student ID
            semester_id: Semester ID
        """
        try:
            student = Student.objects.get(id=student_id)
            semester = Semester.objects.get(id=semester_id)
            
            # Get all subjects for which the student has grades
            grades = Grade.objects.filter(
                student_id=student_id,
                semester_id=semester_id
            ).select_related('subject')
            
            # Calculate and store subject-specific averages
            for grade in grades:
                avg = PerformanceCalculator.calculate_subject_average(
                    student_id, grade.subject_id, semester_id
                )
                
                if avg is not None:
                    PerformanceIndicator.objects.update_or_create(
                        student_id=student_id,
                        semester_id=semester_id,
                        subject_id=grade.subject_id,
                        defaults={'average': avg}
                    )
            
            # Calculate and store overall average
            overall_avg = PerformanceCalculator.calculate_overall_average(
                student_id, semester_id
            )
            
            if overall_avg is not None:
                # Try to find previous semester for progression calculation
                previous_semester = Semester.objects.filter(
                    academic_year=semester.academic_year,
                    start_date__lt=semester.start_date
                ).order_by('-start_date').first()
                
                progression = None
                if previous_semester:
                    progression = PerformanceCalculator.calculate_progression(
                        student_id, semester_id, previous_semester.id
                    )
                
                # Calculate class rank
                class_rank = PerformanceCalculator._calculate_class_rank(
                    student_id, semester_id, overall_avg
                )
                
                # Get class statistics for standard deviation
                class_stats = PerformanceCalculator.calculate_class_statistics(
                    student.class_assigned_id, semester_id
                )
                
                PerformanceIndicator.objects.update_or_create(
                    student_id=student_id,
                    semester_id=semester_id,
                    subject_id=None,  # Overall indicator
                    defaults={
                        'average': overall_avg,
                        'standard_deviation': class_stats.get('std_dev'),
                        'progression_percentage': progression,
                        'class_rank': class_rank
                    }
                )
            
            logger.info(
                f"Successfully recalculated indicators for student {student_id}, "
                f"semester {semester_id}"
            )
            
        except Student.DoesNotExist:
            logger.error(f"Student {student_id} does not exist")
        except Semester.DoesNotExist:
            logger.error(f"Semester {semester_id} does not exist")
        except Exception as e:
            logger.error(
                f"Error recalculating indicators for student {student_id}, "
                f"semester {semester_id}: {e}"
            )
            raise
    
    @staticmethod
    def _calculate_class_rank(
        student_id: int,
        semester_id: int,
        student_average: Decimal
    ) -> Optional[int]:
        """
        Calculate student's rank within their class.
        Rank 1 = highest average.
        
        Args:
            student_id: Student ID
            semester_id: Semester ID
            student_average: Student's overall average
            
        Returns:
            int: Rank (1-based) or None if cannot calculate
        """
        try:
            student = Student.objects.get(id=student_id)
            
            # Get all students in the same class
            classmates = Student.objects.filter(
                class_assigned_id=student.class_assigned_id,
                is_active=True
            )
            
            # Calculate averages for all classmates
            averages = []
            for classmate in classmates:
                avg = PerformanceCalculator.calculate_overall_average(
                    classmate.id, semester_id
                )
                if avg is not None:
                    averages.append((classmate.id, avg))
            
            if not averages:
                return None
            
            # Sort by average (descending)
            averages.sort(key=lambda x: x[1], reverse=True)
            
            # Find student's rank
            for rank, (cid, avg) in enumerate(averages, start=1):
                if cid == student_id:
                    return rank
            
            return None
            
        except Exception as e:
            logger.error(
                f"Error calculating class rank for student {student_id}: {e}"
            )
            return None
