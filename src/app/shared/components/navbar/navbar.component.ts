import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  private routerSubscription?: Subscription;

  // Triple click admin (solo dev)
  private brandClickCount = 0;
  private brandClickTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    public themeService: ThemeService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => this.closeMobileMenu());

    this.authService.validateSession();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    if (this.brandClickTimeout) clearTimeout(this.brandClickTimeout);
    document.body.style.overflow = 'auto';
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (window.innerWidth >= 768 && this.isMobileMenuOpen) this.closeMobileMenu();
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isMobileMenuOpen) this.closeMobileMenu();
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

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : 'auto';
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = 'auto';
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  get isDarkMode(): boolean {
    return this.themeService.theme() === 'dark';
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

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
    if (this.authService.isAdmin()) {
      this.router.navigate(['/admin']);
      return;
    }
    this.goToLogin();
  }

  private goToLogin(): void {
    this.router.navigate(['/admin/login'], { queryParams: { returnUrl: '/admin' } });
  }

  onLogout(): void {
    if (confirm('¿Cerrar sesión de administrador?')) {
      this.authService.logout();
      this.router.navigate(['/']);
    }
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      this.closeMobileMenu();
    }
  }

  /** Público para poder llamarlo en la plantilla */
  public isDevelopment(): boolean {
    const h = window.location.hostname;
    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h.includes('stackblitz') ||
      h.includes('codesandbox')
    );
  }

  debugAuthState(): void {
    if (this.isDevelopment()) {
      console.log('🔐 Auth State:', {
        isAuthenticated: this.authService.authenticated(),
        isAdmin: this.authService.isAdmin(),
        user: this.authService.getCurrentUser()
      });
    }
  }

  get currentUsername(): string {
    const user = this.authService.getCurrentUser();
    return user?.username || 'Usuario';
  }
}
