import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../context/AuthContext';

const AuthGuard = ({ children }) => {
  const { user, loading, checkAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
};

export default AuthGuard;
