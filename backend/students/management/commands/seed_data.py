"""
Django management command to seed the database with realistic sample academic data.

This command generates:
- 3 classes with 20-30 students each
- 5 subjects with realistic French academic names and coefficients
- 2 semesters for the current academic year
- Realistic grade distributions (normal distribution around 12/20)
- Realistic student ID format (STU2024XXX)

Usage:
    python manage.py seed_data
"""
import random
from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model
from students.models import Class, Student, Subject, Semester
from grades.models import Grade

User = get_user_model()


class Command(BaseCommand):
    help = 'Generate realistic sample academic data for testing and demonstration'
    
    # Realistic French first names
    FIRST_NAMES = [
        'Lucas', 'Emma', 'Louis', 'Léa', 'Hugo', 'Chloé', 'Arthur', 'Manon',
        'Jules', 'Camille', 'Gabriel', 'Sarah', 'Raphaël', 'Inès', 'Adam',
        'Jade', 'Tom', 'Lola', 'Nathan', 'Zoé', 'Théo', 'Lilou', 'Maxime',
        'Clara', 'Alexandre', 'Léna', 'Antoine', 'Juliette', 'Paul', 'Louise',
        'Victor', 'Alice', 'Mathis', 'Anaïs', 'Ethan', 'Eva', 'Noah', 'Rose',
        'Clément', 'Anna', 'Thomas', 'Margaux', 'Nicolas', 'Sofia', 'Baptiste',
        'Romane', 'Mathéo', 'Pauline', 'Enzo', 'Marine'
    ]
    
    # Realistic French last names
    LAST_NAMES = [
        'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
        'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel',
        'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel',
        'Girard', 'André', 'Lefevre', 'Mercier', 'Dupont', 'Lambert', 'Bonnet',
        'François', 'Martinez', 'Legrand', 'Garnier', 'Faure', 'Rousseau',
        'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin',
        'Morin', 'Mathieu', 'Clement', 'Gauthier', 'Dumont', 'Lopez', 'Fontaine',
        'Chevalier', 'Robin'
    ]
    
    # Realistic French academic subjects with coefficients
    SUBJECTS = [
        ('Mathématiques', 'MATH', Decimal('2.00')),
        ('Français', 'FRAN', Decimal('2.00')),
        ('Histoire-Géographie', 'HIST', Decimal('1.50')),
        ('Sciences Physiques', 'PHYS', Decimal('1.50')),
        ('Sciences de la Vie et de la Terre', 'SVT', Decimal('1.50')),
    ]
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--classes',
            type=int,
            default=3,
            help='Number of classes to generate (default: 3)'
        )
        parser.add_argument(
            '--min-students',
            type=int,
            default=20,
            help='Minimum students per class (default: 20)'
        )
        parser.add_argument(
            '--max-students',
            type=int,
            default=30,
            help='Maximum students per class (default: 30)'
        )
    
    def handle(self, *args, **options):
        """Main command handler."""
        num_classes = options['classes']
        min_students = options['min_students']
        max_students = options['max_students']
        
        self.stdout.write(self.style.SUCCESS('Starting data seeding...'))
        
        try:
            with transaction.atomic():
                # Create or get admin user for grade entry
                admin_user = self._create_admin_user()
                
                # Create subjects
                subjects = self._create_subjects()
                
                # Create semesters
                semesters = self._create_semesters()
                
                # Create classes and students
                classes_data = self._create_classes_and_students(
                    num_classes, min_students, max_students
                )
                
                # Create grades
                self._create_grades(classes_data, subjects, semesters, admin_user)
                
            self.stdout.write(self.style.SUCCESS('✓ Data seeding completed successfully!'))
            self._print_summary(classes_data, subjects, semesters)
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error during seeding: {str(e)}'))
            raise
    
    def _create_admin_user(self):
        """Create or get an admin user for grade entry."""
        self.stdout.write('Creating admin user...')
        user, created = User.objects.get_or_create(
            username='admin_seed',
            defaults={
                'email': 'admin@apas.edu',
                'role': 'admin',
                'first_name': 'Admin',
                'last_name': 'Seed'
            }
        )
        if created:
            user.set_password('admin123')
            user.save()
            self.stdout.write(self.style.SUCCESS('  ✓ Admin user created'))
        else:
            self.stdout.write('  ℹ Admin user already exists')
        return user
    
    def _create_subjects(self):
        """Create academic subjects."""
        self.stdout.write('Creating subjects...')
        subjects = []
        
        for name, code, coefficient in self.SUBJECTS:
            subject, created = Subject.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'coefficient': coefficient,
                    'description': f'Cours de {name}'
                }
            )
            subjects.append(subject)
            if created:
                self.stdout.write(f'  ✓ Created: {name} (coefficient: {coefficient})')
        
        return subjects
    
    def _create_semesters(self):
        """Create two semesters for the current academic year."""
        self.stdout.write('Creating semesters...')
        current_year = date.today().year
        academic_year = f'{current_year}-{current_year + 1}'
        
        semesters = []
        
        # Semester 1 (September - January)
        semester1, created = Semester.objects.get_or_create(
            name='Semestre 1',
            academic_year=academic_year,
            defaults={
                'start_date': date(current_year, 9, 1),
                'end_date': date(current_year + 1, 1, 31),
                'is_current': True
            }
        )
        semesters.append(semester1)
        if created:
            self.stdout.write(f'  ✓ Created: Semestre 1 ({academic_year})')
        
        # Semester 2 (February - June)
        semester2, created = Semester.objects.get_or_create(
            name='Semestre 2',
            academic_year=academic_year,
            defaults={
                'start_date': date(current_year + 1, 2, 1),
                'end_date': date(current_year + 1, 6, 30),
                'is_current': False
            }
        )
        semesters.append(semester2)
        if created:
            self.stdout.write(f'  ✓ Created: Semestre 2 ({academic_year})')
        
        return semesters
    
    def _create_classes_and_students(self, num_classes, min_students, max_students):
        """Create classes and students."""
        self.stdout.write(f'Creating {num_classes} classes with students...')
        
        current_year = date.today().year
        academic_year = f'{current_year}-{current_year + 1}'
        
        classes_data = []
        student_counter = 1
        used_names = set()
        
        for i in range(num_classes):
            # Create class
            class_name = f'Classe {chr(65 + i)}'  # A, B, C, etc.
            level = f'Niveau {i + 1}'
            
            class_obj, created = Class.objects.get_or_create(
                name=class_name,
                academic_year=academic_year,
                defaults={'level': level}
            )
            
            if created:
                self.stdout.write(f'  ✓ Created class: {class_name}')
            
            # Generate students for this class
            num_students = random.randint(min_students, max_students)
            students = []
            
            self.stdout.write(f'    Generating {num_students} students...')
            
            students_to_create = []
            for j in range(num_students):
                # Generate unique name
                while True:
                    first_name = random.choice(self.FIRST_NAMES)
                    last_name = random.choice(self.LAST_NAMES)
                    full_name = f'{first_name}_{last_name}'
                    if full_name not in used_names:
                        used_names.add(full_name)
                        break
                
                # Generate student ID
                student_id = f'STU{current_year}{student_counter:03d}'
                student_counter += 1
                
                # Random enrollment date within the last year
                days_ago = random.randint(0, 365)
                enrollment_date = date.today() - timedelta(days=days_ago)
                
                students_to_create.append(Student(
                    student_id=student_id,
                    first_name=first_name,
                    last_name=last_name,
                    class_assigned=class_obj,
                    enrollment_date=enrollment_date,
                    is_active=True
                ))
            
            # Bulk create students for performance
            created_students = Student.objects.bulk_create(
                students_to_create,
                ignore_conflicts=True
            )
            
            # Fetch the created students to get their IDs
            students = list(Student.objects.filter(
                class_assigned=class_obj,
                student_id__startswith=f'STU{current_year}'
            ))
            
            self.stdout.write(self.style.SUCCESS(
                f'    ✓ Created {len(students)} students for {class_name}'
            ))
            
            classes_data.append({
                'class': class_obj,
                'students': students
            })
        
        return classes_data
    
    def _create_grades(self, classes_data, subjects, semesters, admin_user):
        """Create realistic grades with normal distribution."""
        self.stdout.write('Generating grades...')
        
        total_grades = 0
        grades_to_create = []
        
        for class_data in classes_data:
            students = class_data['students']
            
            for student in students:
                for subject in subjects:
                    for semester in semesters:
                        # Generate grade with normal distribution around 12/20
                        # Mean: 12, Standard deviation: 3
                        grade_value = random.gauss(12.0, 3.0)
                        
                        # Clamp to valid range [0, 20]
                        grade_value = max(0.0, min(20.0, grade_value))
                        
                        # Round to 2 decimal places
                        grade_value = round(grade_value, 2)
                        
                        grades_to_create.append(Grade(
                            student=student,
                            subject=subject,
                            semester=semester,
                            value=Decimal(str(grade_value)),
                            entered_by=admin_user
                        ))
                        
                        total_grades += 1
                        
                        # Progress indicator every 100 grades
                        if total_grades % 100 == 0:
                            self.stdout.write(f'  Generated {total_grades} grades...')
        
        # Bulk create all grades for performance
        self.stdout.write(f'  Saving {total_grades} grades to database...')
        Grade.objects.bulk_create(grades_to_create, ignore_conflicts=True)
        
        self.stdout.write(self.style.SUCCESS(
            f'  ✓ Created {total_grades} grades with realistic distribution'
        ))
    
    def _print_summary(self, classes_data, subjects, semesters):
        """Print summary of generated data."""
        total_students = sum(len(cd['students']) for cd in classes_data)
        total_grades = total_students * len(subjects) * len(semesters)
        
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('SEEDING SUMMARY'))
        self.stdout.write('=' * 60)
        self.stdout.write(f'Classes created:    {len(classes_data)}')
        self.stdout.write(f'Students created:   {total_students}')
        self.stdout.write(f'Subjects created:   {len(subjects)}')
        self.stdout.write(f'Semesters created:  {len(semesters)}')
        self.stdout.write(f'Grades created:     {total_grades}')
        self.stdout.write('=' * 60)
        self.stdout.write('\nYou can now use the system with realistic sample data!')
        self.stdout.write('Admin credentials: username=admin_seed, password=admin123\n')
