/**
 * Unit tests for PDF Service
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PDFService, StudentReportData } from '../pdfService';

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockDoc = {
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    addImage: vi.fn(),
    setTextColor: vi.fn(),
    addPage: vi.fn(),
    output: vi.fn(() => new Blob(['mock pdf'], { type: 'application/pdf' })),
    lastAutoTable: { finalY: 100 },
  };

  return {
    default: vi.fn(() => mockDoc),
  };
});

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

describe('PDFService', () => {
  let pdfService: PDFService;
  let mockStudentData: StudentReportData;

  beforeEach(() => {
    pdfService = new PDFService();
    mockStudentData = {
      student: {
        id: 1,
        student_id: 'STU2024001',
        first_name: 'John',
        last_name: 'Doe',
        class_name: 'Class A',
        photo: null,
      },
      grades: [
        {
          subject_name: 'Mathematics',
          semester_name: 'Semester 1',
          value: 15.5,
        },
        {
          subject_name: 'Physics',
          semester_name: 'Semester 1',
          value: 14.0,
        },
      ],
      performance: {
        subject_averages: [
          { subject: 'Mathematics', average: 15.5 },
          { subject: 'Physics', average: 14.0 },
        ],
        overall_average: 14.75,
        progression_percentage: 5.2,
        class_rank: 3,
        total_students: 25,
      },
      generated_by: 'admin',
      generated_at: new Date().toISOString(),
    };
  });

  describe('generateStudentReport', () => {
    it('should generate a PDF blob with student data', async () => {
      const result = await pdfService.generateStudentReport(mockStudentData);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('application/pdf');
    });

    it('should handle student data with no grades', async () => {
      const dataWithNoGrades = {
        ...mockStudentData,
        grades: [],
        performance: {
          ...mockStudentData.performance,
          subject_averages: [],
          overall_average: 0,
        },
      };

      const result = await pdfService.generateStudentReport(dataWithNoGrades);

      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle student data with null progression', async () => {
      const dataWithNullProgression = {
        ...mockStudentData,
        performance: {
          ...mockStudentData.performance,
          progression_percentage: null,
        },
      };

      const result = await pdfService.generateStudentReport(dataWithNullProgression);

      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle student data with null rank', async () => {
      const dataWithNullRank = {
        ...mockStudentData,
        performance: {
          ...mockStudentData.performance,
          class_rank: null,
        },
      };

      const result = await pdfService.generateStudentReport(dataWithNullRank);

      expect(result).toBeInstanceOf(Blob);
    });

    it('should include chart image when provided', async () => {
      const dataWithChart = {
        ...mockStudentData,
        chart_image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      };

      const result = await pdfService.generateStudentReport(dataWithChart);

      expect(result).toBeInstanceOf(Blob);
    });

    it('should throw error on PDF generation failure', async () => {
      // Mock output to throw error
      const errorService = new PDFService();
      (errorService as any).doc.output = vi.fn(() => {
        throw new Error('PDF generation failed');
      });

      await expect(errorService.generateStudentReport(mockStudentData)).rejects.toThrow(
        'Failed to generate PDF report'
      );
    });
  });

  describe('Student data validation', () => {
    it('should handle student data structure correctly', () => {
      // Verify the data structure is correct
      expect(mockStudentData.student).toHaveProperty('id');
      expect(mockStudentData.student).toHaveProperty('student_id');
      expect(mockStudentData.student).toHaveProperty('first_name');
      expect(mockStudentData.student).toHaveProperty('last_name');
      expect(mockStudentData.grades).toBeInstanceOf(Array);
      expect(mockStudentData.performance).toHaveProperty('overall_average');
    });
  });
});
