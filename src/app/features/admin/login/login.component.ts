import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Admin Login</h1>
          <p>Accede al panel de administración</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm" class="login-form">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input 
              type="text" 
              id="username" 
              name="username"
              [(ngModel)]="credentials.username"
              required
              autocomplete="username"
              class="form-input"
              placeholder="Ingresa tu usuario"
            />
          </div>
          
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              [(ngModel)]="credentials.password"
              required
              autocomplete="current-password"
              class="form-input"
              placeholder="Ingresa tu contraseña"
            />
          </div>
          
          <div class="error-message" *ngIf="errorMessage">
            {{ errorMessage }}
          </div>
          
          <button 
            type="submit" 
            class="login-btn"
            [disabled]="!loginForm.form.valid || isLoading"
          >
            <span *ngIf="isLoading">Verificando...</span>
            <span *ngIf="!isLoading">Iniciar Sesión</span>
          </button>
        </form>
        
        <div class="login-footer">
          <p class="demo-credentials">
            <strong>Demo credentials:</strong><br>
            Usuario: admin<br>
            Contraseña: admin123
          </p>
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
      background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
      padding: 20px;
    }
    
    .login-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      backdrop-filter: blur(10px);
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 32px;
      
      h1 {
        color: #ffffff;
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 8px;
      }
      
      p {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
      }
    }
    
    .form-group {
      margin-bottom: 20px;
      
      label {
        display: block;
        color: #ffffff;
        font-weight: 500;
        margin-bottom: 8px;
        font-size: 0.9rem;
      }
    }
    
    .form-input {
      width: 100%;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: #ffffff;
      font-size: 1rem;
      transition: all 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.15);
      }
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
    }
    
    .error-message {
      background: rgba(255, 0, 0, 0.1);
      border: 1px solid rgba(255, 0, 0, 0.3);
      color: #ff6b6b;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 0.9rem;
      text-align: center;
    }
    
    .login-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
      color: #000000;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(255, 255, 255, 0.2);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
    }
    
    .login-footer {
      margin-top: 32px;
      text-align: center;
      
      .demo-credentials {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 16px;
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
      }
    }
    
    @media (max-width: 480px) {
      .login-card {
        padding: 24px;
      }
    }
  `]
})
export class LoginComponent {
  credentials = {
    username: '',
    password: ''
  };
  
  errorMessage = '';
  isLoading = false;
  returnUrl = '/admin';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Obtener URL de retorno si existe
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
  }

  onSubmit(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Por favor ingresa usuario y contraseña';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Simular delay de red
    setTimeout(() => {
      const success = this.authService.login(
        this.credentials.username,
        this.credentials.password
      );

      this.isLoading = false;

      if (success) {
        this.router.navigate([this.returnUrl]);
      } else {
        this.errorMessage = 'Usuario o contraseña incorrectos';
        this.credentials.password = ''; // Limpiar contraseña
      }
    }, 500);
  }
}