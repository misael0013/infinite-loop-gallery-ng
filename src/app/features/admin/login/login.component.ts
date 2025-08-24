import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { Subscription } from 'rxjs';

interface LoginMessage {
  type: 'info' | 'warning' | 'error' | 'success';
  text: string;
  icon: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-wrapper">
        <!-- 🔙 Back button -->
        <button 
          class="back-link" 
          (click)="onCancel()" 
          type="button"
          [disabled]="isLoading">
          ← Volver
        </button>

        <div class="login-card">
          <!-- 🔐 Header -->
          <div class="login-header">
            <div class="login-icon">🔐</div>
            <h1>Acceso Administrador</h1>
            <p *ngIf="!sessionMessage">Introduce tus credenciales para continuar</p>
          </div>

          <!-- 🔔 Session message (expired, inactive, etc.) -->
          <div 
            *ngIf="sessionMessage" 
            class="session-message"
            [class]="'message-' + sessionMessage.type">
            <span class="message-icon">{{ sessionMessage.icon }}</span>
            <span class="message-text">{{ sessionMessage.text }}</span>
          </div>

          <!-- 📝 Login Form -->
          <form 
            #loginForm="ngForm" 
            id="loginForm"
            (ngSubmit)="onSubmit(loginForm)" 
            autocomplete="on"
            novalidate
            class="login-form">
            
            <!-- 👤 Username field -->
            <div class="form-group">
              <label for="username">Usuario</label>
              <input
                #usernameInput
                id="username"
                name="username"
                type="text"
                [(ngModel)]="credentials.username"
                #usernameModel="ngModel"
                required
                autocomplete="username"
                [disabled]="isLoading"
                (keydown)="onInputKeydown($event)"
                (input)="clearErrorMessage()"
                class="form-input"
                [class.error]="usernameModel.invalid && usernameModel.touched"
                placeholder="Ingresa tu usuario" />
              
              <div class="field-error" *ngIf="usernameModel.invalid && usernameModel.touched">
                <span class="error-icon">⚠️</span>
                El usuario es requerido
              </div>
            </div>

            <!-- 🔑 Password field -->
            <div class="form-group">
              <label for="password">Contraseña</label>
              <div class="password-input-wrapper">
                <input
                  #passwordInput
                  id="password"
                  name="password"
                  [type]="showPassword ? 'text' : 'password'"
                  [(ngModel)]="credentials.password"
                  #passwordModel="ngModel"
                  required
                  autocomplete="current-password"
                  [disabled]="isLoading"
                  (keydown)="onInputKeydown($event)"
                  (input)="clearErrorMessage()"
                  class="form-input"
                  [class.error]="passwordModel.invalid && passwordModel.touched"
                  placeholder="Ingresa tu contraseña" />
                
                <button
                  type="button"
                  class="password-toggle"
                  (click)="togglePasswordVisibility()"
                  [disabled]="isLoading"
                  [title]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  {{ showPassword ? '🙈' : '👁️' }}
                </button>
              </div>
              
              <div class="field-error" *ngIf="passwordModel.invalid && passwordModel.touched">
                <span class="error-icon">⚠️</span>
                La contraseña es requerida
              </div>
            </div>

            <!-- ⚠️ Error message -->
            <div class="error-message" *ngIf="errorMessage" role="alert">
              <span class="error-icon">❌</span>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- 🎯 Action buttons -->
            <div class="button-row">
              <button
                type="button"
                class="btn btn-outline"
                (click)="onCancel()"
                [disabled]="isLoading">
                Cancelar
              </button>
              
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="!loginForm.form.valid || isLoading">
                <span *ngIf="!isLoading" class="btn-content">
                  <span class="btn-icon">🚀</span>
                  <span>Iniciar Sesión</span>
                </span>
                <span *ngIf="isLoading" class="btn-loading">
                  <span class="spinner"></span>
                  Verificando...
                </span>
              </button>
            </div>
          </form>

          <!-- 🔧 Development info -->
          <div class="login-footer" *ngIf="isDevelopment()">
            <div class="demo-credentials">
              <div class="demo-header">
                <span class="demo-icon">🧪</span>
                <strong>Credenciales de prueba:</strong>
              </div>
              <div class="demo-info">
                <div class="credential-row">
                  <span class="credential-label">Usuario:</span>
                  <code (click)="fillCredential('username', 'admin')">admin</code>
                </div>
                <div class="credential-row">
                  <span class="credential-label">Contraseña:</span>
                  <code (click)="fillCredential('password', 'admin123')">admin123</code>
                </div>
              </div>
              <div class="demo-tip">
                💡 Haz click en las credenciales para autocompletar
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #1a1a1a 100%);
      background-attachment: fixed;
      padding: 20px;
      position: relative;
      overflow-y: auto;
    }

    .login-wrapper {
      position: relative;
      width: 100%;
      max-width: 420px;
    }

    .back-link {
      position: absolute;
      top: -60px;
      left: 0;
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      font-size: 1rem;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover:not(:disabled) {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
        transform: translateX(-4px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .login-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      transition: all 0.3s ease;

      &:hover {
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 25px 70px rgba(0, 0, 0, 0.6);
      }
    }

    .login-header {
      text-align: center;
      margin-bottom: 32px;

      .login-icon {
        font-size: 2.5rem;
        margin-bottom: 16px;
        opacity: 0.9;
      }

      h1 {
        color: #ffffff;
        font-size: 1.8rem;
        font-weight: 700;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }

      p {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.95rem;
        margin: 0;
      }
    }

    .session-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      margin-bottom: 24px;
      font-size: 0.9rem;
      font-weight: 500;

      .message-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
      }

      .message-text {
        flex: 1;
      }

      &.message-warning {
        background: rgba(245, 158, 11, 0.1);
        border: 1px solid rgba(245, 158, 11, 0.3);
        color: #fbbf24;
      }

      &.message-error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #f87171;
      }

      &.message-info {
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.3);
        color: #60a5fa;
      }
    }

    .form-group {
      margin-bottom: 24px;

      label {
        display: block;
        color: #ffffff;
        font-weight: 600;
        margin-bottom: 8px;
        font-size: 0.9rem;
        letter-spacing: 0.3px;
      }
    }

    .form-input {
      width: 100%;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      color: #ffffff;
      font-size: 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
      }

      &.error {
        border-color: rgba(239, 68, 68, 0.5);
        background: rgba(239, 68, 68, 0.05);
      }

      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      .form-input {
        padding-right: 48px;
      }

      .password-toggle {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        font-size: 0.9rem;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.1);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }
    }

    .field-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #f87171;
      font-size: 0.8rem;
      margin-top: 6px;
      padding: 4px 0;

      .error-icon {
        font-size: 0.9rem;
      }
    }

    .error-message {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 24px;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 8px;

      .error-icon {
        flex-shrink: 0;
      }
    }

    .button-row {
      display: flex;
      gap: 12px;
      margin-top: 32px;
    }

    .btn {
      flex: 1;
      padding: 14px 20px;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      min-height: 48px;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
      }

      &.btn-outline {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
        border: 2px solid rgba(255, 255, 255, 0.2);

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-1px);
        }
      }

      &.btn-primary {
        background: linear-gradient(135deg, #ffffff 0%, #e5e5e5 100%);
        color: #000000;
        border: 2px solid transparent;

        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 255, 255, 0.25);
          background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
        }

        &:active:not(:disabled) {
          transform: translateY(-1px);
        }
      }
    }

    .btn-content {
      display: flex;
      align-items: center;
      gap: 8px;

      .btn-icon {
        font-size: 0.9rem;
      }
    }

    .btn-loading {
      display: flex;
      align-items: center;
      gap: 10px;

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0, 0, 0, 0.3);
        border-top: 2px solid #000000;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .login-footer {
      margin-top: 32px;
      text-align: center;

      .demo-credentials {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        
        .demo-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;

          .demo-icon {
            font-size: 1rem;
          }
        }

        .demo-info {
          margin-bottom: 12px;

          .credential-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;

            .credential-label {
              color: rgba(255, 255, 255, 0.7);
              font-size: 0.85rem;
            }

            code {
              background: rgba(255, 255, 255, 0.1);
              color: #10b981;
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 0.85rem;
              cursor: pointer;
              transition: all 0.2s ease;

              &:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #34d399;
                transform: scale(1.05);
              }
            }
          }
        }

        .demo-tip {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
          font-style: italic;
        }
      }
    }

    /* 📱 Mobile adjustments */
    @media (max-width: 480px) {
      .login-container {
        padding: 16px;
      }

      .login-card {
        padding: 24px;
      }

      .back-link {
        position: static;
        margin-bottom: 20px;
        align-self: flex-start;
      }

      .button-row {
        flex-direction: column;
      }
    }

    /* 🌓 Light theme adjustments */
    [data-theme="light"] {
      .login-container {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%);
      }

      .login-card {
        background: rgba(255, 255, 255, 0.7);
        border-color: rgba(0, 0, 0, 0.1);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      }

      .login-header h1 {
        color: #1e293b;
      }

      .login-header p {
        color: rgba(0, 0, 0, 0.6);
      }

      .form-group label {
        color: #1e293b;
      }

      .form-input {
        background: rgba(0, 0, 0, 0.05);
        border-color: rgba(0, 0, 0, 0.2);
        color: #1e293b;

        &::placeholder {
          color: rgba(0, 0, 0, 0.5);
        }
      }

      .back-link {
        color: rgba(0, 0, 0, 0.7);

        &:hover:not(:disabled) {
          color: #000000;
          background: rgba(0, 0, 0, 0.1);
        }
      }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('usernameInput', { static: false }) usernameInput!: ElementRef<HTMLInputElement>;

  credentials = {
    username: '',
    password: ''
  };

  errorMessage = '';
  isLoading = false;
  showPassword = false;
  returnUrl = '/admin';
  sessionMessage: LoginMessage | null = null;

  private routeSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // 🔍 Obtener parámetros de la URL
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/admin';
      
      // 🔔 Mostrar mensaje según el motivo
      const message = params['message'];
      this.setSessionMessage(message);
    });

    // 🚫 Redirigir si ya está autenticado
    if (this.authService.checkAuth() && this.authService.validateSession()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  ngAfterViewInit(): void {
    // 🎯 Auto-focus en el campo de usuario después de un pequeño delay
    setTimeout(() => {
      if (this.usernameInput) {
        this.usernameInput.nativeElement.focus();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  // ════════════════════════════════════════════════════════════════
  // 🔐 AUTHENTICATION METHODS
  // ════════════════════════════════════════════════════════════════

  onSubmit(form: NgForm): void {
    if (!form.valid) {
      this.markFormGroupTouched(form);
      return;
    }

    if (!this.credentials.username.trim() || !this.credentials.password.trim()) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.performLogin();
  }

  private performLogin(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.sessionMessage = null;

    // 🕐 Simular delay de red realista
    const delay = this.isDevelopment() ? 800 : 1200;

    setTimeout(() => {
      try {
        const success = this.authService.login(
          this.credentials.username.trim(),
          this.credentials.password
        );

        this.isLoading = false;

        if (success) {
          console.log('✅ Login successful, redirecting to:', this.returnUrl);
          this.router.navigate([this.returnUrl]);
        } else {
          this.handleLoginError();
        }
      } catch (error) {
        this.isLoading = false;
        console.error('❌ Login error:', error);
        this.errorMessage = 'Error interno. Inténtalo de nuevo.';
      }
    }, delay);
  }

  private handleLoginError(): void {
    this.errorMessage = 'Usuario o contraseña incorrectos';
    this.credentials.password = '';
    
    // 🎯 Focus en el campo de contraseña para reintento
    setTimeout(() => {
      const passwordInput = document.getElementById('password') as HTMLInputElement;
      if (passwordInput) {
        passwordInput.focus();
      }
    }, 100);

    // 🔄 Limpiar error automáticamente después de unos segundos
    setTimeout(() => {
      if (this.errorMessage === 'Usuario o contraseña incorrectos') {
        this.errorMessage = '';
      }
    }, 5000);
  }

  private setSessionMessage(messageType: string): void {
    switch (messageType) {
      case 'session-expired':
        this.sessionMessage = {
          type: 'warning',
          icon: '⏰',
          text: 'Tu sesión ha expirado. Inicia sesión nuevamente para continuar.'
        };
        break;
      case 'session-inactive':
        this.sessionMessage = {
          type: 'info',
          icon: '💤',
          text: 'Sesión cerrada por inactividad. Vuelve a iniciar sesión.'
        };
        break;
      case 'unauthorized':
        this.sessionMessage = {
          type: 'error',
          icon: '🚫',
          text: 'Acceso no autorizado. Se requiere autenticación.'
        };
        break;
      default:
        this.sessionMessage = null;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 🎛️ UI INTERACTION METHODS
  // ════════════════════════════════════════════════════════════════

  onCancel(): void {
    if (this.isLoading) return;
    
    this.router.navigate(['/']);
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.isLoading) {
      event.preventDefault();
      
      // Si estamos en username, mover al password
      if (event.target === this.usernameInput?.nativeElement && this.credentials.username.trim()) {
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
        }
      } else if (this.credentials.username.trim() && this.credentials.password.trim()) {
        // Si ambos campos están llenos, hacer submit
        const form = document.getElementById('loginForm') as HTMLFormElement;
        if (form) {
          form.dispatchEvent(new Event('submit'));
        }
      }
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  clearErrorMessage(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  fillCredential(field: 'username' | 'password', value: string): void {
    if (!this.isDevelopment() || this.isLoading) return;

    this.credentials[field] = value;
    this.clearErrorMessage();

    // 🎯 Auto focus en el siguiente campo
    if (field === 'username') {
      setTimeout(() => {
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        if (passwordInput) {
          passwordInput.focus();
        }
      }, 100);
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 🔧 UTILITY METHODS
  // ════════════════════════════════════════════════════════════════

  private markFormGroupTouched(form: NgForm): void {
    Object.keys(form.controls).forEach(key => {
      const control = form.controls[key];
      control.markAsTouched();
    });
  }

  isDevelopment(): boolean {
    const hostname = window.location.hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.includes('stackblitz') ||
      hostname.includes('codesandbox') ||
      hostname.includes('github.dev')
    );
  }
}