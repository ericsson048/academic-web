import { useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import StudentList from '../components/students/StudentList';
import StudentForm from '../components/students/StudentForm';
import type { Student } from '../types/student';

type ViewMode = 'list' | 'grid';

export default function Students() {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleAdd = () => {
    setEditingStudent(null);
    setShowForm(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingStudent(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A] font-['Fira_Code']">
            {t('students.page.title')}
          </h1>
          <p className="text-slate-600 mt-1 font-['Fira_Sans']">
            {t('students.page.subtitle')}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
              viewMode === 'list'
                ? 'bg-[#1E40AF] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <List className="w-4 h-4" />
            {t('students.page.list')}
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-3 py-2 rounded transition-all duration-200 cursor-pointer font-['Fira_Sans'] ${
              viewMode === 'grid'
                ? 'bg-[#1E40AF] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            {t('students.page.grid')}
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <StudentList
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Grid view would need a separate implementation to fetch students */}
          <p className="col-span-full text-center text-slate-500 py-12 font-['Fira_Sans']">
            {t('students.page.gridSoon')}
          </p>
        </div>
      )}

      {/* Student Form Modal */}
      {showForm && (
        <StudentForm
          student={editingStudent}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
}
