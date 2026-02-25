"""
Serializers for grade management endpoints.
"""
from decimal import Decimal

from rest_framework import serializers

from authentication.models import User
from students.models import Semester, Student, Subject

from .models import Grade, GradeHistory


class GradeStudentNestedSerializer(serializers.ModelSerializer):
    """
    Read-only nested student data for grade responses.
    """

    class_id = serializers.IntegerField(source='class_assigned_id', read_only=True)

    class Meta:
        model = Student
        fields = ['id', 'student_id', 'first_name', 'last_name', 'class_id', 'is_active']


class GradeSubjectNestedSerializer(serializers.ModelSerializer):
    """
    Read-only nested subject data for grade responses.
    """

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'coefficient']


class GradeSemesterNestedSerializer(serializers.ModelSerializer):
    """
    Read-only nested semester data for grade responses.
    """

    class Meta:
        model = Semester
        fields = ['id', 'name', 'academic_year', 'is_current', 'start_date', 'end_date']


class GradeUserNestedSerializer(serializers.ModelSerializer):
    """
    Read-only nested user data for grade and history responses.
    """

    class Meta:
        model = User
        fields = ['id', 'username', 'role']


class GradeSerializer(serializers.ModelSerializer):
    """
    Serializer for grade CRUD operations.
    """

    student = GradeStudentNestedSerializer(read_only=True)
    subject = GradeSubjectNestedSerializer(read_only=True)
    semester = GradeSemesterNestedSerializer(read_only=True)
    entered_by = GradeUserNestedSerializer(read_only=True)

    student_id = serializers.PrimaryKeyRelatedField(
        source='student',
        queryset=Student.objects.all(),
        write_only=True,
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        source='subject',
        queryset=Subject.objects.all(),
        write_only=True,
    )
    semester_id = serializers.PrimaryKeyRelatedField(
        source='semester',
        queryset=Semester.objects.all(),
        write_only=True,
    )
    reason = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Grade
        fields = [
            'id',
            'student',
            'subject',
            'semester',
            'student_id',
            'subject_id',
            'semester_id',
            'value',
            'reason',
            'entered_by',
            'entered_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'student', 'subject', 'semester', 'entered_by', 'entered_at', 'updated_at']

    def validate_value(self, value):
        """
        Ensure grade value is in the inclusive 0-20 range.
        """
        if value < Decimal('0') or value > Decimal('20'):
            raise serializers.ValidationError('Grade value must be between 0 and 20.')
        return value

    def validate(self, attrs):
        """
        Ensure uniqueness of (student, subject, semester).
        """
        student = attrs.get('student', getattr(self.instance, 'student', None))
        subject = attrs.get('subject', getattr(self.instance, 'subject', None))
        semester = attrs.get('semester', getattr(self.instance, 'semester', None))

        if student and subject and semester:
            queryset = Grade.objects.filter(
                student=student,
                subject=subject,
                semester=semester,
            )
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)

            if queryset.exists():
                raise serializers.ValidationError(
                    'A grade already exists for this student, subject, and semester.'
                )

        return attrs

    def create(self, validated_data):
        """
        Drop optional reason during create (history applies to updates only).
        """
        validated_data.pop('reason', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Attach optional reason for the grade history signal.
        """
        instance._history_reason = validated_data.pop('reason', '')
        return super().update(instance, validated_data)


class GradeHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for grade history retrieval.
    """

    modified_by = GradeUserNestedSerializer(read_only=True)

    class Meta:
        model = GradeHistory
        fields = [
            'id',
            'grade',
            'old_value',
            'new_value',
            'modified_by',
            'modified_at',
            'reason',
        ]
        read_only_fields = fields


class BulkGradeItemSerializer(serializers.Serializer):
    """
    Serializer for one item in bulk grade creation.
    """

    student_id = serializers.PrimaryKeyRelatedField(source='student', queryset=Student.objects.all())
    subject_id = serializers.PrimaryKeyRelatedField(source='subject', queryset=Subject.objects.all())
    semester_id = serializers.PrimaryKeyRelatedField(source='semester', queryset=Semester.objects.all())
    value = serializers.DecimalField(max_digits=5, decimal_places=2)

    def validate_value(self, value):
        """
        Ensure grade value is in the inclusive 0-20 range.
        """
        if value < Decimal('0') or value > Decimal('20'):
            raise serializers.ValidationError('Grade value must be between 0 and 20.')
        return value

    def validate(self, attrs):
        """
        Ensure no duplicate with existing grade in the database.
        """
        if Grade.objects.filter(
            student=attrs['student'],
            subject=attrs['subject'],
            semester=attrs['semester'],
        ).exists():
            raise serializers.ValidationError(
                'A grade already exists for this student, subject, and semester.'
            )
        return attrs
