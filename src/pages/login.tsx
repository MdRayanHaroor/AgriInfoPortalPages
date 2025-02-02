// src/pages/Login.tsx
import { useState, useContext } from 'react';
//import { useRouter } from 'next/router';
import { AuthContext } from '@/context/AuthContext';
import Link from 'next/link';

export default function Login() {
  //const router = useRouter();
  // Use non-null assertion since AuthProvider always wraps the app
  const { login } = useContext(AuthContext)!;
  
  // Local state for form fields and error
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      
      // Call the AuthContext login function with the received token.
      await login(data.token);
      
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login.');
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-6 dark:text-black">Login</h1>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-gray-700">
              Email or Mobile
            </label>
            <input
              type="text"
              id="identifier"
              name="identifier"
              placeholder="Email or Mobile"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="dark:text-black mt-1 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
  Don&apos;t have an account?{" "}
  <Link href="/register">
    <span className="text-blue-600 hover:underline">Register</span>
  </Link>
</p>
      </div>
    </div>
  );
}
