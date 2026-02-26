# APAS Management Commands

This directory contains Django management commands for the APAS system.

## Available Commands

### seed_data

Generate realistic sample academic data for testing and demonstration purposes.

**Usage:**
```bash
# Generate default data (3 classes with 20-30 students each)
python manage.py seed_data

# Generate custom data
python manage.py seed_data --classes 5 --min-students 25 --max-students 35
```

**Options:**
- `--classes N`: Number of classes to generate (default: 3)
- `--min-students N`: Minimum students per class (default: 20)
- `--max-students N`: Maximum students per class (default: 30)

**Generated Data:**
- Classes with realistic French names (Classe A, B, C, etc.)
- Students with realistic French first and last names
- Student IDs in format STU2024XXX
- 5 subjects: Mathématiques, Français, Histoire-Géographie, Sciences Physiques, SVT
- 2 semesters for the current academic year
- Grades with normal distribution around 12/20 (realistic French grading)
- Admin user: username=`admin_seed`, password=`admin123`

**Performance:**
- Uses bulk_create for efficient data insertion
- Completes within 30 seconds even with large datasets
- Progress indicators displayed during generation

---

### clear_sample_data

Clear all sample data from the database without affecting the schema.

**Usage:**
```bash
# Clear data with confirmation prompt
python manage.py clear_sample_data

# Clear data without confirmation
python manage.py clear_sample_data --no-input

# Clear data but keep user accounts
python manage.py clear_sample_data --keep-users
```

**Options:**
- `--no-input`: Skip confirmation prompt
- `--keep-users`: Keep user accounts (only delete academic data)

**What Gets Deleted:**
1. Performance indicators
2. Grade history records
3. Grades
4. Students
5. Semesters
6. Subjects
7. Classes
8. Users (unless --keep-users is specified)

**Safety Features:**
- Confirmation prompt by default
- Shows summary of data to be deleted before proceeding
- Disables signals during deletion to prevent errors
- Uses database transactions for atomicity
- Preserves database schema

---

## Example Workflow

```bash
# 1. Generate sample data
python manage.py seed_data

# 2. Test the application with sample data
# ... use the system ...

# 3. Clear sample data when done
python manage.py clear_sample_data

# 4. Generate fresh data with different parameters
python manage.py seed_data --classes 5 --min-students 30 --max-students 40
```

## Notes

- Both commands use database transactions to ensure data integrity
- The seed_data command is idempotent - running it multiple times will create additional data
- The clear_sample_data command removes ALL data, not just sample data
- Always backup your database before running clear_sample_data in production
