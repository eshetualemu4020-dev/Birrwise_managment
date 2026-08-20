// src/pages/Dashboard.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function DashboardDispatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    const dispatchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }
      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Student-only: always route to student dashboard
        navigate('/student/dashboard', { replace: true });
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      }
    };

    dispatchUser();
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      color: '#fff',
      fontSize: '1.25rem',
      fontWeight: 500
    }}>
      Loading your space... ⚡
    </div>
  );
}
