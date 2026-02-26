"""
Serializers for performance indicators.
"""
from rest_framework import serializers
from analytics.models import PerformanceIndicator
from students.models import Student, Subject, Semester


class PerformanceIndicatorSerializer(serializers.ModelSerializer):
    """
    Serializer for PerformanceIndicator model.
    Includes nested student, subject, and semester information.
    """
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.SerializerMethodField()
    subject_code = serializers.CharField(source='subject.code', read_only=True, allow_null=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True, allow_null=True)
    semester_name = serializers.CharField(source='semester.name', read_only=True)
    
    class Meta:
        model = PerformanceIndicator
        fields = [
            'id',
            'student',
            'student_id',
            'student_name',
            'semester',
            'semester_name',
            'subject',
            'subject_code',
            'subject_name',
            'average',
            'standard_deviation',
            'progression_percentage',
            'class_rank',
            'calculated_at'
        ]
        read_only_fields = [
            'id',
            'student_id',
            'student_name',
            'subject_code',
            'subject_name',
            'semester_name',
            'average',
            'standard_deviation',
            'progression_percentage',
            'class_rank',
            'calculated_at'
        ]
    
    def get_student_name(self, obj):
        """Return full student name."""
        return f"{obj.student.first_name} {obj.student.last_name}"
