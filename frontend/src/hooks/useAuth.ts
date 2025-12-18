import { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getMe().then(setUser).finally(() => setLoading(false));
    } else {
      authService.authenticate().then((data) => {
        localStorage.setItem('token', data.access_token);
        setUser(data.user);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, []);

  return { user, loading };
}
