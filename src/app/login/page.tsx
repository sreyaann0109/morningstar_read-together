'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginPage } from '../../components/LoginPage';
import { UserProfile } from '../../types';
import { demoUsers } from '../../data/initialData';

export default function DedicatedLoginRoute() {
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<UserProfile[]>(demoUsers);

  useEffect(() => {
    fetch('/api/data', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.users) && json.users.length > 0) {
          setAllUsers(json.users);
        }
      })
      .catch(() => {});
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    try {
      localStorage.setItem('morningstar_is_logged_in', 'true');
      localStorage.setItem('morningstar_current_user', JSON.stringify(user));
    } catch (e) {}
    router.push('/');
  };

  return <LoginPage allUsers={allUsers} onLoginSuccess={handleLoginSuccess} />;
}
