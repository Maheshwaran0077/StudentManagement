import { Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-primary-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white/20 backdrop-blur p-4 rounded-2xl mb-4">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Campus Guardian 360</h1>
          <p className="text-primary-100 mt-1 text-sm">AI-Driven Campus Safety & Operations</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
