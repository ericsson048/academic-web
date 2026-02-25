"""
Analytics-related models for APAS.
"""
from django.db import models


class PerformanceIndicator(models.Model):
    """
    Stores calculated performance metrics for students.
    Can represent overall performance or subject-specific performance.
    """
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='performance_indicators',
        help_text='Student for whom metrics are calculated'
    )
    semester = models.ForeignKey(
        'students.Semester',
        on_delete=models.CASCADE,
        related_name='performance_indicators',
        help_text='Semester for which metrics are calculated'
    )
    subject = models.ForeignKey(
        'students.Subject',
        on_delete=models.CASCADE,
        related_name='performance_indicators',
        null=True,
        blank=True,
        help_text='Subject for which metrics are calculated (null for overall performance)'
    )
    
    # Calculated metrics
    average = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text='Average grade (subject-specific or overall weighted average)'
    )
    standard_deviation = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Standard deviation of grades (for class-level analysis)'
    )
    progression_percentage = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text='Percentage change from previous semester'
    )
    class_rank = models.IntegerField(
        null=True,
        blank=True,
        help_text='Student rank within their class'
    )
    
    calculated_at = models.DateTimeField(
        auto_now=True,
        help_text='Timestamp when metrics were last calculated'
    )
    
    class Meta:
        db_table = 'academic_performance_indicator'
        unique_together = [['student', 'semester', 'subject']]
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['semester']),
            models.Index(fields=['subject']),
        ]
    
    def __str__(self):
        subject_str = f" - {self.subject.code}" if self.subject else " (Overall)"
        return f"{self.student.student_id}{subject_str}: {self.average}"
