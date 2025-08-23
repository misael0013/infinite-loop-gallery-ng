import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <h1>404</h1>
        <h2>Página no encontrada</h2>
        <p>Lo sentimos, la página que buscas no existe o ha sido movida.</p>
        <div class="actions">
          <button [routerLink]="['/']" class="btn btn-primary">Ir al inicio</button>
          <button [routerLink]="['/galeria']" class="btn btn-secondary">Ver galería</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      text-align: center;
    }
    
    .not-found-content h1 {
      font-size: 6rem;
      font-weight: bold;
      color: #ff6b6b;
      margin-bottom: 1rem;
    }
    
    .not-found-content h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: var(--text-color);
    }
    
    .not-found-content p {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      color: var(--text-secondary);
      max-width: 500px;
    }
    
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s ease;
    }
    
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #0056b3;
    }
    
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    
    .btn-secondary:hover {
      background-color: #545b62;
    }
  `]
})
export class NotFoundComponent {}