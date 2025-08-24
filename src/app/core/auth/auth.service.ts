import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  email?: string;
  /** Timestamp en ms (Date.now()) */
  lastLogin?: number;
}

interface PersistedAuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Timestamp en ms de cuándo se guardó */
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'auth-state';
  private readonly MAX_SESSION_HOURS = 8;    // expira sesión activa
  private readonly MAX_PERSIST_HOURS = 24;   // caducidad de lo guardado

  private currentUser = signal<AuthUser | null>(null);
  private isAuthenticated = signal<boolean>(false);

  // Credenciales mock (reemplazar por backend en prod)
  private readonly DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
  };

  constructor(private router: Router) {
    this.loadAuthState();
  }

  // signals readonly
  user = this.currentUser.asReadonly();
  authenticated = this.isAuthenticated.asReadonly();

  // ============ Helpers de tiempo ============
  private toMs(v: unknown): number {
    if (typeof v === 'number') return v;
    if (v instanceof Date) return v.getTime();
    const parsed = Date.parse(String(v));
    return Number.isFinite(parsed) ? parsed : Date.now();
  }
  private sessionFresh(lastLogin?: number): boolean {
    if (lastLogin == null) return true;
    const max = this.MAX_SESSION_HOURS * 60 * 60 * 1000;
    return Date.now() - lastLogin < max;
  }

  // ============ Auth principal ============
  login(username: string, password: string): boolean {
    if (
      username === this.DEFAULT_CREDENTIALS.username &&
      password === this.DEFAULT_CREDENTIALS.password
    ) {
      const user: AuthUser = {
        id: '1',
        username,
        role: 'admin',
        email: 'admin@infiniteloop.com',
        lastLogin: Date.now(),
      };
      this.setSession(user, true);
      return true;
    }
    return false;
  }

  logout(): void {
    this.setSession(null, false);
    this.clearAuthState();
    this.router.navigate(['/']);
  }

  checkAuth(): boolean {
    return this.isAuthenticated();
  }

  isAdmin(): boolean {
    const u = this.currentUser();
    return !!u && u.role === 'admin' && this.isAuthenticated();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser();
  }

  changePassword(currentPassword: string, newPassword: string): boolean {
    if (currentPassword === this.DEFAULT_CREDENTIALS.password) {
      // aquí llamarías a tu API para persistir el cambio
      console.log('Password changed successfully');
      return true;
    }
    return false;
  }

  updateProfile(updates: Partial<AuthUser>): boolean {
    const u = this.currentUser();
    if (!u) return false;

    const normalized: Partial<AuthUser> = { ...updates };
    if (updates.lastLogin !== undefined) {
      normalized.lastLogin = this.toMs(updates.lastLogin);
    }

    const merged: AuthUser = { ...u, ...normalized };
    this.currentUser.set(merged);
    this.persist();
    return true;
  }

  validateSession(): boolean {
    const u = this.currentUser();
    if (!u || !this.isAuthenticated()) return false;

    // caducidad de sesión activa (8h por defecto)
    const fresh = this.sessionFresh(u.lastLogin);
    if (!fresh) this.logout();
    return fresh;
  }

  renewSession(): void {
    const u = this.currentUser();
    if (u) this.updateProfile({ lastLogin: Date.now() });
  }

  // ============ Persistencia ============
  private setSession(user: AuthUser | null, authed: boolean) {
    this.currentUser.set(user);
    this.isAuthenticated.set(authed);
    this.persist();
  }

  private persist(): void {
    try {
      const payload: PersistedAuthState = {
        user: this.currentUser(),
        isAuthenticated: this.isAuthenticated(),
        timestamp: Date.now(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Could not save auth state:', e);
    }
  }

  private loadAuthState(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw) as PersistedAuthState;

      // caducidad del snapshot persistido (24h)
      const savedAt = this.toMs(data?.timestamp ?? Date.now());
      const maxPersist = this.MAX_PERSIST_HOURS * 60 * 60 * 1000;
      if (Date.now() - savedAt > maxPersist) {
        this.clearAuthState();
        return;
      }

      let user: AuthUser | null = data?.user ?? null;
      if (user && user.lastLogin != null) {
        user = { ...user, lastLogin: this.toMs(user.lastLogin) };
      }

      if (data?.isAuthenticated && user && this.sessionFresh(user.lastLogin)) {
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } else {
        this.clearAuthState();
      }
    } catch (e) {
      console.warn('Could not load auth state:', e);
      this.clearAuthState();
    }
  }

  private clearAuthState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear auth state:', e);
    }
  }

  // Debug
  getAuthDebugInfo() {
    return {
      user: this.currentUser(),
      authenticated: this.isAuthenticated(),
      defaultCredentials: this.DEFAULT_CREDENTIALS,
    };
  }
}
