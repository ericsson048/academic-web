"""
Admin configuration for analytics app.
"""
from django.contrib import admin
from analytics.models import PerformanceIndicator


@admin.register(PerformanceIndicator)
class PerformanceIndicatorAdmin(admin.ModelAdmin):
    """
    Admin interface for PerformanceIndicator model.
    Read-only since these are automatically calculated.
    """
    list_display = [
        'student',
        'semester',
        'subject',
        'average',
        'class_rank',
        'progression_percentage',
        'calculated_at'
    ]
    list_filter = ['semester', 'subject', 'calculated_at']
    search_fields = [
        'student__student_id',
        'student__first_name',
        'student__last_name'
    ]
    readonly_fields = [
        'student',
        'semester',
        'subject',
        'average',
        'standard_deviation',
        'progression_percentage',
        'class_rank',
        'calculated_at'
    ]
    ordering = ['-calculated_at']
    
    def has_add_permission(self, request):
        """Disable manual creation - indicators are auto-calculated."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Allow deletion for cleanup purposes."""
        return True
