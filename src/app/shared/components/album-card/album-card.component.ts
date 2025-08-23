import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Album } from '../../../core/models/album.model';

@Component({
  selector: 'app-album-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './album-card.component.html',
  styleUrls: ['./album-card.component.scss']
})
export class AlbumCardComponent {
  @Input({ required: true }) album!: Album;

  // Método para formatear el número de vistas
  formatViews(views: number | undefined): string {
    if (!views || views === 0) {
      return '0';
    }
    
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  // Método para formatear fechas
  formatDate(date: Date | undefined): string {
    if (!date) return '';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Hace 1 día';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? 'Hace 1 semana' : `Hace ${weeks} semanas`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long' 
      });
    }
  }

  // Método para obtener la imagen de portada
  getCoverImage(): string {
    return this.album.coverImage || this.album.images[0] || '';
  }

  // Método para manejar errores de carga de imagen
  onImageError(event: any): void {
    console.warn('Error loading image:', event.target.src);
    // Podrías establecer una imagen de placeholder aquí
    // event.target.src = 'assets/placeholder.jpg';
  }

  // Método para manejar click en la card (opcional para tracking)
  onCardClick(): void {
    // Aquí podrías agregar tracking de clicks
    console.log(`Album clicked: ${this.album.id}`);
  }
}