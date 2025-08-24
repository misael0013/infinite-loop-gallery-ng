import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * 🔐 Guard base para autenticación
 * Verifica si el usuario está autenticado y la sesión es válida
 */
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 AuthGuard: Checking authentication for:', state.url);

  // Verificar autenticación básica
  if (!auth.checkAuth()) {
    console.log('❌ AuthGuard: User not authenticated');
    redirectToLogin(router, state.url);
    return false;
  }

  // Validar sesión (expiry, activity)
  if (!auth.validateSession()) {
    console.log('⚠️ AuthGuard: Session invalid or expired');
    // validateSession() ya maneja la redirección con mensaje apropiado
    return false;
  }

  // Renovar actividad del usuario
  auth.updateUserActivity();
  
  console.log('✅ AuthGuard: Access granted');
  return true;
};

/**
 * 🛡️ Guard para rutas de administrador
 * Requiere autenticación Y permisos de admin
 */
export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 AdminGuard: Checking admin access for:', state.url);

  // Primero verificar autenticación básica
  if (!auth.checkAuth()) {
    console.log('❌ AdminGuard: User not authenticated');
    redirectToLogin(router, state.url, 'Se requiere autenticación de administrador');
    return false;
  }

  // Validar sesión
  if (!auth.validateSession()) {
    console.log('⚠️ AdminGuard: Session invalid');
    return false;
  }

  // Verificar permisos de admin
  if (!auth.isAdmin()) {
    console.log('❌ AdminGuard: User lacks admin privileges');
    
    // Mostrar mensaje de acceso denegado y redirigir al home
    setTimeout(() => {
      alert('❌ Acceso denegado\n\nSe requieren privilegios de administrador para acceder a esta sección.');
    }, 100);
    
    router.navigate(['/']);
    return false;
  }

  // Renovar sesión en rutas admin
  auth.renewSession();
  
  console.log('✅ AdminGuard: Admin access granted');
  return true;
};

/**
 * 🚪 Guard para página de login
 * Redirige usuarios ya autenticados
 */
export const loginGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 LoginGuard: Checking if user should access login');

  // Si ya está autenticado y la sesión es válida
  if (auth.checkAuth() && auth.validateSession()) {
    console.log('✅ LoginGuard: User already authenticated, redirecting...');
    
    // Obtener URL de retorno o usar default
    const returnUrl = route.queryParams['returnUrl'] || (auth.isAdmin() ? '/admin' : '/');
    router.navigate([returnUrl]);
    return false;
  }

  console.log('✅ LoginGuard: Login access allowed');
  return true;
};

/**
 * 👥 Guard para rutas públicas (invitados)
 * Evita que usuarios autenticados vean ciertas páginas
 */
export const guestGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 GuestGuard: Checking guest access for:', state.url);

  // Si está autenticado, redirigir según rol
  if (auth.checkAuth() && auth.validateSession()) {
    console.log('ℹ️ GuestGuard: Authenticated user, redirecting to appropriate dashboard');
    
    const redirectUrl = auth.isAdmin() ? '/admin' : '/';
    router.navigate([redirectUrl]);
    return false;
  }

  console.log('✅ GuestGuard: Guest access allowed');
  return true;
};

/**
 * 🎯 Guard condicional para desarrollo
 * Permite bypass en desarrollo con query param especial
 */
export const devBypassGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Solo en desarrollo
  if (!isDevelopmentMode()) {
    return adminGuard(route, state);
  }

  console.log('🔍 DevBypassGuard: Development mode check');

  // Verificar si hay bypass token
  const bypassToken = route.queryParams['dev_bypass'];
  const validToken = 'dev_admin_2024';

  if (bypassToken === validToken) {
    console.log('🧪 DevBypassGuard: Development bypass activated');
    
    // Crear sesión temporal de desarrollo
    const devUser = {
      id: 'dev-user',
      username: 'dev-admin',
      role: 'admin' as const,
      email: 'dev@localhost',
      lastLogin: Date.now(),
      lastActivity: Date.now()
    };

    // Simular login (solo en desarrollo)
    (auth as any).setSession(devUser, true);
    
    // Remover query param para limpiar URL
    const urlTree = router.parseUrl(state.url);
    delete urlTree.queryParams['dev_bypass'];
    router.navigateByUrl(urlTree);
    
    return true;
  }

  // Fallback al guard normal
  return adminGuard(route, state);
};

/**
 * ⏰ Guard para verificación periódica de sesión
 * Para rutas que requieren sesión fresca
 */
export const freshSessionGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  console.log('🔍 FreshSessionGuard: Checking session freshness');

  if (!auth.checkAuth()) {
    redirectToLogin(router, state.url);
    return false;
  }

  const user = auth.getCurrentUser();
  if (!user?.lastActivity) {
    console.log('⚠️ FreshSessionGuard: No activity data available');
    redirectToLogin(router, state.url, 'Sesión requerida');
    return false;
  }

  // Verificar que la última actividad sea reciente (5 minutos)
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  if (user.lastActivity < fiveMinutesAgo) {
    console.log('⚠️ FreshSessionGuard: Session not fresh enough');
    
    auth.logout('inactivity');
    return false;
  }

  // Renovar actividad
  auth.updateUserActivity();
  
  console.log('✅ FreshSessionGuard: Fresh session verified');
  return true;
};

/**
 * 📊 Guard con logging para analytics
 * Registra accesos para estadísticas
 */
export const analyticsGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);

  // Registrar intento de acceso
  const accessLog = {
    url: state.url,
    timestamp: new Date(),
    authenticated: auth.checkAuth(),
    userRole: auth.getCurrentUser()?.role,
    userId: auth.getCurrentUser()?.id
  };

  // En producción, esto se enviaría a un servicio de analytics
  if (isDevelopmentMode()) {
    console.log('📊 Access Analytics:', accessLog);
  }

  // Continuar con verificación normal
  return authGuard(route, state);
};

// ═══════════════════════════════════════════════════════════════
// 🔧 HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Redirige al login con parámetros apropiados
 */
function redirectToLogin(router: Router, returnUrl: string, message?: string): void {
  const queryParams: any = { returnUrl };
  
  if (message) {
    queryParams.message = 'unauthorized';
  }

  console.log('🔄 Redirecting to login:', { returnUrl, message });
  router.navigate(['/admin/login'], { queryParams });
}

/**
 * Verifica si estamos en modo desarrollo
 */
function isDevelopmentMode(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.includes('stackblitz') ||
    hostname.includes('codesandbox') ||
    hostname.includes('github.dev') ||
    hostname.includes('gitpod')
  );
}

// ═══════════════════════════════════════════════════════════════
// 🎯 GUARDS ESPECIALIZADOS ADICIONALES
// ═══════════════════════════════════════════════════════════════

/**
 * 🔒 Guard para operaciones críticas
 * Requiere confirmación adicional para acciones importantes
 */
export const criticalActionGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Primero verificar admin
  if (!adminGuard(route, state)) {
    return false;
  }

  // Para operaciones críticas, verificar sesión muy fresca (2 minutos)
  const user = auth.getCurrentUser();
  const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
  
  if (!user?.lastActivity || user.lastActivity < twoMinutesAgo) {
    console.log('⚠️ CriticalActionGuard: Session too old for critical action');
    
    // Redirigir a login con mensaje específico
    router.navigate(['/admin/login'], {
      queryParams: {
        returnUrl: state.url,
        message: 'critical-action',
        action: route.data?.['action'] || 'operación crítica'
      }
    });
    
    return false;
  }

  console.log('✅ CriticalActionGuard: Critical action authorized');
  return true;
};

/**
 * 🕐 Guard para horario de administración
 * Restringe acceso admin a ciertos horarios (opcional)
 */
export const businessHoursGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Verificar admin primero
  if (!adminGuard(route, state)) {
    return false;
  }

  // Solo aplicar en producción si está configurado
  const enforceBusinessHours = route.data?.['enforceBusinessHours'] || false;
  
  if (!enforceBusinessHours || isDevelopmentMode()) {
    return true;
  }

  // Verificar horario (ejemplo: 8 AM - 8 PM)
  const now = new Date();
  const hour = now.getHours();
  
  if (hour < 8 || hour > 20) {
    console.log('⚠️ BusinessHoursGuard: Outside business hours');
    
    alert('⏰ Acceso Restringido\n\nEl panel de administración solo está disponible de 8:00 AM a 8:00 PM.');
    router.navigate(['/']);
    return false;
  }

  return true;
};

// ═══════════════════════════════════════════════════════════════
// 🔍 GUARD UTILITIES FOR DEBUGGING
// ═══════════════════════════════════════════════════════════════

/**
 * Guard de debug que loggea toda la información disponible
 */
export const debugGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  if (!isDevelopmentMode()) return true;

  const auth = inject(AuthService);
  
  console.group('🐛 Debug Guard Information');
  console.log('📍 Route:', {
    url: state.url,
    params: route.params,
    queryParams: route.queryParams,
    data: route.data
  });
  
  console.log('🔐 Auth State:', auth.getAuthDebugInfo());
  console.groupEnd();

  return true;
};

/**
 * Composición de guards para casos complejos
 */
export function createCompositeGuard(guards: CanActivateFn[]): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    for (const guard of guards) {
      const result = guard(route, state);
      if (!result) {
        return false;
      }
    }
    return true;
  };
}

// Ejemplo de uso de composite guard:
// export const superAdminGuard = createCompositeGuard([
//   debugGuard,
//   adminGuard,
//   freshSessionGuard,
//   businessHoursGuard
// ]);