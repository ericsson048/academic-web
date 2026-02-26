import React from 'react';
import { BookOpen, Database, Calculator, Server } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

export default function Documentation() {
  const { t } = useI18n();
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('docs.title')}</h1>
        <p className="text-slate-500 text-lg">{t('docs.subtitle')}</p>
      </div>

      {/* Methodology Section */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Calculator className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('docs.methodology')}</h2>
        </div>
        
        <div className="space-y-6 text-slate-700">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">{t('docs.weightedAverage')}</h3>
            <p className="mb-2">{t('docs.weightedAverageDesc')}</p>
            <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm border border-slate-200">
              Average = (Σ (Score_i × Weight_i)) / (Σ Weight_i)
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-2">{t('docs.indicators')}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>{t('docs.excellent')}:</strong> Average &ge; 16/20</li>
              <li><strong>{t('docs.good')}:</strong> 14 &le; Average &lt; 16</li>
              <li><strong>{t('docs.pass')}:</strong> 10 &le; Average &lt; 14</li>
              <li><strong>{t('docs.fail')}:</strong> Average &lt; 10</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Data Model Section */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('docs.dataModel')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-bold text-slate-900 mb-2">Students</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>PK: id (Integer)</li>
              <li>student_id (String, Unique)</li>
              <li>first_name (String)</li>
              <li>last_name (String)</li>
              <li>FK: class_id (Classes)</li>
            </ul>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-bold text-slate-900 mb-2">Grades</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>PK: id (Integer)</li>
              <li>FK: student_id (Students)</li>
              <li>FK: course_id (Courses)</li>
              <li>score (Real)</li>
              <li>weight (Real)</li>
              <li>type (Enum)</li>
            </ul>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-bold text-slate-900 mb-2">Courses</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>PK: id (Integer)</li>
              <li>code (String)</li>
              <li>name (String)</li>
              <li>credits (Integer)</li>
            </ul>
          </div>
          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-bold text-slate-900 mb-2">Classes</h4>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>PK: id (Integer)</li>
              <li>name (String)</li>
              <li>academic_year (String)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Server className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{t('docs.tech')}</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-24 font-semibold text-slate-900">{t('docs.frontend')}</div>
            <div className="text-slate-600">React 19, Vite, Tailwind CSS, Recharts, Lucide Icons</div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-24 font-semibold text-slate-900">{t('docs.backend')}</div>
            <div className="text-slate-600">Node.js, Express, SQLite (Better-SQLite3)</div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-24 font-semibold text-slate-900">{t('docs.security')}</div>
            <div className="text-slate-600">JWT Authentication, Bcrypt Password Hashing, Protected Routes</div>
          </div>
        </div>
      </section>
    </div>
  );
}
