"""
Serializers for student management endpoints.
"""
from rest_framework import serializers
from django.core.validators import RegexValidator

from .models import Class, Semester, Student, Subject


class StudentSerializer(serializers.ModelSerializer):
    """
    Serializer for student CRUD operations with comprehensive validation.
    """

    class_id = serializers.PrimaryKeyRelatedField(
        source='class_assigned',
        queryset=Class.objects.all(),
        error_messages={
            'required': 'Class is required.',
            'does_not_exist': 'The specified class does not exist.',
            'incorrect_type': 'Invalid class ID format.'
        }
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
        extra_kwargs = {
            'student_id': {
                'required': True,
                'allow_blank': False,
                'error_messages': {
                    'required': 'Student ID is required.',
                    'blank': 'Student ID cannot be blank.'
                }
            },
            'first_name': {
                'required': True,
                'allow_blank': False,
                'max_length': 100,
                'error_messages': {
                    'required': 'First name is required.',
                    'blank': 'First name cannot be blank.',
                    'max_length': 'First name cannot exceed 100 characters.'
                }
            },
            'last_name': {
                'required': True,
                'allow_blank': False,
                'max_length': 100,
                'error_messages': {
                    'required': 'Last name is required.',
                    'blank': 'Last name cannot be blank.',
                    'max_length': 'Last name cannot exceed 100 characters.'
                }
            },
            'enrollment_date': {
                'required': True,
                'error_messages': {
                    'required': 'Enrollment date is required.',
                    'invalid': 'Invalid date format. Use YYYY-MM-DD.'
                }
            }
        }

    def validate_student_id(self, value):
        """
        Ensure student_id is unique with a clear validation message.
        """
        normalized_value = value.strip()

        if not normalized_value:
            raise serializers.ValidationError('Student ID cannot be empty.')
        
        if len(normalized_value) > 50:
            raise serializers.ValidationError('Student ID cannot exceed 50 characters.')

        queryset = Student.objects.filter(student_id__iexact=normalized_value)

        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                'A student with this student ID already exists.'
            )

        return normalized_value
    
    def validate_first_name(self, value):
        """
        Validate first name format.
        """
        normalized_value = value.strip()
        
        if not normalized_value:
            raise serializers.ValidationError('First name cannot be empty.')
        
        if len(normalized_value) < 2:
            raise serializers.ValidationError('First name must be at least 2 characters long.')
        
        return normalized_value
    
    def validate_last_name(self, value):
        """
        Validate last name format.
        """
        normalized_value = value.strip()
        
        if not normalized_value:
            raise serializers.ValidationError('Last name cannot be empty.')
        
        if len(normalized_value) < 2:
            raise serializers.ValidationError('Last name must be at least 2 characters long.')
        
        return normalized_value


class ClassSerializer(serializers.ModelSerializer):
    """
    Serializer for class CRUD operations with validation.
    """

    class Meta:
        model = Class
        fields = ['id', 'name', 'level', 'academic_year', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'name': {
                'required': True,
                'allow_blank': False,
                'max_length': 100,
                'error_messages': {
                    'required': 'Class name is required.',
                    'blank': 'Class name cannot be blank.',
                    'max_length': 'Class name cannot exceed 100 characters.'
                }
            },
            'level': {
                'required': True,
                'allow_blank': False,
                'max_length': 50,
                'error_messages': {
                    'required': 'Level is required.',
                    'blank': 'Level cannot be blank.',
                    'max_length': 'Level cannot exceed 50 characters.'
                }
            },
            'academic_year': {
                'required': True,
                'allow_blank': False,
                'error_messages': {
                    'required': 'Academic year is required.',
                    'blank': 'Academic year cannot be blank.'
                }
            }
        }
    
    def validate_academic_year(self, value):
        """
        Validate academic year format (e.g., 2024-2025).
        """
        import re
        normalized_value = value.strip()
        
        if not normalized_value:
            raise serializers.ValidationError('Academic year cannot be empty.')
        
        # Check format YYYY-YYYY
        if not re.match(r'^\d{4}-\d{4}$', normalized_value):
            raise serializers.ValidationError(
                'Academic year must be in format YYYY-YYYY (e.g., 2024-2025).'
            )
        
        # Validate year range
        start_year, end_year = normalized_value.split('-')
        if int(end_year) != int(start_year) + 1:
            raise serializers.ValidationError(
                'Academic year must span consecutive years (e.g., 2024-2025).'
            )
        
        return normalized_value


class SubjectSerializer(serializers.ModelSerializer):
    """
    Serializer for subject CRUD operations with validation.
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
        extra_kwargs = {
            'name': {
                'required': True,
                'allow_blank': False,
                'max_length': 100,
                'error_messages': {
                    'required': 'Subject name is required.',
                    'blank': 'Subject name cannot be blank.',
                    'max_length': 'Subject name cannot exceed 100 characters.'
                }
            },
            'code': {
                'required': True,
                'allow_blank': False,
                'max_length': 20,
                'error_messages': {
                    'required': 'Subject code is required.',
                    'blank': 'Subject code cannot be blank.',
                    'max_length': 'Subject code cannot exceed 20 characters.'
                }
            },
            'coefficient': {
                'min_value': 0.1,
                'max_value': 10.0,
                'error_messages': {
                    'min_value': 'Coefficient must be at least 0.1.',
                    'max_value': 'Coefficient cannot exceed 10.0.',
                    'invalid': 'Invalid coefficient value.'
                }
            }
        }
    
    def validate_code(self, value):
        """
        Validate subject code uniqueness and format.
        """
        normalized_value = value.strip().upper()
        
        if not normalized_value:
            raise serializers.ValidationError('Subject code cannot be empty.')
        
        # Check uniqueness
        queryset = Subject.objects.filter(code__iexact=normalized_value)
        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError(
                'A subject with this code already exists.'
            )
        
        return normalized_value


class SemesterSerializer(serializers.ModelSerializer):
    """
    Serializer for semester CRUD operations with validation.
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
        extra_kwargs = {
            'name': {
                'required': True,
                'allow_blank': False,
                'max_length': 50,
                'error_messages': {
                    'required': 'Semester name is required.',
                    'blank': 'Semester name cannot be blank.',
                    'max_length': 'Semester name cannot exceed 50 characters.'
                }
            },
            'start_date': {
                'required': True,
                'error_messages': {
                    'required': 'Start date is required.',
                    'invalid': 'Invalid date format. Use YYYY-MM-DD.'
                }
            },
            'end_date': {
                'required': True,
                'error_messages': {
                    'required': 'End date is required.',
                    'invalid': 'Invalid date format. Use YYYY-MM-DD.'
                }
            },
            'academic_year': {
                'required': True,
                'allow_blank': False,
                'error_messages': {
                    'required': 'Academic year is required.',
                    'blank': 'Academic year cannot be blank.'
                }
            }
        }

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
