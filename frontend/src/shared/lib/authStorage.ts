export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
const NAME_KEY = 'name';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },
  getRole(): UserRole | null {
    const role = localStorage.getItem(ROLE_KEY);
    return role === 'ADMIN' || role === 'TEACHER' || role === 'STUDENT' ? role : null;
  },
  setRole(role: UserRole) {
    localStorage.setItem(ROLE_KEY, role);
  },
  removeRole() {
    localStorage.removeItem(ROLE_KEY);
  },
  getName(): string | null {
    return localStorage.getItem(NAME_KEY);
  },
  setName(name: string) {
    localStorage.setItem(NAME_KEY, name);
  },
  removeName() {
    localStorage.removeItem(NAME_KEY);
  },
  clear() {
    this.removeToken();
    this.removeRole();
    this.removeName();
  },
};

export const isAdminOrTeacher = (role: UserRole | null) => role === 'ADMIN' || role === 'TEACHER';
