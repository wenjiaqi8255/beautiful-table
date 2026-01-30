import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Better Auth handles the callback automatically
        // The token is stored in cookies/headers by Better Auth
        const token = searchParams.get('token');

        if (token) {
          // Better Auth has already handled the authentication
          navigate('/app', { replace: true });
        } else {
          // Check if there's an error
          const error = searchParams.get('error');
          if (error) {
            console.error('OAuth error:', error);
            navigate('/?error=' + encodeURIComponent(error), { replace: true });
          } else {
            // Just redirect to app - Better Auth session is already set
            navigate('/app', { replace: true });
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/', { replace: true });
      }
    }

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Loading</h2>
        <p className="text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
}
