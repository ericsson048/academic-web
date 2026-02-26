/**
 * Report Generator Component
 * Generates and downloads PDF reports for individual students
 */

import { useState } from 'react';
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react';
import { PDFService } from '../../services/pdfService';
import { useI18n } from '../../context/I18nContext';

interface ReportGeneratorProps {
  studentId: number;
  studentName?: string;
  className?: string;
}

/**
 * ReportGenerator component with generate button, loading state, and error handling
 */
export function ReportGenerator({ studentId, studentName, className = '' }: ReportGeneratorProps) {
  const { t } = useI18n();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handle PDF generation and download
   */
  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(false);

      // Fetch student data
      const reportData = await PDFService.fetchStudentReportData(studentId);

      // Generate PDF
      const pdfService = new PDFService();
      const pdfBlob = await pdfService.generateStudentReport(reportData);

      // Trigger download
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `academic_report_${reportData.student.student_id}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Show success state
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Report generation failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : t('report.failed')
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`report-generator ${className}`}>
      {/* Generate Button */}
      <button
        onClick={handleGenerateReport}
        disabled={isGenerating}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
          transition-all duration-200
          ${
            isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : success
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }
          text-white shadow-sm hover:shadow-md
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label={`${t('report.generate')}${studentName ? ` ${studentName}` : ''}`}
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('report.generating')}</span>
          </>
        ) : success ? (
          <>
            <Download className="w-4 h-4" />
            <span>{t('report.downloaded')}</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>{t('report.generate')}</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{t('report.errorTitle')}</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State Description */}
      {isGenerating && (
        <p className="mt-2 text-sm text-gray-600">
          {t('report.fetchingData')}
        </p>
      )}

      {/* Success Message */}
      {success && !isGenerating && (
        <p className="mt-2 text-sm text-green-700 font-medium">
          {t('report.success')}
        </p>
      )}
    </div>
  );
}

/**
 * Compact version of ReportGenerator for use in tables or cards
 */
export function ReportGeneratorCompact({ studentId, className = '' }: ReportGeneratorProps) {
  const { t } = useI18n();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const reportData = await PDFService.fetchStudentReportData(studentId);
      const pdfService = new PDFService();
      const pdfBlob = await pdfService.generateStudentReport(reportData);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `academic_report_${reportData.student.student_id}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report generation failed:', err);
      setError(t('report.failedShort'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleGenerateReport}
        disabled={isGenerating}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('report.generate')}
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span>PDF</span>
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
