import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import { cn } from '../lib/utils';

interface Student {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  class_name: string;
  email?: string;
}

interface Course {
  id: number;
  code: string;
  name: string;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Student Form State
  const [studentForm, setStudentForm] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    class_id: ''
  });

  // Grade Form State
  const [gradeForm, setGradeForm] = useState({
    course_id: '',
    score: '',
    type: 'exam',
    weight: '1.0'
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/students').then(res => res.json()),
      fetch('/api/courses').then(res => res.json()),
      fetch('/api/classes').then(res => res.json())
    ]).then(([studentsData, coursesData, classesData]) => {
      setStudents(studentsData);
      setCourses(coursesData);
      setClasses(classesData);
      setLoading(false);
    });
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentForm.student_id,
          first_name: studentForm.first_name,
          last_name: studentForm.last_name,
          class_id: Number(studentForm.class_id)
        })
      });

      if (res.ok) {
        const newId = await res.json();
        // Refresh students list
        const updatedStudents = await fetch('/api/students').then(r => r.json());
        setStudents(updatedStudents);
        setShowAddStudentModal(false);
        setStudentForm({ student_id: '', first_name: '', last_name: '', class_id: '' });
        alert('Student added successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id,
          course_id: Number(gradeForm.course_id),
          score: Number(gradeForm.score),
          type: gradeForm.type,
          weight: Number(gradeForm.weight)
        })
      });

      if (res.ok) {
        setShowGradeModal(false);
        setGradeForm({ course_id: '', score: '', type: 'exam', weight: '1.0' });
        alert('Grade added successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id.includes(searchTerm);
    const matchesClass = selectedClass === 'all' || s.class_name === selectedClass;
    return matchesSearch && matchesClass;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
        <button 
          onClick={() => setShowAddStudentModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search by name or ID..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          <option value="all">All Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">{student.student_id}</td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                      {student.first_name[0]}{student.last_name[0]}
                    </div>
                    <div>
                      <div className="font-medium">{student.last_name} {student.first_name}</div>
                      <div className="text-xs text-slate-400">{student.email || 'No email'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600 border border-slate-200">
                    {student.class_name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button 
                    onClick={() => {
                      setSelectedStudent(student);
                      setShowGradeModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 font-medium text-xs border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50 transition-colors"
                  >
                    Add Grade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Student</h2>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (Matricule)</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={studentForm.student_id}
                  onChange={e => setStudentForm({...studentForm, student_id: e.target.value})}
                  placeholder="e.g. 2025001"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={studentForm.first_name}
                    onChange={e => setStudentForm({...studentForm, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={studentForm.last_name}
                    onChange={e => setStudentForm({...studentForm, last_name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                <select 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={studentForm.class_id}
                  onChange={e => setStudentForm({...studentForm, class_id: e.target.value})}
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Add Grade for {selectedStudent.first_name} {selectedStudent.last_name}
            </h2>
            <form onSubmit={handleAddGrade} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course</label>
                <select 
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={gradeForm.course_id}
                  onChange={e => setGradeForm({...gradeForm, course_id: e.target.value})}
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Score (0-20)</label>
                  <input 
                    type="number" 
                    required
                    min="0" max="20" step="0.1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={gradeForm.score}
                    onChange={e => setGradeForm({...gradeForm, score: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Weight</label>
                  <input 
                    type="number" 
                    required
                    min="0.1" max="5" step="0.1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={gradeForm.weight}
                    onChange={e => setGradeForm({...gradeForm, weight: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={gradeForm.type}
                  onChange={e => setGradeForm({...gradeForm, type: e.target.value})}
                >
                  <option value="exam">Exam</option>
                  <option value="continuous">Continuous Assessment</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
