"""
Views for performance indicators and analytics.
"""
from decimal import Decimal
from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count, Q
from analytics.models import PerformanceIndicator
from analytics.serializers import PerformanceIndicatorSerializer
from students.models import Student, Subject, Semester
from grades.models import Grade


class PerformanceIndicatorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for retrieving performance indicators.
    
    Performance indicators are automatically calculated by the system
    and cannot be manually created or modified through the API.
    
    Supports filtering by:
    - student: Filter by student ID
    - semester: Filter by semester ID
    - subject: Filter by subject ID (null for overall indicators)
    """
    queryset = PerformanceIndicator.objects.all().select_related(
        'student',
        'semester',
        'subject'
    )
    serializer_class = PerformanceIndicatorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'semester', 'subject']
    ordering_fields = ['average', 'class_rank', 'calculated_at']
    ordering = ['-calculated_at']


class AnalyticsSummaryView(APIView):
    """
    GET /api/analytics/summary/
    
    Returns dashboard summary metrics including:
    - total_students: Total number of active students
    - overall_average: Average grade across all students
    - progression_rate: Average progression percentage
    - performance_distribution: Count of students by performance category
    
    Query parameters:
    - class_id: Filter by class (optional)
    - semester_id: Filter by semester (optional)
    - student_id: Filter by student (optional)
    
    Performance categories:
    - excellent: 16-20
    - good: 14-16
    - average: 10-14
    - poor: <10
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get filter parameters
        class_id = request.query_params.get('class_id')
        semester_id = request.query_params.get('semester_id')
        student_id = request.query_params.get('student_id')
        
        # Build base queryset for students
        students_query = Student.objects.filter(is_active=True)
        if class_id:
            students_query = students_query.filter(class_assigned_id=class_id)
        if student_id and student_id.isdigit():
            students_query = students_query.filter(id=int(student_id))
        
        total_students = students_query.count()
        
        # Build base queryset for performance indicators (overall only, subject=None)
        indicators_query = PerformanceIndicator.objects.filter(subject__isnull=True)
        
        if class_id:
            indicators_query = indicators_query.filter(student__class_assigned_id=class_id)
        if semester_id:
            indicators_query = indicators_query.filter(semester_id=semester_id)
        if student_id and student_id.isdigit():
            indicators_query = indicators_query.filter(student_id=int(student_id))
        
        # Calculate overall average
        avg_result = indicators_query.aggregate(avg=Avg('average'))
        overall_average = float(avg_result['avg']) if avg_result['avg'] else 0.0
        
        # Calculate average progression rate
        progression_result = indicators_query.filter(
            progression_percentage__isnull=False
        ).aggregate(avg_progression=Avg('progression_percentage'))
        progression_rate = float(progression_result['avg_progression']) if progression_result['avg_progression'] else 0.0
        
        # Calculate performance distribution
        excellent_count = indicators_query.filter(average__gte=16).count()
        good_count = indicators_query.filter(average__gte=14, average__lt=16).count()
        average_count = indicators_query.filter(average__gte=10, average__lt=14).count()
        poor_count = indicators_query.filter(average__lt=10).count()
        
        return Response({
            'total_students': total_students,
            'overall_average': round(overall_average, 2),
            'progression_rate': round(progression_rate, 2),
            'performance_distribution': {
                'excellent': excellent_count,
                'good': good_count,
                'average': average_count,
                'poor': poor_count
            }
        })



class PerformanceBySubjectView(APIView):
    """
    GET /api/analytics/performance-by-subject/
    
    Returns average performance by subject with student count.
    
    Query parameters:
    - class_id: Filter by class (optional)
    - semester_id: Filter by semester (optional)
    - student_id: Filter by student (optional)
    
    Returns list of:
    - subject_id: Subject ID
    - subject_code: Subject code
    - subject_name: Subject name
    - average: Average grade for this subject
    - student_count: Number of students with grades in this subject
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get filter parameters
        class_id = request.query_params.get('class_id')
        semester_id = request.query_params.get('semester_id')
        student_id = request.query_params.get('student_id')
        
        # Build base queryset for performance indicators (subject-specific only)
        indicators_query = PerformanceIndicator.objects.filter(
            subject__isnull=False
        ).select_related('subject')
        
        if class_id:
            indicators_query = indicators_query.filter(student__class_assigned_id=class_id)
        if semester_id:
            indicators_query = indicators_query.filter(semester_id=semester_id)
        if student_id and student_id.isdigit():
            indicators_query = indicators_query.filter(student_id=int(student_id))
        
        # Group by subject and calculate averages
        subject_data = {}
        for indicator in indicators_query:
            subject_id = indicator.subject.id
            if subject_id not in subject_data:
                subject_data[subject_id] = {
                    'subject_id': subject_id,
                    'subject_code': indicator.subject.code,
                    'subject_name': indicator.subject.name,
                    'total': Decimal('0'),
                    'count': 0
                }
            subject_data[subject_id]['total'] += indicator.average
            subject_data[subject_id]['count'] += 1
        
        # Calculate averages and format response
        result = []
        for data in subject_data.values():
            average = float(data['total'] / data['count']) if data['count'] > 0 else 0.0
            result.append({
                'subject_id': data['subject_id'],
                'subject_code': data['subject_code'],
                'subject_name': data['subject_name'],
                'average': round(average, 2),
                'student_count': data['count']
            })
        
        # Sort by subject name
        result.sort(key=lambda x: x['subject_name'])
        
        return Response(result)


class PerformanceEvolutionView(APIView):
    """
    GET /api/analytics/performance-evolution/
    
    Returns time series data showing performance evolution over semesters.
    
    Query parameters:
    - class_id: Filter by class (optional)
    - student_id: Filter by specific student (optional)
    - semester_id: Filter by semester (optional)
    
    Returns list of:
    - semester_id: Semester ID
    - semester_name: Semester name
    - average: Average grade for this semester
    - start_date: Semester start date
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Get filter parameters
        class_id = request.query_params.get('class_id')
        student_id = request.query_params.get('student_id')
        semester_id = request.query_params.get('semester_id')
        
        # Build base queryset for performance indicators (overall only)
        indicators_query = PerformanceIndicator.objects.filter(
            subject__isnull=True
        ).select_related('semester')
        
        if class_id:
            indicators_query = indicators_query.filter(student__class_assigned_id=class_id)
        if student_id:
            indicators_query = indicators_query.filter(student_id=student_id)
        if semester_id:
            indicators_query = indicators_query.filter(semester_id=semester_id)
        
        # Group by semester and calculate averages
        semester_data = {}
        for indicator in indicators_query:
            semester_id = indicator.semester.id
            if semester_id not in semester_data:
                semester_data[semester_id] = {
                    'semester_id': semester_id,
                    'semester_name': indicator.semester.name,
                    'start_date': indicator.semester.start_date.isoformat(),
                    'total': Decimal('0'),
                    'count': 0
                }
            semester_data[semester_id]['total'] += indicator.average
            semester_data[semester_id]['count'] += 1
        
        # Calculate averages and format response
        result = []
        for data in semester_data.values():
            average = float(data['total'] / data['count']) if data['count'] > 0 else 0.0
            result.append({
                'semester_id': data['semester_id'],
                'semester_name': data['semester_name'],
                'average': round(average, 2),
                'start_date': data['start_date']
            })
        
        # Sort by start date
        result.sort(key=lambda x: x['start_date'])
        
        return Response(result)


class StudentPerformanceDetailView(APIView):
    """
    GET /api/analytics/student/{id}/
    
    Returns comprehensive student performance data including:
    - Student information
    - All grades organized by subject and semester
    - Performance indicators
    - Chart-ready data structures
    
    Path parameters:
    - id: Student ID
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, student_id):
        try:
            student = Student.objects.select_related('class_assigned').get(id=student_id)
        except Student.DoesNotExist:
            return Response(
                {'error': f'Student with ID {student_id} does not exist.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all grades for this student
        grades = Grade.objects.filter(student_id=student_id).select_related(
            'subject', 'semester', 'entered_by'
        ).order_by('semester__start_date', 'subject__name')
        
        # Format grades data
        grades_data = []
        for grade in grades:
            grades_data.append({
                'id': grade.id,
                'subject_id': grade.subject.id,
                'subject_code': grade.subject.code,
                'subject_name': grade.subject.name,
                'semester_id': grade.semester.id,
                'semester_name': grade.semester.name,
                'value': float(grade.value),
                'entered_at': grade.entered_at.isoformat(),
                'entered_by': grade.entered_by.username
            })
        
        # Get all performance indicators for this student
        indicators = PerformanceIndicator.objects.filter(
            student_id=student_id
        ).select_related('semester', 'subject').order_by('semester__start_date')
        
        # Format indicators data
        indicators_data = []
        for indicator in indicators:
            indicators_data.append({
                'id': indicator.id,
                'semester_id': indicator.semester.id,
                'semester_name': indicator.semester.name,
                'subject_id': indicator.subject.id if indicator.subject else None,
                'subject_code': indicator.subject.code if indicator.subject else None,
                'subject_name': indicator.subject.name if indicator.subject else 'Overall',
                'average': float(indicator.average),
                'standard_deviation': float(indicator.standard_deviation) if indicator.standard_deviation else None,
                'progression_percentage': float(indicator.progression_percentage) if indicator.progression_percentage else None,
                'class_rank': indicator.class_rank
            })
        
        # Prepare chart-ready data
        # Performance by subject chart data
        subject_chart_data = {}
        for indicator in indicators:
            if indicator.subject:
                subject_name = indicator.subject.name
                if subject_name not in subject_chart_data:
                    subject_chart_data[subject_name] = []
                subject_chart_data[subject_name].append(float(indicator.average))
        
        # Calculate average per subject for chart
        subject_averages = []
        for subject_name, averages in subject_chart_data.items():
            avg = sum(averages) / len(averages)
            subject_averages.append({
                'subject': subject_name,
                'average': round(avg, 2)
            })
        
        # Performance evolution chart data (overall averages by semester)
        evolution_data = []
        for indicator in indicators:
            if not indicator.subject:  # Overall indicators only
                evolution_data.append({
                    'semester': indicator.semester.name,
                    'average': float(indicator.average)
                })
        
        return Response({
            'student': {
                'id': student.id,
                'student_id': student.student_id,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'class_id': student.class_assigned.id,
                'class_name': student.class_assigned.name,
                'enrollment_date': student.enrollment_date.isoformat(),
                'is_active': student.is_active
            },
            'grades': grades_data,
            'indicators': indicators_data,
            'charts_data': {
                'performance_by_subject': subject_averages,
                'performance_evolution': evolution_data
            }
        })
