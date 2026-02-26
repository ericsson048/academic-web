"""
URL configuration for analytics app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from analytics.views import (
    PerformanceIndicatorViewSet,
    AnalyticsSummaryView,
    PerformanceBySubjectView,
    PerformanceEvolutionView,
    StudentPerformanceDetailView
)

router = DefaultRouter()
router.register(r'performance-indicators', PerformanceIndicatorViewSet, basename='performance-indicator')

urlpatterns = [
    path('', include(router.urls)),
    path('summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('performance-by-subject/', PerformanceBySubjectView.as_view(), name='performance-by-subject'),
    path('performance-evolution/', PerformanceEvolutionView.as_view(), name='performance-evolution'),
    path('student/<int:student_id>/', StudentPerformanceDetailView.as_view(), name='student-performance-detail'),
]
