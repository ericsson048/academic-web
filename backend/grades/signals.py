"""
Signal handlers for grade history tracking.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .audit_context import get_current_user
from .models import Grade, GradeHistory


@receiver(pre_save, sender=Grade)
def store_previous_grade_value(sender, instance, **kwargs):
    """
    Cache the previous value before update so we can compare after save.
    """
    if not instance.pk:
        return

    try:
        previous = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    instance._previous_value = previous.value


@receiver(post_save, sender=Grade)
def create_grade_history_on_update(sender, instance, created, **kwargs):
    """
    Create a GradeHistory entry when an existing grade value changes.
    """
    if created:
        return

    old_value = getattr(instance, '_previous_value', None)
    new_value = instance.value

    if old_value is None or old_value == new_value:
        return

    acting_user = get_current_user() or instance.entered_by
    reason = getattr(instance, '_history_reason', '')

    GradeHistory.objects.create(
        grade=instance,
        old_value=old_value,
        new_value=new_value,
        modified_by=acting_user,
        reason=reason,
    )
