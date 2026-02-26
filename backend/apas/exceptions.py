"""
Custom exception handler for APAS API.

This module provides centralized error handling for the APAS REST API,
ensuring consistent JSON error responses with appropriate HTTP status codes
and descriptive error messages.
"""
import logging
from django.db import IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError

logger = logging.getLogger('apas')


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses.
    
    Handles:
    - DRF exceptions (ValidationError, AuthenticationFailed, etc.)
    - Database integrity errors (unique constraints, foreign keys)
    - Django validation errors
    - Unhandled exceptions
    
    Returns consistent JSON format:
    {
        "error": "Error message",
        "detail": "Detailed error information",
        "field_errors": {"field": ["error1", "error2"]}  # For validation errors
    }
    
    Args:
        exc: The exception that was raised
        context: Context information about the request
        
    Returns:
        Response object with error details and appropriate status code
    """
    # Get the request for logging
    request = context.get('request')
    view = context.get('view')
    
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    # Handle DRF exceptions (already processed by default handler)
    if response is not None:
        # Log the error with context
        logger.warning(
            f"API error: {exc.__class__.__name__} - {str(exc)} | "
            f"Path: {request.path if request else 'unknown'} | "
            f"Method: {request.method if request else 'unknown'} | "
            f"View: {view.__class__.__name__ if view else 'unknown'}"
        )
        
        # Enhance validation error format
        if isinstance(exc, ValidationError):
            error_data = {
                'error': 'Validation failed',
                'field_errors': response.data
            }
            response.data = error_data
        
        return response
    
    # Handle database integrity errors
    if isinstance(exc, IntegrityError):
        error_message = str(exc)
        error_detail = {}
        
        # Parse common integrity errors
        if 'unique constraint' in error_message.lower():
            if 'student_id' in error_message.lower():
                error_detail = {
                    'student_id': ['A student with this ID already exists.']
                }
                error_message = 'Duplicate student ID'
            elif 'code' in error_message.lower() and 'subject' in error_message.lower():
                error_detail = {
                    'code': ['A subject with this code already exists.']
                }
                error_message = 'Duplicate subject code'
            elif 'student' in error_message.lower() and 'subject' in error_message.lower() and 'semester' in error_message.lower():
                error_detail = {
                    'non_field_errors': ['A grade already exists for this student, subject, and semester.']
                }
                error_message = 'Duplicate grade entry'
            else:
                error_detail = {
                    'non_field_errors': ['This record already exists.']
                }
                error_message = 'Duplicate entry'
        
        elif 'foreign key constraint' in error_message.lower():
            if 'student' in error_message.lower():
                error_detail = {
                    'student_id': ['The specified student does not exist.']
                }
            elif 'subject' in error_message.lower():
                error_detail = {
                    'subject_id': ['The specified subject does not exist.']
                }
            elif 'semester' in error_message.lower():
                error_detail = {
                    'semester_id': ['The specified semester does not exist.']
                }
            elif 'class' in error_message.lower():
                error_detail = {
                    'class_id': ['The specified class does not exist.']
                }
            else:
                error_detail = {
                    'non_field_errors': ['Referenced record does not exist.']
                }
            error_message = 'Invalid reference'
        
        elif 'check constraint' in error_message.lower():
            if 'value' in error_message.lower():
                error_detail = {
                    'value': ['Grade value must be between 0 and 20.']
                }
                error_message = 'Invalid grade value'
            elif 'end_date' in error_message.lower():
                error_detail = {
                    'end_date': ['End date must be after start date.']
                }
                error_message = 'Invalid date range'
            else:
                error_detail = {
                    'non_field_errors': ['Data constraint violation.']
                }
                error_message = 'Constraint violation'
        
        else:
            error_detail = {
                'non_field_errors': ['Database integrity error occurred.']
            }
            error_message = 'Database error'
        
        logger.error(
            f"Database integrity error: {error_message} | "
            f"Path: {request.path if request else 'unknown'} | "
            f"Method: {request.method if request else 'unknown'} | "
            f"Details: {str(exc)}"
        )
        
        return Response(
            {
                'error': error_message,
                'field_errors': error_detail
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle Django validation errors
    if isinstance(exc, DjangoValidationError):
        logger.warning(
            f"Django validation error: {str(exc)} | "
            f"Path: {request.path if request else 'unknown'}"
        )
        
        # Convert Django ValidationError to DRF format
        if hasattr(exc, 'message_dict'):
            error_detail = exc.message_dict
        elif hasattr(exc, 'messages'):
            error_detail = {'non_field_errors': exc.messages}
        else:
            error_detail = {'non_field_errors': [str(exc)]}
        
        return Response(
            {
                'error': 'Validation failed',
                'field_errors': error_detail
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle all other unhandled exceptions
    logger.error(
        f"Unhandled exception: {exc.__class__.__name__} - {str(exc)} | "
        f"Path: {request.path if request else 'unknown'} | "
        f"Method: {request.method if request else 'unknown'} | "
        f"View: {view.__class__.__name__ if view else 'unknown'}",
        exc_info=True
    )
    
    return Response(
        {
            'error': 'An internal server error occurred. Please try again later.',
            'detail': str(exc) if logger.level == logging.DEBUG else None
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )
