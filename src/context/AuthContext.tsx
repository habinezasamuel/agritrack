import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthState, LoginCredentials, AuthResponse, RegisterData, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (userData: RegisterData) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const initializeAuth = useCallback(async () => {
    const token = api.getAccessToken();
    const user = api.getUser();

    if (token && user) {
      try {
        const freshUser = await api.getCurrentUser();
        api.setUser(freshUser);
        setState({
          user: freshUser,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        api.logout();
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      const response: AuthResponse = await api.login(credentials);
      api.setTokens(response.accessToken, response.refreshToken);
      api.setUser(response.user);
      
      setState({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return response;
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<AuthResponse> => {
    setState((prev) => ({ ...prev, isLoading: true }));
    
    try {
      const response: AuthResponse = await api.register(userData);
      api.setTokens(response.accessToken, response.refreshToken);
      api.setUser(response.user);
      
      setState({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return response;
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    api.logout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshUser = async () => {
    try {
      const user = await api.getCurrentUser();
      api.setUser(user);
      setState((prev) => ({ ...prev, user }));
    } catch {
      logout();
    }
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!state.user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(state.user.role);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}