import { Component, OnInit, OnDestroy, HostListener, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="navbar">
      <div class="nav__inner">
        <!-- 🍔 Hamburguesa (solo móvil) -->
        <button 
          class="nav__burger"
          [class.is-open]="isMobileMenuOpen"
          (click)="toggleMobileMenu()"
          aria-label="Toggle menu">
          <div class="burger"></div>
        </button>

        <!-- 🧭 Menú horizontal (solo desktop) -->
        <ul class="menu">
          <li><a [routerLink]="['/']" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">🏠 Inicio</a></li>
          <li><a [routerLink]="['/about']" routerLinkActive="active">👤 Sobre mí</a></li>
          <li><a [routerLink]="['/galeria']" routerLinkActive="active">📸 Galería</a></li>
          <li><a [routerLink]="['/contact']" routerLinkActive="active">📧 Contacto</a></li>
          
          <!-- 🔐 Admin menu items (solo visible para admin) -->
          <li *ngIf="isAdmin()" class="admin-divider">
            <span class="divider-line">|</span>
          </li>
          <li *ngIf="isAdmin()">
            <a [routerLink]="['/admin']" routerLinkActive="active" class="admin-link">
              ⚙️ Admin
            </a>
          </li>
        </ul>

        <!-- 🏷️ Brand/Logo -->
        <div class="left">
          <a
            [routerLink]="['/']"
            class="brand"
            (click)="onBrandClick()"
            [title]="isDevelopment() ? 'ILG - Triple click para admin' : 'ILG'">
            ILG
          </a>
        </div>

        <!-- 🎛️ Controles de la derecha -->
        <div class="right-controls">
          <!-- 🔐 Admin controls -->
          <div *ngIf="isAdmin()" class="admin-controls">
            <button
              class="admin-status-btn"
              (click)="toggleAdminMenu()"
              [title]="'Conectado como: ' + currentUsername()">
              <span class="admin-indicator">🔐</span>
              <span class="admin-username">{{ currentUsername() }}</span>
              <span class="dropdown-arrow" [class.open]="isAdminMenuOpen">▼</span>
            </button>
            
            <!-- Dropdown menu -->
            <div class="admin-dropdown" [class.is-open]="isAdminMenuOpen">
              <div class="admin-user-info">
                <div class="user-name">{{ currentUsername() }}</div>
                <div class="user-role">Administrador</div>
              </div>
              <hr>
              <button (click)="goToAdminDashboard()" class="dropdown-item">
                ⚙️ Panel Admin
              </button>
              <button (click)="debugAuthState()" *ngIf="isDevelopment()" class="dropdown-item">
                🐛 Debug Auth
              </button>
              <hr>
              <button (click)="onLogout()" class="dropdown-item logout">
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>

          <!-- 🌓 Theme toggle -->
          <button
            class="theme-toggle"
            (click)="toggleTheme()"
            [attr.aria-label]="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
            [title]="isDarkMode ? 'Modo claro' : 'Modo oscuro'">
            <!-- ☀️ Sun icon -->
            <svg *ngIf="isDarkMode" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
            <!-- 🌙 Moon icon -->
            <svg *ngIf="!isDarkMode" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 📱 Menú lateral móvil -->
    <div class="sheet" [class.is-open]="isMobileMenuOpen">
      <a [routerLink]="['/']" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMobileMenu()">
        <span>🏠</span> Inicio
      </a>
      <a [routerLink]="['/about']" routerLinkActive="active" (click)="closeMobileMenu()">
        <span>👤</span> Sobre mí
      </a>
      <a [routerLink]="['/galeria']" routerLinkActive="active" (click)="closeMobileMenu()">
        <span>📸</span> Galería
      </a>
      <a [routerLink]="['/contact']" routerLinkActive="active" (click)="closeMobileMenu()">
        <span>📧</span> Contacto
      </a>
      
      <!-- 🔐 Admin options in mobile menu -->
      <div *ngIf="isAdmin()" class="mobile-admin-section">
        <div class="mobile-divider"></div>
        <div class="mobile-admin-header">
          <span class="admin-badge">🔐 Admin</span>
          <span class="admin-user">{{ currentUsername() }}</span>
        </div>
        <a [routerLink]="['/admin']" routerLinkActive="active" (click)="closeMobileMenu()" class="admin-link">
          <span>⚙️</span> Panel Admin
        </a>
        <button (click)="onLogout()" class="logout-btn">
          <span>🚪</span> Cerrar Sesión
        </button>
      </div>
    </div>

    <!-- Overlays -->
    <div class="sheet-overlay" *ngIf="isMobileMenuOpen" (click)="closeMobileMenu()"></div>
    <div class="admin-dropdown-overlay" *ngIf="isAdminMenuOpen" (click)="closeAdminMenu()"></div>
  `,
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  isAdminMenuOpen = false;
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;

  // Triple click admin (solo dev)
  private brandClickCount = 0;
  private brandClickTimeout?: ReturnType<typeof setTimeout>;

  // 🎯 Computed signals para reactividad
  isLoggedIn = computed(() => this.authService.isLoggedIn());
  isAdmin = computed(() => this.authService.isAdmin());
  currentUsername = computed(() => this.authService.user()?.username || 'Usuario');
  sessionExpired = computed(() => this.authService.expired());

  constructor(
    public themeService: ThemeService,
    public authService: AuthService,
    private router: Router
  ) {
    // 🔄 Effect para reaccionar a cambios de sesión
    effect(() => {
      if (this.sessionExpired()) {
        this.closeAllMenus();
        console.log('🔄 Session expired - UI updated');
      }
    });
  }

  ngOnInit(): void {
    // 🧭 Cerrar menús al navegar
    this.routerSubscription = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.closeAllMenus());

    // 🔐 Suscribirse a cambios de auth state
    this.authSubscription = this.authService.authState$.subscribe(state => {
      // Cerrar menús si se pierde la autenticación
      if (!state.isAuthenticated && this.isAdminMenuOpen) {
        this.closeAdminMenu();
      }
    });

    // ✅ Validar sesión al inicializar
    if (this.authService.authenticated()) {
      this.authService.validateSession();
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    
    if (this.brandClickTimeout) {
      clearTimeout(this.brandClickTimeout);
    }
    
    // Limpiar estilos del body
    document.body.style.overflow = 'auto';
  }

  // ════════════════════════════════════════════════════════════════
  // 🎛️ EVENT HANDLERS
  // ════════════════════════════════════════════════════════════════

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth >= 768) {
      this.closeAllMenus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeAllMenus();
  }

  @HostListener('document:keydown.control.shift.a', ['$event'])
  onSecretKeyCombo(event: KeyboardEvent): void {
    event.preventDefault();
    this.showAdminAccess();
  }

  @HostListener('document:keydown.control.shift.l', ['$event'])
  onLoginKeyCombo(event: KeyboardEvent): void {
    if (this.isDevelopment()) {
      event.preventDefault();
      this.goToLogin();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Cerrar admin dropdown si se hace click fuera
    if (this.isAdminMenuOpen && !target.closest('.admin-controls')) {
      this.closeAdminMenu();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 📱 MOBILE MENU
  // ════════════════════════════════════════════════════════════════

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : 'auto';
    
    // Cerrar admin menu si está abierto
    if (this.isMobileMenuOpen && this.isAdminMenuOpen) {
      this.closeAdminMenu();
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = 'auto';
  }

  // ════════════════════════════════════════════════════════════════
  // 🔐 ADMIN MENU
  // ════════════════════════════════════════════════════════════════

  toggleAdminMenu(): void {
    this.isAdminMenuOpen = !this.isAdminMenuOpen;
    
    // Renovar sesión al interactuar
    this.authService.renewSession();
  }

  closeAdminMenu(): void {
    this.isAdminMenuOpen = false;
  }

  closeAllMenus(): void {
    this.closeMobileMenu();
    this.closeAdminMenu();
  }

  goToAdminDashboard(): void {
    this.closeAdminMenu();
    this.router.navigate(['/admin']);
  }

  onLogout(): void {
    this.closeAllMenus();
    
    const confirmMessage = `¿Cerrar sesión de administrador?

Usuario: ${this.currentUsername()}
Esta acción te llevará a la página principal.`;

    if (confirm(confirmMessage)) {
      this.authService.logout('manual');
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 🎨 THEME & UI
  // ════════════════════════════════════════════════════════════════

  toggleTheme(): void {
    this.themeService.toggle();
  }

  get isDarkMode(): boolean {
    return this.themeService.theme() === 'dark';
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      this.closeAllMenus();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 🔍 ADMIN ACCESS & DEBUG
  // ════════════════════════════════════════════════════════════════

  onBrandClick(): void {
    if (!this.isDevelopment()) return;

    this.brandClickCount++;
    if (this.brandClickTimeout) clearTimeout(this.brandClickTimeout);

    if (this.brandClickCount === 3) {
      this.showAdminAccess();
      this.brandClickCount = 0;
      return;
    }

    this.brandClickTimeout = setTimeout(() => (this.brandClickCount = 0), 1000);
  }

  private showAdminAccess(): void {
    if (this.isAdmin()) {
      this.router.navigate(['/admin']);
      return;
    }
    this.goToLogin();
  }

  private goToLogin(): void {
    this.router.navigate(['/admin/login'], { 
      queryParams: { returnUrl: '/admin' } 
    });
  }

  debugAuthState(): void {
    if (this.isDevelopment()) {
      const debugInfo = this.authService.getAuthDebugInfo();
      console.group('🔐 Auth Debug State');
      console.table(debugInfo);
      console.log('📊 Auth State Observable:', debugInfo);
      console.groupEnd();
      
      // También mostrar en alert para desarrollo
      alert(`🔐 Auth Debug
      
Authenticated: ${debugInfo.authenticated}
User: ${debugInfo.user?.username || 'none'}
Is Admin: ${debugInfo.isAdmin}
Session Fresh: ${debugInfo.sessionFresh}
Activity Fresh: ${debugInfo.activityFresh}
Session Expired: ${debugInfo.sessionExpired}

Revisar consola para más detalles.`);
    }
  }

  public isDevelopment(): boolean {
    const h = window.location.hostname;
    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h.includes('stackblitz') ||
      h.includes('codesandbox') ||
      h.includes('github.dev')
    );
  }
}