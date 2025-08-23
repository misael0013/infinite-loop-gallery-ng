import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  email?: string;
  lastLogin?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<AuthUser | null>(null);
  private isAuthenticated = signal<boolean>(false);
  
  // Credenciales por defecto (en producción esto vendría de un backend)
  private readonly DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  constructor(private router: Router) {
    this.loadAuthState();
  }

  // Getters públicos
  user = this.currentUser.asReadonly();
  authenticated = this.isAuthenticated.asReadonly();

  // Método de login
  login(username: string, password: string): boolean {
    // Validación simple (en producción esto sería una llamada a API)
    if (username === this.DEFAULT_CREDENTIALS.username && 
        password === this.DEFAULT_CREDENTIALS.password) {
      
      const user: AuthUser = {
        id: '1',
        username: username,
        role: 'admin',
        email: 'admin@infiniteloop.com',
        lastLogin: new Date()
      };

      this.currentUser.set(user);
      this.isAuthenticated.set(true);
      this.saveAuthState();
      
      return true;
    }
    
    return false;
  }

  // Método de logout
  logout(): void {
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.clearAuthState();
  }

  // Verificar si el usuario está autenticado
  checkAuth(): boolean {
    return this.isAuthenticated();
  }

  // Verificar si el usuario es admin
  isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role === 'admin' && this.isAuthenticated();
  }

  // Obtener información del usuario actual
  getCurrentUser(): AuthUser | null {
    return this.currentUser();
  }

  // Cambiar contraseña (simulado)
  changePassword(currentPassword: string, newPassword: string): boolean {
    // En producción esto sería una llamada a API
    if (currentPassword === this.DEFAULT_CREDENTIALS.password) {
      // Aquí actualizarías la contraseña en el backend
      console.log('Password changed successfully');
      return true;
    }
    return false;
  }

  // Actualizar perfil de usuario
  updateProfile(updates: Partial<AuthUser>): boolean {
    const user = this.currentUser();
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.currentUser.set(updatedUser);
      this.saveAuthState();
      return true;
    }
    return false;
  }

  // Verificar sesión válida
  validateSession(): boolean {
    const user = this.currentUser();
    if (!user || !this.isAuthenticated()) {
      return false;
    }

    // Verificar si la sesión ha expirado (ejemplo: 8 horas)
    if (user.lastLogin) {
      const now = new Date();
      const sessionDuration = now.getTime() - user.lastLogin.getTime();
      const maxSessionTime = 8 * 60 * 60 * 1000; // 8 horas en ms
      
      if (sessionDuration > maxSessionTime) {
        this.logout();
        return false;
      }
    }

    return true;
  }

  // Renovar sesión
  renewSession(): void {
    const user = this.currentUser();
    if (user) {
      this.updateProfile({ lastLogin: new Date() });
    }
  }

  // Métodos privados para persistencia
  private saveAuthState(): void {
    try {
      const authData = {
        user: this.currentUser(),
        isAuthenticated: this.isAuthenticated(),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('auth-state', JSON.stringify(authData));
    } catch (error) {
      console.warn('Could not save auth state:', error);
    }
  }

  private loadAuthState(): void {
    try {
      const stored = localStorage.getItem('auth-state');
      if (stored) {
        const authData = JSON.parse(stored);
        
        // Verificar que los datos no sean muy antiguos (24 horas)
        const savedTime = new Date(authData.timestamp);
        const now = new Date();
        const timeDiff = now.getTime() - savedTime.getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 horas
        
        if (timeDiff < maxAge && authData.isAuthenticated && authData.user) {
          this.currentUser.set(authData.user);
          this.isAuthenticated.set(true);
        } else {
          this.clearAuthState();
        }
      }
    } catch (error) {
      console.warn('Could not load auth state:', error);
      this.clearAuthState();
    }
  }

  private clearAuthState(): void {
    try {
      localStorage.removeItem('auth-state');
    } catch (error) {
      console.warn('Could not clear auth state:', error);
    }
  }

  // Método para debugging (solo desarrollo)
  getAuthDebugInfo() {
    return {
      user: this.currentUser(),
      authenticated: this.isAuthenticated(),
      defaultCredentials: this.DEFAULT_CREDENTIALS
    };
  }
}