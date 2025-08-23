import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy, 
  signal, 
  computed,
  inject,
  DestroyRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SlideshowComponent, SlideItem } from '../../shared/components/slideshow/slideshow.component';
import { AlbumsService } from '../../core/services/albums.service';
import { Album } from '../../core/models/album.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, SlideshowComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush // ⚡ Máxima optimización de performance
})
export class HomeComponent implements OnInit, OnDestroy {
  // 🚀 Dependency injection moderna con inject()
  private albumsService = inject(AlbumsService);
  private destroyRef = inject(DestroyRef);

  // 📊 Signals para máxima performance y reactividad
  private _isLoading = signal(true);
  private _featuredAlbum = signal<Album | undefined>(undefined);
  private _recentAlbums = signal<Album[]>([]);
  private _slides = signal<SlideItem[]>([]);
  private _error = signal<string | null>(null);

  // 🔗 Computed signals - se actualizan automáticamente cuando cambian las dependencias
  readonly isLoading = this._isLoading.asReadonly();
  readonly featuredAlbum = this._featuredAlbum.asReadonly();
  readonly recentAlbums = this._recentAlbums.asReadonly();
  readonly slides = this._slides.asReadonly();
  readonly error = this._error.asReadonly();

  // 🎯 Título que se actualiza automáticamente
  readonly featuredTitle = computed(() => {
    const album = this._featuredAlbum();
    return album ? album.title.toUpperCase() : this.getDefaultTitle();
  });

  // 🔗 Slug que se actualiza con el álbum destacado
  readonly slugDestacado = computed(() => this._featuredAlbum()?.id || '1');

  // 🖼️ Imagen hero con lazy loading
  readonly heroUrl = 'assets/slideshow/hero.jpg';

  // ⚡ Propiedades de optimización
  private imagePreloadQueue: string[] = [];
  private isMobile = false;

  async ngOnInit(): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);
      
      // 📱 Detectar tipo de dispositivo una sola vez
      this.isMobile = this.detectMobileDevice();
      
      // 🚀 Cargar contenido optimizado según dispositivo
      await this.loadContent();
      
      // 🖼️ Precargar imágenes críticas en background
      this.scheduleImagePreload();
      
    } catch (error) {
      console.error('❌ Error loading home content:', error);
      this._error.set('Error al cargar el contenido');
      await this.loadFallbackContent();
    } finally {
      this._isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    // 🧹 Limpiar cache automáticamente al destruir componente
    this.albumsService.clearImageCache();
  }

  // ═══════════════════════════════════════════════════════════════
  // 🚀 MÉTODOS PRINCIPALES DE CARGA
  // ═══════════════════════════════════════════════════════════════

  /**
   * 📊 Carga principal de contenido optimizada
   */
  private async loadContent(): Promise<void> {
    const albums = this.albumsService.albums();
    
    if (albums.length > 0) {
      await Promise.all([
        this.loadFeaturedContent(albums),
        this.loadRecentWork(albums)
      ]);
    } else {
      await this.loadFallbackContent();
    }
  }

  /**
   * ⭐ Cargar contenido destacado con optimización por dispositivo
   */
  private async loadFeaturedContent(albums: Album[]): Promise<void> {
    const featured = albums[0];
    this._featuredAlbum.set(featured);
    
    // 📱 Ajustar cantidad de slides según dispositivo
    const maxSlides = this.isMobile ? 4 : featured.images.length;
    const imageSize = this.isMobile ? 'medium' : 'large';
    
    // 🖼️ Crear slides con URLs optimizadas
    const slideItems: SlideItem[] = featured.images
      .slice(0, maxSlides)
      .map((image, index) => ({
        src: this.albumsService.getOptimizedImageUrl(image, imageSize),
        alt: `${featured.title} - Imagen ${index + 1}`
      }));
    
    this._slides.set(slideItems);
    
    // 🚀 Precargar imágenes del álbum destacado en background
    this.albumsService.preloadAlbumImages(featured.id, imageSize);
  }

  /**
   * 📰 Cargar trabajos recientes optimizados
   */
  private async loadRecentWork(albums: Album[]): Promise<void> {
    const featuredId = this._featuredAlbum()?.id || '';
    const maxRecent = this.isMobile ? 3 : 6;
    
    const recent = this.albumsService.getRecentAlbums(featuredId, maxRecent);
    this._recentAlbums.set(recent);
    
    // 🖼️ Precargar thumbnails de trabajos recientes en batch
    const thumbnailUrls = recent
      .map(album => album.coverImage || album.images[0])
      .filter(Boolean);
    
    if (thumbnailUrls.length > 0) {
      this.albumsService.batchProcessImages(thumbnailUrls, 'thumbnail');
    }
  }
trackByAlbumId = (_: number, album: Album) => album.id;

  /**
   * 🔄 Contenido de respaldo para cuando no hay datos
   */
  private async loadFallbackContent(): Promise<void> {
    // 🖼️ Slides de demostración (menos en móvil)
    const allSlides = [
      { src: 'assets/slideshow/DSC05127.jpg', alt: 'Retrato nocturno 1' },
      { src: 'assets/slideshow/DSC05119.jpg', alt: 'Retrato nocturno 2' },
      { src: 'assets/slideshow/DSC05145.jpg', alt: 'Retrato nocturno 3' },
      { src: 'assets/slideshow/DSC05156.jpg', alt: 'Retrato nocturno 4' },
      { src: 'assets/slideshow/DSC05196.jpg', alt: 'Retrato nocturno 5' },
    ];
    
    const slides = this.isMobile ? allSlides.slice(0, 3) : allSlides;
    this._slides.set(slides);
    
    // 📱 Álbumes de demostración optimizados
    const demoAlbums: Album[] = [
      {
        id: 'urban-nights',
        title: 'Urban Nights',
        description: 'Exploración nocturna con luces dramáticas de la ciudad',
        images: ['assets/slideshow/DSC05119.jpg', 'assets/slideshow/DSC05145.jpg'],
        coverImage: 'assets/slideshow/DSC05119.jpg',
        date: new Date('2024-01-15'),
        createdAt: new Date('2024-01-15'),
        category: 'night',
        views: 320,
        uniqueViews: 210,
        tags: ['nocturno', 'urbano']
      },
      {
        id: 'studio-magic',
        title: 'Studio Magic',
        description: 'Retratos íntimos con iluminación profesional y conceptos únicos',
        images: ['assets/slideshow/DSC05196.jpg', 'assets/slideshow/DSC05416.jpg'],
        coverImage: 'assets/slideshow/DSC05196.jpg',
        date: new Date('2024-01-10'),
        createdAt: new Date('2024-01-10'),
        category: 'studio',
        views: 180,
        uniqueViews: 145,
        tags: ['estudio', 'retrato']
      },
      {
        id: 'golden-moments',
        title: 'Golden Moments',
        description: 'Capturando la magia de la hora dorada perfecta',
        images: ['assets/slideshow/DSC05445.jpg', 'assets/slideshow/hero.jpg'],
        coverImage: 'assets/slideshow/DSC05445.jpg',
        date: new Date('2024-01-05'),
        createdAt: new Date('2024-01-05'),
        category: 'outdoor',
        views: 150,
        uniqueViews: 120,
        tags: ['natural', 'dorado']
      }
    ];
    
    // 📱 Limitar álbumes en móvil
    const albums = this.isMobile ? demoAlbums.slice(0, 2) : demoAlbums;
    this._recentAlbums.set(albums);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🖼️ MÉTODOS DE OPTIMIZACIÓN DE IMÁGENES
  // ═══════════════════════════════════════════════════════════════

  /**
   * 🚀 Programa precarga de imágenes críticas en background
   */
  private scheduleImagePreload(): void {
    // 🎯 Usar requestIdleCallback para no bloquear el hilo principal
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.preloadCriticalImages());
    } else {
      // Fallback para navegadores sin soporte
      setTimeout(() => this.preloadCriticalImages(), 100);
    }
  }

  /**
   * 🎯 Precargar solo las imágenes más críticas
   */
  private preloadCriticalImages(): void {
    const featured = this._featuredAlbum();
    const recent = this._recentAlbums();
    
    this.imagePreloadQueue = [];
    
    // 🎯 Prioridad 1: Primera imagen del slideshow
    if (featured && featured.images.length > 0) {
      this.imagePreloadQueue.push(featured.images[0]);
    }
    
    // 📰 Prioridad 2: Covers de trabajos recientes (solo los primeros 2)
    const criticalCovers = recent
      .slice(0, 2)
      .map(album => album.coverImage || album.images[0])
      .filter(Boolean);
    
    this.imagePreloadQueue.push(...criticalCovers);
    
    // 🚀 Procesar cola de forma no bloqueante
    this.processPreloadQueue();
  }

  /**
   * ⚡ Procesar cola de precarga sin bloquear el hilo principal
   */
  private async processPreloadQueue(): Promise<void> {
    while (this.imagePreloadQueue.length > 0) {
      const url = this.imagePreloadQueue.shift();
      if (url) {
        try {
          // 🚀 Usar el método optimizado del servicio
          this.albumsService.getOptimizedImageUrl(url, this.isMobile ? 'medium' : 'large');
          
          // ⏸️ Pausa micro para no bloquear
          await new Promise(resolve => setTimeout(resolve, 10));
        } catch (error) {
          console.warn('⚠️ Failed to preload:', url);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 🛠️ MÉTODOS DE UTILIDAD
  // ═══════════════════════════════════════════════════════════════

  /**
   * 📱 Detectar dispositivo móvil de forma eficiente
   */
  private detectMobileDevice(): boolean {
    return window.innerWidth < 768 || 
           /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * 🎯 Obtener título dinámico que rota cada 6 horas
   */
  private getDefaultTitle(): string {
    const titles = [
      'LATEST COLLECTION',
      'FEATURED GALLERY',
      'NEW CAPTURES', 
      'RECENT WORK',
      'NIGHT PHOTOGRAPHY',
      'ARTISTIC PORTRAITS'
    ];
    
    const index = Math.floor(Date.now() / (1000 * 60 * 60 * 6)) % titles.length;
    return titles[index];
  }

  /**
   * 📅 Formatear fecha de forma optimizada
   */
  formatDate(date: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 🚀 Casos más comunes primero para mejor performance
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
    }
    
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short' 
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 🎯 MÉTODOS PÚBLICOS PARA TEMPLATE
  // ═══════════════════════════════════════════════════════════════

  /**
   * 📊 Track clicks para analytics (opcional)
   */
  onWorkClick(albumId: string): void {
    if (this.isDevelopment()) {
      console.log(`📊 Album clicked: ${albumId}`);
    }
    // Aquí podrías agregar tracking analytics
  }

  /**
   * 🔄 Reintentar carga en caso de error
   */
  async retryLoad(): Promise<void> {
    this._error.set(null);
    await this.ngOnInit();
  }

  /**
   * 📊 Obtener info de performance (desarrollo)
   */
  getPerformanceInfo(): any {
    if (!this.isDevelopment()) return null;
    
    return {
      isMobile: this.isMobile,
      cacheInfo: this.albumsService.getImageCacheInfo(),
      slidesCount: this._slides().length,
      recentAlbumsCount: this._recentAlbums().length,
      preloadQueue: this.imagePreloadQueue.length
    };
  }

  /**
   * 🔍 Verificar si estamos en desarrollo
   */
  private isDevelopment(): boolean {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
}