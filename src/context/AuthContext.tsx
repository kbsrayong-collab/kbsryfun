import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, testConnection } from '../firebase';
import { FirebaseLoanService } from '../services/firebaseLoanService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Test initial connection to Firestore
    testConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
      if (user) {
        FirebaseLoanService.syncUserProfile(user).catch(err => {
          console.warn('Could not sync user profile:', err);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      setError(err?.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await logoutUser();
    } catch (err: any) {
      console.error('Logout failed:', err);
      setError(err?.message || 'ออกจากระบบไม่สำเร็จ');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseConnected,
        login,
        logout,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
