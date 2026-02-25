"""
Grade-related models for APAS.
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings


class Grade(models.Model):
    """
    Represents a student's grade in a specific subject for a semester.
    """
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='grades',
        help_text='Student who received this grade'
    )
    subject = models.ForeignKey(
        'students.Subject',
        on_delete=models.RESTRICT,
        related_name='grades',
        help_text='Subject for which the grade was given'
    )
    semester = models.ForeignKey(
        'students.Semester',
        on_delete=models.RESTRICT,
        related_name='grades',
        help_text='Semester in which the grade was given'
    )
    value = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(20)],
        help_text='Grade value (0-20 scale)'
    )
    entered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='grades_entered',
        help_text='User who entered this grade'
    )
    entered_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp when grade was first entered'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='Timestamp when grade was last updated'
    )
    
    class Meta:
        db_table = 'academic_grade'
        unique_together = [['student', 'subject', 'semester']]
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['subject']),
            models.Index(fields=['semester']),
            models.Index(fields=['entered_by']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(value__gte=0) & models.Q(value__lte=20),
                name='check_grade_value_range'
            )
        ]
    
    def __str__(self):
        return f"{self.student.student_id} - {self.subject.code}: {self.value}"


class GradeHistory(models.Model):
    """
    Audit trail for grade modifications.
    Tracks all changes made to grades for accountability.
    """
    grade = models.ForeignKey(
        Grade,
        on_delete=models.CASCADE,
        related_name='history',
        help_text='Grade that was modified'
    )
    old_value = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text='Previous grade value'
    )
    new_value = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text='New grade value'
    )
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name='grade_modifications',
        help_text='User who modified the grade'
    )
    modified_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Timestamp of modification'
    )
    reason = models.TextField(
        blank=True,
        help_text='Optional reason for the modification'
    )
    
    class Meta:
        db_table = 'academic_grade_history'
        verbose_name_plural = 'Grade histories'
        indexes = [
            models.Index(fields=['grade']),
            models.Index(fields=['modified_at']),
        ]
        ordering = ['-modified_at']
    
    def __str__(self):
        return f"{self.grade} changed from {self.old_value} to {self.new_value}"
