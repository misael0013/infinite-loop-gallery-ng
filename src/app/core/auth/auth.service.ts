import { Injectable, signal, effect, computed } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  email?: string;
  /** Timestamp en ms (Date.now()) */
  lastLogin?: number;
  /** Última actividad del usuario */
  lastActivity?: number;
}

interface PersistedAuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** Timestamp en ms de cuándo se guardó */
  timestamp: number;
  /** Session token para validación adicional */
  sessionToken?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly STORAGE_KEY = 'auth-state';
  private readonly MAX_SESSION_HOURS = 8;    // expira sesión activa
  private readonly MAX_PERSIST_HOURS = 24;   // caducidad de lo guardado
  private readonly ACTIVITY_CHECK_INTERVAL = 60000; // 1 minuto
  private readonly MAX_INACTIVITY_MINUTES = 30; // 30 minutos de inactividad

  // 🎯 Signals principales
  private currentUser = signal<AuthUser | null>(null);
  private isAuthenticated = signal<boolean>(false);
  private sessionExpired = signal<boolean>(false);
  
  // 🔄 Observable para cambios de estado
  private authStateSubject = new BehaviorSubject<{
    user: AuthUser | null;
    isAuthenticated: boolean;
    sessionExpired: boolean;
  }>({
    user: null,
    isAuthenticated: false,
    sessionExpired: false
  });

  // 📊 Computed signals
  public readonly isLoggedIn = computed(() => 
    this.isAuthenticated() && !this.sessionExpired()
  );
  
  public readonly isAdmin = computed(() => 
    this.isLoggedIn() && this.currentUser()?.role === 'admin'
  );

  // 🔍 Session checking
  private sessionChecker$?: Observable<number>;
  private activityTracker?: () => void;

  // Credenciales mock (reemplazar por backend en prod)
  private readonly DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: 'admin123',
  };

  constructor(private router: Router) {
    this.loadAuthState();
    this.initializeSessionManagement();
    this.setupActivityTracking();
    
    // 🔄 Effect para sincronizar con BehaviorSubject
    effect(() => {
      this.authStateSubject.next({
        user: this.currentUser(),
        isAuthenticated: this.isAuthenticated(),
        sessionExpired: this.sessionExpired()
      });
    });
  }

  // ════════════════════════════════════════════════════════════════
  // 🔐 PUBLIC API
  // ════════════════════════════════════════════════════════════════

  // Signals readonly
  user = this.currentUser.asReadonly();
  authenticated = this.isAuthenticated.asReadonly();
  expired = this.sessionExpired.asReadonly();

  // Observable para subscripciones
  authState$ = this.authStateSubject.asObservable();

  // ============ Auth principal ============
  login(username: string, password: string): boolean {
    if (
      username === this.DEFAULT_CREDENTIALS.username &&
      password === this.DEFAULT_CREDENTIALS.password
    ) {
      const now = Date.now();
      const user: AuthUser = {
        id: '1',
        username,
        role: 'admin',
        email: 'admin@infiniteloop.com',
        lastLogin: now,
        lastActivity: now,
      };
      
      this.setSession(user, true);
      this.sessionExpired.set(false);
      this.startSessionChecker();
      
      console.log('✅ Login successful:', { username, timestamp: new Date(now) });
      return true;
    }
    
    console.warn('❌ Login failed:', { username });
    return false;
  }

  logout(reason: 'manual' | 'expired' | 'inactivity' = 'manual'): void {
    console.log('🚪 Logout triggered:', { reason, user: this.currentUser()?.username });
    
    this.stopSessionChecker();
    this.setSession(null, false);
    this.sessionExpired.set(false);
    this.clearAuthState();
    
    // Navegar según el motivo
    if (reason === 'expired' || reason === 'inactivity') {
      this.router.navigate(['/admin/login'], { 
        queryParams: { 
          message: reason === 'expired' ? 'session-expired' : 'session-inactive',
          returnUrl: '/admin' 
        } 
      });
    } else {
      this.router.navigate(['/']);
    }
  }

  // ============ Validación y gestión ============
  checkAuth(): boolean {
    return this.isLoggedIn();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser();
  }

  validateSession(): boolean {
    const user = this.currentUser();
    
    if (!user || !this.isAuthenticated()) {
      this.handleSessionExpiry('invalid');
      return false;
    }

    // Verificar caducidad de sesión
    if (!this.sessionFresh(user.lastLogin)) {
      this.handleSessionExpiry('expired');
      return false;
    }

    // Verificar inactividad
    if (!this.activityFresh(user.lastActivity)) {
      this.handleSessionExpiry('inactive');
      return false;
    }

    return true;
  }

  renewSession(): void {
    const user = this.currentUser();
    if (user && this.isAuthenticated()) {
      this.updateUserActivity();
      console.log('🔄 Session renewed:', { user: user.username });
    }
  }

  // ============ Gestión de actividad ============
  updateUserActivity(): void {
    const user = this.currentUser();
    if (user) {
      const now = Date.now();
      const updated = { ...user, lastActivity: now };
      this.currentUser.set(updated);
      this.persist();
    }
  }

  // ============ Gestión de perfil ============
  updateProfile(updates: Partial<AuthUser>): boolean {
    const user = this.currentUser();
    if (!user) return false;

    const normalized: Partial<AuthUser> = { ...updates };
    if (updates.lastLogin !== undefined) {
      normalized.lastLogin = this.toMs(updates.lastLogin);
    }
    if (updates.lastActivity !== undefined) {
      normalized.lastActivity = this.toMs(updates.lastActivity);
    }

    const merged: AuthUser = { ...user, ...normalized };
    this.currentUser.set(merged);
    this.persist();
    return true;
  }

  changePassword(currentPassword: string, newPassword: string): boolean {
    if (currentPassword === this.DEFAULT_CREDENTIALS.password) {
      // En producción, aquí harías la llamada al API
      console.log('🔑 Password changed successfully');
      return true;
    }
    return false;
  }

  // ============ Debug y utilidades ============
  getAuthDebugInfo() {
    const user = this.currentUser();
    return {
      user,
      authenticated: this.isAuthenticated(),
      sessionExpired: this.sessionExpired(),
      isLoggedIn: this.isLoggedIn(),
      isAdmin: this.isAdmin(),
      sessionFresh: user ? this.sessionFresh(user.lastLogin) : false,
      activityFresh: user ? this.activityFresh(user.lastActivity) : false,
      defaultCredentials: this.DEFAULT_CREDENTIALS,
    };
  }

  // ════════════════════════════════════════════════════════════════
  // 🔧 PRIVATE METHODS
  // ════════════════════════════════════════════════════════════════

  private initializeSessionManagement(): void {
    // Verificar sesión al inicializar
    if (this.isAuthenticated()) {
      if (this.validateSession()) {
        this.startSessionChecker();
      }
    }
  }

  private setupActivityTracking(): void {
    // Eventos que indican actividad del usuario
    const activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    
    this.activityTracker = () => {
      if (this.isAuthenticated()) {
        this.updateUserActivity();
      }
    };

    // Throttle para evitar demasiadas actualizaciones
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const throttledTracker = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          this.activityTracker?.();
          throttleTimer = null;
        }, 5000); // Máximo una actualización cada 5 segundos
      }
    };

    // Registrar listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledTracker, { passive: true });
    });
  }

  private startSessionChecker(): void {
    this.stopSessionChecker(); // Asegurar que no hay múltiples checkers
    
    this.sessionChecker$ = interval(this.ACTIVITY_CHECK_INTERVAL).pipe(
      takeWhile(() => this.isAuthenticated())
    );

    this.sessionChecker$.subscribe(() => {
      if (!this.validateSession()) {
        this.stopSessionChecker();
      }
    });

    console.log('⏰ Session checker started');
  }

  private stopSessionChecker(): void {
    this.sessionChecker$ = undefined;
    console.log('⏰ Session checker stopped');
  }

  private handleSessionExpiry(reason: 'expired' | 'inactive' | 'invalid'): void {
    console.warn('⚠️ Session expired:', { reason });
    
    this.sessionExpired.set(true);
    
    setTimeout(() => {
      this.logout(reason === 'expired' ? 'expired' : 'inactivity');
    }, 100); // Pequeño delay para permitir que la UI reaccione
  }

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

  private activityFresh(lastActivity?: number): boolean {
    if (lastActivity == null) return true;
    const max = this.MAX_INACTIVITY_MINUTES * 60 * 1000;
    return Date.now() - lastActivity < max;
  }

  // ============ Persistencia mejorada ============
  private setSession(user: AuthUser | null, authed: boolean): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(authed);
    this.persist();
  }

  private persist(): void {
    try {
      const sessionToken = this.generateSessionToken();
      const payload: PersistedAuthState = {
        user: this.currentUser(),
        isAuthenticated: this.isAuthenticated(),
        timestamp: Date.now(),
        sessionToken
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('⚠️ Could not save auth state:', e);
    }
  }

  private loadAuthState(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw) as PersistedAuthState;

      // Verificar caducidad del snapshot persistido
      const savedAt = this.toMs(data?.timestamp ?? Date.now());
      const maxPersist = this.MAX_PERSIST_HOURS * 60 * 60 * 1000;
      if (Date.now() - savedAt > maxPersist) {
        console.log('🗑️ Expired auth state cleared');
        this.clearAuthState();
        return;
      }

      let user: AuthUser | null = data?.user ?? null;
      if (user) {
        // Normalizar timestamps
        if (user.lastLogin != null) {
          user.lastLogin = this.toMs(user.lastLogin);
        }
        if (user.lastActivity != null) {
          user.lastActivity = this.toMs(user.lastActivity);
        }
      }

      if (data?.isAuthenticated && user) {
        // Verificar si la sesión sigue siendo válida
        if (this.sessionFresh(user.lastLogin) && this.activityFresh(user.lastActivity)) {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
          console.log('✅ Auth state restored:', { user: user.username });
        } else {
          console.log('⚠️ Expired session cleared');
          this.clearAuthState();
        }
      } else {
        this.clearAuthState();
      }
    } catch (e) {
      console.warn('⚠️ Could not load auth state:', e);
      this.clearAuthState();
    }
  }

  private clearAuthState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.currentUser.set(null);
      this.isAuthenticated.set(false);
      this.sessionExpired.set(false);
    } catch (e) {
      console.warn('⚠️ Could not clear auth state:', e);
    }
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
  }
}