"""
Serializers for student management endpoints.
"""
from rest_framework import serializers

from .models import Class, Semester, Student, Subject


class StudentSerializer(serializers.ModelSerializer):
    """
    Serializer for student CRUD operations.
    """

    class_id = serializers.PrimaryKeyRelatedField(
        source='class_assigned',
        queryset=Class.objects.all()
    )

    class Meta:
        model = Student
        fields = [
            'id',
            'student_id',
            'first_name',
            'last_name',
            'class_id',
            'enrollment_date',
            'photo',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_student_id(self, value):
        """
        Ensure student_id is unique with a clear validation message.
        """
        normalized_value = value.strip()

        if not normalized_value:
            raise serializers.ValidationError('Student ID cannot be empty.')

        queryset = Student.objects.filter(student_id__iexact=normalized_value)

        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                'A student with this student ID already exists.'
            )

        return normalized_value


class ClassSerializer(serializers.ModelSerializer):
    """
    Serializer for class CRUD operations.
    """

    class Meta:
        model = Class
        fields = ['id', 'name', 'level', 'academic_year', 'created_at']
        read_only_fields = ['id', 'created_at']


class SubjectSerializer(serializers.ModelSerializer):
    """
    Serializer for subject CRUD operations.
    """

    class Meta:
        model = Subject
        fields = [
            'id',
            'name',
            'code',
            'coefficient',
            'description',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class SemesterSerializer(serializers.ModelSerializer):
    """
    Serializer for semester CRUD operations.
    """

    class Meta:
        model = Semester
        fields = [
            'id',
            'name',
            'start_date',
            'end_date',
            'academic_year',
            'is_current',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        """
        Ensure semester end date is after start date at API level.
        """
        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))

        if start_date and end_date and end_date <= start_date:
            raise serializers.ValidationError({
                'end_date': 'Semester end date must be after start date.'
            })

        return attrs
