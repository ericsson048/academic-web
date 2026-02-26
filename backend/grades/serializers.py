"""
Serializers for grade management endpoints with comprehensive validation.
"""
from decimal import Decimal, InvalidOperation

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
    Serializer for grade CRUD operations with comprehensive validation.
    """

    student = GradeStudentNestedSerializer(read_only=True)
    subject = GradeSubjectNestedSerializer(read_only=True)
    semester = GradeSemesterNestedSerializer(read_only=True)
    entered_by = GradeUserNestedSerializer(read_only=True)

    student_id = serializers.PrimaryKeyRelatedField(
        source='student',
        queryset=Student.objects.all(),
        write_only=True,
        error_messages={
            'required': 'Student is required.',
            'does_not_exist': 'The specified student does not exist.',
            'incorrect_type': 'Invalid student ID format.'
        }
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        source='subject',
        queryset=Subject.objects.all(),
        write_only=True,
        error_messages={
            'required': 'Subject is required.',
            'does_not_exist': 'The specified subject does not exist.',
            'incorrect_type': 'Invalid subject ID format.'
        }
    )
    semester_id = serializers.PrimaryKeyRelatedField(
        source='semester',
        queryset=Semester.objects.all(),
        write_only=True,
        error_messages={
            'required': 'Semester is required.',
            'does_not_exist': 'The specified semester does not exist.',
            'incorrect_type': 'Invalid semester ID format.'
        }
    )
    reason = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
        max_length=500,
        error_messages={
            'max_length': 'Reason cannot exceed 500 characters.'
        }
    )

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
        extra_kwargs = {
            'value': {
                'required': True,
                'error_messages': {
                    'required': 'Grade value is required.',
                    'invalid': 'Invalid grade value format.'
                }
            }
        }

    def validate_value(self, value):
        """
        Ensure grade value is in the inclusive 0-20 range with descriptive errors.
        """
        if value is None:
            raise serializers.ValidationError('Grade value is required.')
        
        try:
            decimal_value = Decimal(str(value))
        except (InvalidOperation, ValueError):
            raise serializers.ValidationError('Grade value must be a valid number.')
        
        if decimal_value < Decimal('0'):
            raise serializers.ValidationError('Grade value cannot be negative. Minimum value is 0.')
        
        if decimal_value > Decimal('20'):
            raise serializers.ValidationError('Grade value cannot exceed 20. Maximum value is 20.')
        
        # Limit to 2 decimal places
        if decimal_value.as_tuple().exponent < -2:
            raise serializers.ValidationError('Grade value can have at most 2 decimal places.')
        
        return decimal_value

    def validate(self, attrs):
        """
        Ensure uniqueness of (student, subject, semester) with descriptive error.
        """
        student = attrs.get('student', getattr(self.instance, 'student', None))
        subject = attrs.get('subject', getattr(self.instance, 'subject', None))
        semester = attrs.get('semester', getattr(self.instance, 'semester', None))

        if student and subject and semester:
            # Check if student is active
            if not student.is_active:
                raise serializers.ValidationError({
                    'student_id': f'Cannot enter grades for inactive student {student.student_id}.'
                })
            
            # Check for duplicate grade
            queryset = Grade.objects.filter(
                student=student,
                subject=subject,
                semester=semester,
            )
            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)

            if queryset.exists():
                raise serializers.ValidationError({
                    'non_field_errors': [
                        f'A grade already exists for student {student.student_id} '
                        f'in {subject.name} for {semester.name}.'
                    ]
                })

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
    Serializer for one item in bulk grade creation with validation.
    """

    student_id = serializers.PrimaryKeyRelatedField(
        source='student',
        queryset=Student.objects.all(),
        error_messages={
            'required': 'Student ID is required for each grade.',
            'does_not_exist': 'Student does not exist.',
            'incorrect_type': 'Invalid student ID format.'
        }
    )
    subject_id = serializers.PrimaryKeyRelatedField(
        source='subject',
        queryset=Subject.objects.all(),
        error_messages={
            'required': 'Subject ID is required for each grade.',
            'does_not_exist': 'Subject does not exist.',
            'incorrect_type': 'Invalid subject ID format.'
        }
    )
    semester_id = serializers.PrimaryKeyRelatedField(
        source='semester',
        queryset=Semester.objects.all(),
        error_messages={
            'required': 'Semester ID is required for each grade.',
            'does_not_exist': 'Semester does not exist.',
            'incorrect_type': 'Invalid semester ID format.'
        }
    )
    value = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        error_messages={
            'required': 'Grade value is required.',
            'invalid': 'Invalid grade value format.',
            'max_digits': 'Grade value is too large.',
            'max_decimal_places': 'Grade value can have at most 2 decimal places.'
        }
    )

    def validate_value(self, value):
        """
        Ensure grade value is in the inclusive 0-20 range.
        """
        if value < Decimal('0'):
            raise serializers.ValidationError('Grade value cannot be negative. Minimum value is 0.')
        
        if value > Decimal('20'):
            raise serializers.ValidationError('Grade value cannot exceed 20. Maximum value is 20.')
        
        return value

    def validate(self, attrs):
        """
        Ensure no duplicate with existing grade in the database.
        """
        student = attrs['student']
        subject = attrs['subject']
        semester = attrs['semester']
        
        # Check if student is active
        if not student.is_active:
            raise serializers.ValidationError(
                f'Cannot enter grades for inactive student {student.student_id}.'
            )
        
        # Check for existing grade
        if Grade.objects.filter(
            student=student,
            subject=subject,
            semester=semester,
        ).exists():
            raise serializers.ValidationError(
                f'A grade already exists for student {student.student_id} '
                f'in {subject.name} for {semester.name}.'
            )
        
        return attrs
