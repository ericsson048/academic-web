# PDF Report Generation Service

This service provides PDF report generation functionality for the APAS system using jsPDF and jspdf-autotable.

## Features

- ✅ Student identification section (name, ID, class)
- ✅ Grades table organized by subject and semester
- ✅ Performance indicators (averages, progression, rank)
- ✅ Embedded performance charts
- ✅ Generation metadata (date, generator user)
- ✅ Professional formatting with headers and footers
- ✅ Error handling and loading states

## Usage

### Basic Usage

```typescript
import { PDFService } from './services/pdfService';

// Fetch student data and generate PDF
const studentId = 1;
const reportData = await PDFService.fetchStudentReportData(studentId);

const pdfService = new PDFService();
const pdfBlob = await pdfService.generateStudentReport(reportData);

// Trigger download
const url = URL.createObjectURL(pdfBlob);
const link = document.createElement('a');
link.href = url;
link.download = `report_${studentId}.pdf`;
link.click();
URL.revokeObjectURL(url);
```

### Using the ReportGenerator Component

```typescript
import { ReportGenerator } from './components/reports';

function StudentProfile({ studentId, studentName }) {
  return (
    <div>
      <h2>{studentName}</h2>
      <ReportGenerator 
        studentId={studentId}
        studentName={studentName}
      />
    </div>
  );
}
```

### Using the Compact Version

```typescript
import { ReportGeneratorCompact } from './components/reports';

function StudentTable({ students }) {
  return (
    <table>
      {students.map(student => (
        <tr key={student.id}>
          <td>{student.name}</td>
          <td>
            <ReportGeneratorCompact studentId={student.id} />
          </td>
        </tr>
      ))}
    </table>
  );
}
```

## API Endpoint Requirements

The PDF service expects the following API endpoint to be available:

```
GET /api/analytics/student/{studentId}/
```

### Expected Response Format

```json
{
  "student": {
    "id": 1,
    "student_id": "STU2024001",
    "first_name": "John",
    "last_name": "Doe",
    "class_name": "Class A",
    "photo": null
  },
  "grades": [
    {
      "subject_name": "Mathematics",
      "semester_name": "Semester 1",
      "value": 15.5
    }
  ],
  "performance": {
    "subject_averages": [
      {
        "subject": "Mathematics",
        "average": 15.5
      }
    ],
    "overall_average": 14.75,
    "progression_percentage": 5.2,
    "class_rank": 3,
    "total_students": 25
  },
  "chart_image": "data:image/png;base64,...",
  "user": {
    "username": "admin"
  }
}
```

## PDF Structure

The generated PDF includes the following sections:

1. **Header**
   - Title: "Academic Performance Report"
   - Subtitle: "APAS - Academic Performance Analytics System"

2. **Student Information**
   - Full name
   - Student ID
   - Class

3. **Grades Table**
   - Subject name
   - Semester
   - Grade value

4. **Performance Indicators**
   - Overall average
   - Progression percentage
   - Class rank
   - Subject averages table

5. **Performance Visualization** (if available)
   - Embedded chart image

6. **Footer**
   - Generation date
   - Generator username

## Configuration

### PDF Settings

The PDF is configured with the following settings:

- **Format**: A4 (210mm x 297mm)
- **Orientation**: Portrait
- **Margins**: 20mm on all sides
- **Font**: Helvetica (default jsPDF font)

### Customization

To customize the PDF appearance, modify the `PDFService` class:

```typescript
// Change page format
this.doc = new jsPDF({
  orientation: 'landscape', // or 'portrait'
  unit: 'mm',
  format: 'letter', // or 'a4', 'a3', etc.
});

// Change colors
headStyles: {
  fillColor: [41, 128, 185], // RGB color
  textColor: 255,
}
```

## Error Handling

The service includes comprehensive error handling:

- **Network errors**: Caught when fetching student data
- **PDF generation errors**: Caught during PDF creation
- **Missing data**: Handles null/undefined values gracefully

Example error handling:

```typescript
try {
  const reportData = await PDFService.fetchStudentReportData(studentId);
  const pdfService = new PDFService();
  const pdfBlob = await pdfService.generateStudentReport(reportData);
  // Success
} catch (error) {
  if (error.message.includes('fetch')) {
    console.error('Failed to fetch student data');
  } else {
    console.error('Failed to generate PDF');
  }
}
```

## Performance

- **Generation time**: 2-5 seconds for typical reports
- **File size**: 50-200 KB depending on content
- **Browser compatibility**: All modern browsers supporting Blob API

## Testing

Run the test suite:

```bash
pnpm test -- src/services/__tests__/pdfService.test.ts
```

Tests cover:
- Basic PDF generation
- Null value handling
- Chart embedding
- Error scenarios
- Data structure validation

## Dependencies

- `jspdf`: ^2.5.2 - PDF generation library
- `jspdf-autotable`: ^3.8.4 - Table generation plugin

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Opera: ✅

## Known Limitations

1. Student photos are not currently embedded (placeholder only)
2. Chart images must be provided as base64 strings
3. Maximum recommended grades per report: 100
4. PDF generation is client-side only (no server-side rendering)

## Future Enhancements

- [ ] Add student photo embedding
- [ ] Support multiple chart types
- [ ] Add custom branding/logo
- [ ] Support batch report generation
- [ ] Add print preview functionality
- [ ] Support custom fonts
- [ ] Add watermark support
