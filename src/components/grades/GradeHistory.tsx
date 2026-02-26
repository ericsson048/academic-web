import { useState, useEffect } from 'react';
import { X, Clock, User, TrendingUp, TrendingDown, AlertCircle, Loader } from 'lucide-react';
import { api } from '../../services/apiClient';
import type { GradeHistory } from '../../types/grade';

interface GradeHistoryProps {
  gradeId: number;
  onClose: () => void;
}

export default function GradeHistoryComponent({ gradeId, onClose }: GradeHistoryProps) {
  const [history, setHistory] = useState<GradeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await api.get<GradeHistory[]>(`/grades/${gradeId}/history/`);
        setHistory(data);
      } catch (err: any) {
        console.error('Error fetching grade history:', err);
        setError(err.message || 'Failed to load grade history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [gradeId]);

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Relative time for recent changes
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    // Absolute date for older changes
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Calculate change direction and percentage
  const getChangeInfo = (oldValue: number, newValue: number) => {
    const diff = newValue - oldValue;
    const percentChange = oldValue !== 0 ? ((diff / oldValue) * 100).toFixed(1) : '0';
    const isIncrease = diff > 0;
    const isDecrease = diff < 0;

    return {
      diff: diff.toFixed(2),
      percentChange,
      isIncrease,
      isDecrease,
      isNoChange: diff === 0,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-[#1E40AF]" />
            <div>
              <h2 className="text-xl font-bold text-[#1E3A8A] font-['Fira_Code']">
                Grade History
              </h2>
              <p className="text-sm text-slate-600 font-['Fira_Sans'] mt-0.5">
                Modification timeline and audit trail
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors duration-150 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader className="w-8 h-8 text-[#1E40AF] animate-spin" />
              <p className="text-slate-600 font-['Fira_Sans']">Loading history...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 font-['Fira_Sans']">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-['Fira_Sans']">
                No modifications recorded for this grade
              </p>
              <p className="text-sm text-slate-500 font-['Fira_Sans'] mt-1">
                Changes will appear here when the grade is updated
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

                {/* History entries */}
                {history.map((entry, index) => {
                  const changeInfo = getChangeInfo(entry.old_value, entry.new_value);

                  return (
                    <div key={entry.id} className="relative pl-16 pb-8 last:pb-0">
                      {/* Timeline dot */}
                      <div
                        className={`absolute left-4 w-5 h-5 rounded-full border-4 border-white ${
                          changeInfo.isIncrease
                            ? 'bg-green-500'
                            : changeInfo.isDecrease
                            ? 'bg-red-500'
                            : 'bg-slate-400'
                        }`}
                      />

                      {/* Entry card */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-all duration-200">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700 font-['Fira_Sans']">
                              {entry.modified_by_name || `User #${entry.modified_by}`}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-['Fira_Sans']">
                            {formatDate(entry.modified_at)}
                          </span>
                        </div>

                        {/* Change details */}
                        <div className="flex items-center gap-4">
                          {/* Old value */}
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 font-['Fira_Sans'] mb-1">
                              Previous
                            </p>
                            <p className="text-2xl font-bold text-slate-400 font-['Fira_Code']">
                              {entry.old_value.toFixed(2)}
                            </p>
                          </div>

                          {/* Arrow and change indicator */}
                          <div className="flex flex-col items-center gap-1">
                            {changeInfo.isIncrease ? (
                              <TrendingUp className="w-6 h-6 text-green-500" />
                            ) : changeInfo.isDecrease ? (
                              <TrendingDown className="w-6 h-6 text-red-500" />
                            ) : (
                              <div className="w-6 h-0.5 bg-slate-400" />
                            )}
                            <span
                              className={`text-xs font-medium font-['Fira_Code'] ${
                                changeInfo.isIncrease
                                  ? 'text-green-600'
                                  : changeInfo.isDecrease
                                  ? 'text-red-600'
                                  : 'text-slate-500'
                              }`}
                            >
                              {changeInfo.isIncrease && '+'}
                              {changeInfo.diff}
                            </span>
                          </div>

                          {/* New value */}
                          <div className="flex-1">
                            <p className="text-xs text-slate-500 font-['Fira_Sans'] mb-1">
                              Updated
                            </p>
                            <p className="text-2xl font-bold text-[#1E40AF] font-['Fira_Code']">
                              {entry.new_value.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Reason (if provided) */}
                        {entry.reason && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs text-slate-500 font-['Fira_Sans'] mb-1">
                              Reason
                            </p>
                            <p className="text-sm text-slate-700 font-['Fira_Sans']">
                              {entry.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800 font-['Fira_Sans']">
                  <span className="font-semibold">{history.length}</span> modification
                  {history.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all duration-200 cursor-pointer font-['Fira_Sans'] font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
