"""
Signal handlers for automatic performance calculation.
Triggers recalculation when grades are created or updated.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import transaction
from grades.models import Grade
from analytics.services import PerformanceCalculator
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Grade)
def trigger_performance_calculation_on_save(sender, instance, created, **kwargs):
    """
    Automatically recalculate performance indicators when a grade is saved.
    
    This signal handler is triggered after a Grade is created or updated.
    It ensures that all performance indicators are kept up-to-date.
    
    Args:
        sender: The Grade model class
        instance: The Grade instance that was saved
        created: Boolean indicating if this is a new grade
        **kwargs: Additional keyword arguments
    """
    try:
        # Use transaction.on_commit to ensure the grade is fully saved
        # before triggering calculations
        transaction.on_commit(
            lambda: _recalculate_performance(instance)
        )
        
        action = "created" if created else "updated"
        logger.info(
            f"Grade {action} for student {instance.student.student_id}, "
            f"subject {instance.subject.code}, semester {instance.semester.name}. "
            f"Performance calculation queued."
        )
        
    except Exception as e:
        logger.error(
            f"Error queuing performance calculation after grade save: {e}"
        )


@receiver(post_delete, sender=Grade)
def trigger_performance_calculation_on_delete(sender, instance, **kwargs):
    """
    Automatically recalculate performance indicators when a grade is deleted.
    
    This ensures that averages and other metrics are updated when grades
    are removed from the system.
    
    Args:
        sender: The Grade model class
        instance: The Grade instance that was deleted
        **kwargs: Additional keyword arguments
    """
    try:
        # Use transaction.on_commit to ensure the grade is fully deleted
        transaction.on_commit(
            lambda: _recalculate_performance(instance)
        )
        
        logger.info(
            f"Grade deleted for student {instance.student.student_id}, "
            f"subject {instance.subject.code}, semester {instance.semester.name}. "
            f"Performance calculation queued."
        )
        
    except Exception as e:
        logger.error(
            f"Error queuing performance calculation after grade delete: {e}"
        )


def _recalculate_performance(grade_instance):
    """
    Helper function to perform the actual recalculation.
    Wrapped in a database transaction for atomicity.
    
    Args:
        grade_instance: The Grade instance that triggered the calculation
    """
    try:
        with transaction.atomic():
            PerformanceCalculator.recalculate_all_indicators(
                student_id=grade_instance.student_id,
                semester_id=grade_instance.semester_id
            )
            
        logger.info(
            f"Performance indicators recalculated for student "
            f"{grade_instance.student.student_id}, "
            f"semester {grade_instance.semester.name}"
        )
        
    except Exception as e:
        logger.error(
            f"Error recalculating performance indicators: {e}",
            exc_info=True
        )
