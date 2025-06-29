"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function TestLoginPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('🔍 Testing login...');
      
      const result = await signIn("credentials", {
        email: "james.smith@bowmanbathrooms.com",
        password: "password123",
        redirect: false,
      });
      
      console.log('📋 Login result:', result);
      setResult(result);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Login Test</h1>
        
        <div className="space-y-4">
          <div>
            <strong>Test Credentials:</strong>
            <br />
            Email: james.smith@bowmanbathrooms.com
            <br />
            Password: password123
          </div>
          
          <button
            onClick={testLogin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Login"}
          </button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold text-gray-900 mb-2">Result:</h3>
              <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
