import type { User, AuthResponse, LoginCredentials, RegisterData } from '../types';

export const USERS_KEY = 'agritrack_users';
export const CURRENT_USER_KEY = 'agritrack_user';
export const ACCESS_TOKEN_KEY = 'agritrack_access_token';
export const REFRESH_TOKEN_KEY = 'agritrack_refresh_token';

interface StoredUser extends User {
  passwordHash: string;
}

function getUsers(): StoredUser[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `sha256_${Math.abs(hash).toString(16)}_${btoa(password).slice(0, 16)}`;
}

function verifyPassword(password: string, hash: string): boolean {
  const expectedHash = hashPassword(password);
  return expectedHash === hash;
}

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function seedDemoUsers() {
  const users = getUsers();
  if (users.length === 0) {
    const now = new Date().toISOString();
    const demoUsers: StoredUser[] = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@agritrack.rw',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'ADMIN',
        phoneNumber: '+250780000001',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        passwordHash: hashPassword('admin123'),
      },
      {
        id: '2',
        username: 'farmer1',
        email: 'farmer1@agritrack.rw',
        firstName: 'Jean',
        lastName: 'Habimana',
        role: 'FARMER',
        phoneNumber: '+250780000002',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        passwordHash: hashPassword('farmer123'),
      },
      {
        id: '3',
        username: 'officer1',
        email: 'officer1@agritrack.rw',
        firstName: 'Marie',
        lastName: 'Uwimana',
        role: 'OFFICER',
        phoneNumber: '+250780000003',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        passwordHash: hashPassword('officer123'),
      },
    ];
    saveUsers(demoUsers);
  }
}

seedDemoUsers();

function toAuthResponse(user: StoredUser): AuthResponse {
  const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
  const accessToken = generateToken();
  const refreshToken = generateToken();
  
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

export async function mockLogin(credentials: LoginCredentials): Promise<AuthResponse> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const users = getUsers();
  const user = users.find(u => u.username === credentials.username);

  if (!user) {
    throw new Error('Invalid username or password');
  }

  if (!verifyPassword(credentials.password, user.passwordHash)) {
    throw new Error('Invalid username or password');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated. Contact administrator.');
  }

  return toAuthResponse(user);
}

export async function mockRegister(userData: RegisterData): Promise<AuthResponse> {
  await new Promise(resolve => setTimeout(resolve, 300));

  const users = getUsers();

  if (users.some(u => u.username === userData.username)) {
    throw new Error('Username already exists');
  }

  if (users.some(u => u.email === userData.email)) {
    throw new Error('Email already registered');
  }

  const now = new Date().toISOString();
  const newUser: StoredUser = {
    id: generateId(),
    username: userData.username,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    phoneNumber: userData.phoneNumber,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    passwordHash: hashPassword(userData.password),
  };

  users.push(newUser);
  saveUsers(users);

  return toAuthResponse(newUser);
}

export function mockLogout(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getStoredUser();
}

export function mockRefreshToken(): { accessToken: string } {
  const newAccessToken = generateToken();
  localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
  return { accessToken: newAccessToken };
}