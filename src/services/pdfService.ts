/**
 * PDF Report Generation Service
 * Uses jsPDF and jspdf-autotable to generate academic reports for students
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api } from './apiClient';

/**
 * Student report data structure
 */
export interface StudentReportData {
  student: {
    id: number;
    student_id: string;
    first_name: string;
    last_name: string;
    class_name: string;
    photo?: string | null;
  };
  grades: Array<{
    subject_name: string;
    semester_name: string;
    value: number;
  }>;
  performance: {
    subject_averages: Array<{
      subject: string;
      average: number;
    }>;
    overall_average: number;
    progression_percentage: number | null;
    class_rank: number | null;
    total_students: number;
  };
  chart_image?: string; // Base64 encoded chart image
  generated_by: string;
  generated_at: string;
}

/**
 * PDF Service class for generating student academic reports
 */
export class PDFService {
  private doc: jsPDF;
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private readonly margin: number = 20;
  private currentY: number = 20;

  constructor() {
    // Initialize PDF document with A4 size
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Generate a complete student academic report
   * @param studentData - Complete student data including grades and performance
   * @returns PDF blob for download
   */
  async generateStudentReport(studentData: StudentReportData): Promise<Blob> {
    try {
      // Reset position
      this.currentY = this.margin;

      // Add header
      this.addHeader();

      // Add student identification section
      this.addStudentIdentification(studentData.student);

      // Add grades table
      this.addGradesTable(studentData.grades);

      // Add performance indicators
      this.addPerformanceIndicators(studentData.performance);

      // Add performance chart if available
      if (studentData.chart_image) {
        this.addPerformanceChart(studentData.chart_image);
      }

      // Add footer with generation metadata
      this.addFooter(studentData.generated_by, studentData.generated_at);

      // Return PDF as blob
      return this.doc.output('blob');
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Impossible de generer le rapport PDF');
    }
  }

  /**
   * Add report header
   */
  private addHeader(): void {
    // Title
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Rapport de performance academique', this.pageWidth / 2, this.currentY, {
      align: 'center',
    });

    this.currentY += 10;

    // Subtitle
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('APAS - Systeme d analyse de performance academique', this.pageWidth / 2, this.currentY, {
      align: 'center',
    });

    this.currentY += 15;
  }

  /**
   * Add student identification section
   */
  private addStudentIdentification(student: StudentReportData['student']): void {
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Informations etudiant', this.margin, this.currentY);
    this.currentY += 8;

    // Student details
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    const details = [
      `Nom: ${student.first_name} ${student.last_name}`,
      `ID etudiant: ${student.student_id}`,
      `Classe: ${student.class_name}`,
    ];

    details.forEach((detail) => {
      this.doc.text(detail, this.margin, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 5;
  }

  /**
   * Add grades table organized by subject and semester
   */
  private addGradesTable(grades: StudentReportData['grades']): void {
    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Notes par matiere et semestre', this.margin, this.currentY);
    this.currentY += 8;

    // Prepare table data
    const tableData = grades.map((grade) => [
      grade.subject_name,
      grade.semester_name,
      grade.value.toFixed(2),
    ]);

    // Generate table using autoTable
    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Matiere', 'Semestre', 'Note']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      margin: { left: this.margin, right: this.margin },
    });

    // Update Y position after table
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  /**
   * Add performance indicators section
   */
  private addPerformanceIndicators(performance: StudentReportData['performance']): void {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 80) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Indicateurs de performance', this.margin, this.currentY);
    this.currentY += 8;

    // Overall metrics
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');

    const metrics = [
      `Moyenne generale: ${performance.overall_average.toFixed(2)}/20`,
      performance.progression_percentage !== null
        ? `Progression: ${performance.progression_percentage > 0 ? '+' : ''}${performance.progression_percentage.toFixed(2)}%`
        : 'Progression: N/A',
      performance.class_rank !== null
        ? `Rang dans la classe: ${performance.class_rank}/${performance.total_students}`
        : 'Rang dans la classe: N/A',
    ];

    metrics.forEach((metric) => {
      this.doc.text(metric, this.margin, this.currentY);
      this.currentY += 6;
    });

    this.currentY += 5;

    // Subject averages table
    if (performance.subject_averages.length > 0) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Moyenne par matiere', this.margin, this.currentY);
      this.currentY += 6;

      const subjectData = performance.subject_averages.map((item) => [
        item.subject,
        item.average.toFixed(2),
      ]);

      autoTable(this.doc, {
        startY: this.currentY,
        head: [['Matiere', 'Moyenne']],
        body: subjectData,
        theme: 'plain',
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        margin: { left: this.margin, right: this.margin },
      });

      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  /**
   * Add performance chart as embedded image
   */
  private addPerformanceChart(chartImageBase64: string): void {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 100) {
      this.doc.addPage();
      this.currentY = this.margin;
    }

    // Section title
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Visualisation des performances', this.margin, this.currentY);
    this.currentY += 8;

    try {
      // Add chart image
      const chartWidth = this.pageWidth - 2 * this.margin;
      const chartHeight = 80; // Fixed height for chart

      this.doc.addImage(
        chartImageBase64,
        'PNG',
        this.margin,
        this.currentY,
        chartWidth,
        chartHeight
      );

      this.currentY += chartHeight + 10;
    } catch (error) {
      console.error('Failed to add chart image:', error);
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text("Le graphique n'a pas pu etre integre", this.margin, this.currentY);
      this.currentY += 10;
    }
  }

  /**
   * Add footer with generation metadata
   */
  private addFooter(generatedBy: string, generatedAt: string): void {
    // Position footer at bottom of page
    const footerY = this.pageHeight - 15;

    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    this.doc.setTextColor(128, 128, 128);

    const footerText = `Genere par ${generatedBy} le ${new Date(generatedAt).toLocaleString('fr-FR')}`;
    this.doc.text(footerText, this.pageWidth / 2, footerY, { align: 'center' });

    // Reset text color
    this.doc.setTextColor(0, 0, 0);
  }

  /**
   * Fetch student report data from API
   * @param studentId - Student ID to fetch data for
   * @returns Complete student report data
   */
  static async fetchStudentReportData(studentId: number): Promise<StudentReportData> {
    try {
      // Fetch student analytics data from backend
      const data = await api.get<any>(`/analytics/student/${studentId}/`);

      // Transform API response to StudentReportData format
      return {
        student: {
          id: data.student.id,
          student_id: data.student.student_id,
          first_name: data.student.first_name,
          last_name: data.student.last_name,
          class_name: data.student.class_name || 'N/A',
          photo: data.student.photo,
        },
        grades: data.grades || [],
        performance: {
          subject_averages: data.performance?.subject_averages || [],
          overall_average: data.performance?.overall_average || 0,
          progression_percentage: data.performance?.progression_percentage || null,
          class_rank: data.performance?.class_rank || null,
          total_students: data.performance?.total_students || 0,
        },
        chart_image: data.chart_image,
        generated_by: data.user?.username || 'Systeme',
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to fetch student report data:', error);
      throw new Error("Impossible de recuperer les donnees etudiant pour la generation du rapport");
    }
  }
}
