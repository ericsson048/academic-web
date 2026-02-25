import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Main app component will be added in later tasks
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">
          APAS - Academic Performance Analytics System
        </h1>
        <p className="mt-4 text-gray-600">
          Frontend setup complete. Application components will be added in subsequent tasks.
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
