"""
Student-related models for APAS.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Class(models.Model):
    """
    Represents an academic class (group of students).
    """
    name = models.CharField(
        max_length=100,
        help_text='Class name (e.g., "Class A", "Grade 10")'
    )
    level = models.CharField(
        max_length=50,
        help_text='Academic level (e.g., "Level 1", "Grade 10")'
    )
    academic_year = models.CharField(
        max_length=9,
        help_text='Academic year in format YYYY-YYYY (e.g., "2024-2025")'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'academic_class'
        verbose_name_plural = 'Classes'
        indexes = [
            models.Index(fields=['academic_year']),
        ]
        unique_together = [['name', 'academic_year']]
    
    def __str__(self):
        return f"{self.name} ({self.academic_year})"


class Student(models.Model):
    """
    Represents a student in the academic system.
    """
    student_id = models.CharField(
        max_length=50,
        unique=True,
        help_text='Unique student identifier'
    )
    first_name = models.CharField(
        max_length=100,
        help_text='Student first name'
    )
    last_name = models.CharField(
        max_length=100,
        help_text='Student last name'
    )
    class_assigned = models.ForeignKey(
        Class,
        on_delete=models.RESTRICT,
        related_name='students',
        help_text='Class to which the student belongs'
    )
    enrollment_date = models.DateField(
        help_text='Date when student enrolled'
    )
    photo = models.ImageField(
        upload_to='students/',
        null=True,
        blank=True,
        help_text='Student photo'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Whether the student is currently active'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'academic_student'
        indexes = [
            models.Index(fields=['class_assigned']),
            models.Index(fields=['is_active']),
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['student_id']),
        ]
    
    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"


class Subject(models.Model):
    """
    Represents an academic subject/course.
    """
    name = models.CharField(
        max_length=100,
        help_text='Subject name (e.g., "Mathematics", "Physics")'
    )
    code = models.CharField(
        max_length=20,
        unique=True,
        help_text='Unique subject code (e.g., "MATH101")'
    )
    coefficient = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=1.00,
        validators=[MinValueValidator(0.01), MaxValueValidator(9.99)],
        help_text='Subject coefficient for weighted average calculation'
    )
    description = models.TextField(
        blank=True,
        help_text='Subject description'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'academic_subject'
        indexes = [
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Semester(models.Model):
    """
    Represents an academic semester/period.
    """
    name = models.CharField(
        max_length=50,
        help_text='Semester name (e.g., "Semester 1", "Fall 2024")'
    )
    start_date = models.DateField(
        help_text='Semester start date'
    )
    end_date = models.DateField(
        help_text='Semester end date'
    )
    academic_year = models.CharField(
        max_length=9,
        help_text='Academic year in format YYYY-YYYY (e.g., "2024-2025")'
    )
    is_current = models.BooleanField(
        default=False,
        help_text='Whether this is the current active semester'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'academic_semester'
        indexes = [
            models.Index(fields=['academic_year']),
            models.Index(fields=['is_current']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F('start_date')),
                name='check_semester_dates'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({self.academic_year})"
