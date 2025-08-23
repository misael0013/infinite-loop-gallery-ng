import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AlbumsService } from '../../core/services/albums.service';
import { ViewsService } from '../../core/services/views/views.service';
import { Album } from '../../core/models/album.model';

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [CommonModule, RouterModule], // Add RouterModule for routerLink
  templateUrl: './album-detail.component.html',
  styleUrls: ['./album-detail.component.scss']
})
export class AlbumDetailComponent implements OnInit, OnDestroy {
  album: Album | undefined;
  loading = true; // Keep as loading, but add isLoading getter
  error = false;
  currentImageIndex = 0;
  
  // Add missing lightbox properties
  isLightboxOpen = false;
  selectedImageIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private albumsService: AlbumsService,
    private viewsService: ViewsService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const albumId = params['id'];
      if (albumId) {
        this.loadAlbum(albumId);
      }
    });
  }

  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

  // Add getter for template compatibility
  get isLoading(): boolean {
    return this.loading;
  }

  private loadAlbum(id: string): void {
    this.loading = true;
    this.error = false;

    try {
      this.album = this.albumsService.getAlbumById(id);
      
      if (this.album) {
        // Registrar vista del álbum
        this.viewsService.recordView(id);
        
        // Incrementar contador de vistas en el servicio de álbumes
        this.albumsService.incrementViews(id);
        
        this.loading = false;
      } else {
        this.error = true;
        this.loading = false;
      }
    } catch (error) {
      console.error('Error loading album:', error);
      this.error = true;
      this.loading = false;
    }
  }

  // Add missing keyboard handler
  onKeydown(event: KeyboardEvent): void {
    if (!this.isLightboxOpen) return;
    
    switch (event.key) {
      case 'Escape':
        this.closeLightbox();
        break;
      case 'ArrowLeft':
        this.prevImage();
        break;
      case 'ArrowRight':
        this.nextImage();
        break;
    }
  }

  // Add missing lightbox methods
  openLightbox(index: number): void {
    this.selectedImageIndex = index;
    this.isLightboxOpen = true;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeLightbox(): void {
    this.isLightboxOpen = false;
    document.body.style.overflow = 'auto'; // Restore scrolling
  }

  // Add missing related albums method
  getRelatedAlbums(): Album[] {
    if (!this.album) return [];
    
    // Get albums with similar tags or category
    const allAlbums = this.albumsService.albums();
    return allAlbums
      .filter(a => a.id !== this.album!.id)
      .filter(a => {
        // Filter by similar category or tags
        if (this.album!.category && a.category === this.album!.category) return true;
        if (this.album!.tags && a.tags) {
          return a.tags.some(tag => this.album!.tags?.includes(tag));
        }
        return false;
      })
      .slice(0, 3); // Limit to 3 related albums
  }

  // Navegación de imágenes - Update to work with lightbox
  nextImage(): void {
    if (this.album && this.selectedImageIndex < this.album.images.length - 1) {
      this.selectedImageIndex++;
    } else if (this.album) {
      this.selectedImageIndex = 0; // Loop back to first
    }
  }

  prevImage(): void {
    if (this.selectedImageIndex > 0) {
      this.selectedImageIndex--;
    } else if (this.album) {
      this.selectedImageIndex = this.album.images.length - 1; // Loop to last
    }
  }

  goToImage(index: number): void {
    if (this.album && index >= 0 && index < this.album.images.length) {
      this.currentImageIndex = index;
    }
  }

  // Funciones de utilidad
  canGoNext(): boolean {
    return this.album ? this.currentImageIndex < this.album.images.length - 1 : false;
  }

  canGoPrev(): boolean {
    return this.currentImageIndex > 0;
  }

  getCurrentImage(): string {
    return this.album ? this.album.images[this.currentImageIndex] : '';
  }

  // Navegación
  goBack(): void {
    this.router.navigate(['/galeria']);
  }

  goToGallery(): void {
    this.router.navigate(['/galeria']);
  }

  // Formateo de datos
  formatViews(views: number | undefined): string {
    if (!views) return '0';
    
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }

  // Obtener vistas actualizadas del servicio
  getTotalViews(): number {
    return this.album ? this.viewsService.getTotalViews(this.album.id) : 0;
  }

  getUniqueViews(): number {
    return this.album ? this.viewsService.getUniqueViews(this.album.id) : 0;
  }

  // Compartir álbum
  shareAlbum(): void {
    if (this.album && navigator.share) {
      navigator.share({
        title: this.album.title,
        text: this.album.description,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copiar URL al clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          // Podrías mostrar un toast o mensaje aquí
          console.log('URL copiada al portapapeles');
        })
        .catch(err => console.log('Error copying to clipboard:', err));
    }
  }
}