import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-slate-200 text-center">
        {/* 404 Icon */}
        <div className="mb-6">
          <div className="text-[#1E40AF] text-8xl font-bold font-['Fira_Code'] mb-2">
            404
          </div>
          <div className="text-slate-400 text-lg font-['Fira_Sans']">
            Page Not Found
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-[#1E3A8A] mb-3 font-['Fira_Code']">
          Oops! Page Not Found
        </h1>
        <p className="text-slate-600 mb-6 font-['Fira_Sans']">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="
              flex items-center justify-center gap-2 px-4 py-2.5 
              bg-white text-[#1E40AF] border-2 border-[#1E40AF]
              rounded-lg hover:bg-[#1E40AF]/5 
              transition-all duration-200 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2
              font-['Fira_Sans'] font-medium
            "
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Go Back
          </button>
          <Link
            to="/"
            className="
              flex items-center justify-center gap-2 px-4 py-2.5 
              bg-[#1E40AF] text-white 
              rounded-lg hover:opacity-90 
              transition-all duration-200 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2
              font-['Fira_Sans'] font-medium
            "
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
