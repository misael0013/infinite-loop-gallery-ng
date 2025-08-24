import { Injectable, signal, computed } from '@angular/core';
import { Album } from '../models/album.model';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ImageVariants {
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
}

export interface ImageUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  processedUrl?: string;
}

export interface StorageStats {
  totalImages: number;
  totalSize: string;
  cacheSize: string;
  albumsCount: number;
  lastCleanup: Date;
}

const LS_KEY = 'ilg.albums.v2';
const CACHE_KEY = 'ilg.image.cache.v2';
const STORAGE_STATS_KEY = 'ilg.storage.stats.v1';

@Injectable({ providedIn: 'root' })
export class AlbumsService {
  prepareImageElement(img: HTMLImageElement, appLazyImage: string, imageSize: string) {
    throw new Error('Method not implemented.');
  }
  // 🖼️ Configuración de tamaños
  private readonly UNIVERSAL_SIZES = {
    thumbnail: { width: 400, height: 400, quality: 0.75, format: 'jpeg' as const },
    medium: { width: 800, height: 800, quality: 0.82, format: 'jpeg' as const },
    large: { width: 1200, height: 1200, quality: 0.88, format: 'jpeg' as const }
  };

  // 💾 Cache mejorado con metadata
  private imageCache = new Map<string, {
    url: string;
    size: number;
    timestamp: number;
    format: string;
  }>();
  
  private loadingPromises = new Map<string, Promise<string>>();
  
  // 📊 Observables para uploads y progreso
  private uploadProgress = new BehaviorSubject<Map<string, ImageUploadProgress>>(new Map());
  private storageStats = new BehaviorSubject<StorageStats>({
    totalImages: 0,
    totalSize: '0 MB',
    cacheSize: '0 MB',
    albumsCount: 0,
    lastCleanup: new Date()
  });

  // 🎯 Albums data con signals
  private albumsData = signal<Album[]>(this.getDefaultAlbums());

  // 📈 Computed stats
  public readonly albums = this.albumsData.asReadonly();
  public readonly totalAlbums = computed(() => this.albumsData().length);
  public readonly totalImages = computed(() => 
    this.albumsData().reduce((total, album) => total + album.images.length, 0)
  );

  // 🔄 Observables públicos
  public readonly uploadProgress$ = this.uploadProgress.asObservable();
  public readonly storageStats$ = this.storageStats.asObservable();

  constructor() {
    this.initializeService();
  }

  // ═══════════════════════════════════════════════════════════════
  // 🚀 INICIALIZACIÓN
  // ═══════════════════════════════════════════════════════════════

  private initializeService(): void {
    this.loadAlbumsFromStorage();
    this.loadImageCache();
    this.updateStorageStats();
    this.schedulePeriodicCleanup();
  }

  private getDefaultAlbums(): Album[] {
    return [
      {
        id: '1',
        title: 'Night Portraits',
        description: 'Una colección íntima de retratos nocturnos que exploran la interacción entre luz artificial y sombras naturales.',
        category: 'portraits',
        featured: true,
        tags: ['retratos', 'nocturno', 'urbano', 'drama'],
        location: 'Puerto Rico',
        views: 1250,
        uniqueViews: 890,
        images: [
          'assets/slideshow/DSC05127.jpg',
          'assets/slideshow/DSC05119.jpg',
          'assets/slideshow/DSC05145.jpg',
          'assets/slideshow/DSC05156.jpg',
          'assets/slideshow/DSC05196.jpg',
          'assets/slideshow/DSC05416.jpg',
          'assets/slideshow/DSC05448.jpg'
        ],
        coverImage: 'assets/slideshow/DSC05127.jpg',
        date: new Date('2024-03-15'),
        createdAt: new Date('2024-03-15'),
      },
      {
        id: '2',
        title: 'Urban Shadows',
        description: 'Explorando las texturas y contrastes de la ciudad después del anochecer.',
        category: 'urban',
        featured: false,
        tags: ['urbano', 'sombras', 'arquitectura', 'nocturno'],
        location: 'San Juan',
        views: 890,
        uniqueViews: 640,
        images: [
          'assets/slideshow/DSC05133.jpg',
          'assets/slideshow/DSC05145.jpg',
          'assets/slideshow/DSC05196.jpg'
        ],
        coverImage: 'assets/slideshow/DSC05133.jpg',
        date: new Date('2024-02-08'),
        createdAt: new Date('2024-02-08'),
      },
      {
        id: '3',
        title: 'Golden Moments',
        description: 'Capturando la magia de la hora dorada en sesiones al aire libre.',
        category: 'outdoor',
        featured: false,
        tags: ['dorado', 'natural', 'retrato', 'exterior'],
        location: 'Playa Condado',
        views: 650,
        uniqueViews: 480,
        images: [
          'assets/slideshow/DSC05445.jpg',
          'assets/slideshow/hero.jpg',
          'assets/slideshow/DSC05416.jpg'
        ],
        coverImage: 'assets/slideshow/DSC05445.jpg',
        date: new Date('2024-01-20'),
        createdAt: new Date('2024-01-20'),
      }
    ];
  }

  // ═══════════════════════════════════════════════════════════════
  // 📸 MÉTODOS DE ÁLBUMES (MEJORADOS)
  // ═══════════════════════════════════════════════════════════════

  getAlbumById(id: string): Album | undefined {
    return this.albumsData().find(album => album.id === id);
  }

  getAlbumsByCategory(category: string): Album[] {
    return this.albumsData().filter(album => album.category === category);
  }

  getFeaturedAlbums(): Album[] {
    return this.albumsData().filter(album => album.featured);
  }

  getRecentAlbums(excludeId?: string, limit: number = 6): Album[] {
    return this.albumsData()
      .filter(album => album.id !== excludeId)
      .sort((a, b) => {
        const dateA = a.date || new Date(0);
        const dateB = b.date || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }

  searchAlbums(query: string): Album[] {
    const searchTerm = query.toLowerCase();
    return this.albumsData().filter(album =>
      album.title.toLowerCase().includes(searchTerm) ||
      album.description.toLowerCase().includes(searchTerm) ||
      album.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      album.location?.toLowerCase().includes(searchTerm)
    );
  }

  incrementViews(albumId: string, isUnique: boolean = false): void {
    const albums = this.albumsData();
    const albumIndex = albums.findIndex(album => album.id === albumId);
    
    if (albumIndex !== -1) {
      const updatedAlbums = [...albums];
      const currentAlbum = updatedAlbums[albumIndex];
      
      updatedAlbums[albumIndex] = {
        ...currentAlbum,
        views: (currentAlbum.views || 0) + 1,
        uniqueViews: isUnique ? (currentAlbum.uniqueViews || 0) + 1 : currentAlbum.uniqueViews
      };
      
      this.albumsData.set(updatedAlbums);
      this.persist();
    }
  }

  addAlbum(album: Omit<Album, 'id' | 'views' | 'uniqueViews'>): Album {
    const newAlbum: Album = {
      ...album,
      id: this.generateId(),
      views: 0,
      uniqueViews: 0,
      date: album.date || new Date(),
      createdAt: new Date(),
      images: album.images || []
    };
    
    this.albumsData.update(albums => [...albums, newAlbum]);
    this.persist();
    this.updateStorageStats();
    
    console.log('✅ Album added:', newAlbum.title);
    return newAlbum;
  }

  updateAlbum(id: string, updates: Partial<Album>): boolean {
    const albums = this.albumsData();
    const albumIndex = albums.findIndex(album => album.id === id);
    
    if (albumIndex === -1) return false;

    const updatedAlbums = [...albums];
    updatedAlbums[albumIndex] = { ...updatedAlbums[albumIndex], ...updates };
    
    this.albumsData.set(updatedAlbums);
    this.persist();
    
    console.log('✅ Album updated:', id);
    return true;
  }

  deleteAlbum(id: string): boolean {
    const albums = this.albumsData();
    const album = albums.find(a => a.id === id);
    
    if (!album) return false;

    // Limpiar imágenes del cache
    album.images.forEach(imageUrl => this.clearImageFromCache(imageUrl));
    
    this.albumsData.update(albums => albums.filter(album => album.id !== id));
    this.persist();
    this.updateStorageStats();
    
    console.log('✅ Album deleted:', album.title);
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🖼️ GESTIÓN AVANZADA DE IMÁGENES
  // ═══════════════════════════════════════════════════════════════

  async uploadImages(albumId: string, files: File[]): Promise<string[]> {
    const album = this.getAlbumById(albumId);
    if (!album) throw new Error('Album not found');

    const uploadedUrls: string[] = [];
    const currentProgress = new Map<string, ImageUploadProgress>();

    // Inicializar progreso
    files.forEach(file => {
      const progressId = this.generateId();
      currentProgress.set(progressId, {
        file,
        progress: 0,
        status: 'pending'
      });
    });

    this.uploadProgress.next(currentProgress);

    try {
      for (const [progressId, progressInfo] of currentProgress.entries()) {
        const file = progressInfo.file;
        
        // Actualizar estado
        progressInfo.status = 'processing';
        progressInfo.progress = 25;
        this.uploadProgress.next(new Map(currentProgress));

        try {
          // Procesar imagen
          const processedUrl = await this.processUploadedImage(file, (progress) => {
            progressInfo.progress = 25 + (progress * 0.75);
            this.uploadProgress.next(new Map(currentProgress));
          });

          // Agregar al álbum
          this.addImageToAlbum(albumId, processedUrl);
          uploadedUrls.push(processedUrl);

          // Completar
          progressInfo.status = 'completed';
          progressInfo.progress = 100;
          progressInfo.processedUrl = processedUrl;

        } catch (error) {
          progressInfo.status = 'error';
          progressInfo.error = error instanceof Error ? error.message : 'Error procesando imagen';
          console.error('❌ Error uploading image:', error);
        }

        this.uploadProgress.next(new Map(currentProgress));
      }

      // Limpiar progreso después de un tiempo
      setTimeout(() => {
        this.uploadProgress.next(new Map());
      }, 3000);

      return uploadedUrls;

    } catch (error) {
      console.error('❌ Upload batch failed:', error);
      throw error;
    }
  }

  private async processUploadedImage(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              onProgress?.(0.3);
              
              // Crear canvas optimizado
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) throw new Error('Canvas context not available');

              // Calcular dimensiones optimizadas
              const maxSize = 1920;
              let { width, height } = img;
              
              if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width *= ratio;
                height *= ratio;
              }

              canvas.width = width;
              canvas.height = height;

              onProgress?.(0.6);

              // Renderizar con calidad alta
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);

              onProgress?.(0.9);

              // Convertir a blob optimizado
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(new Error('Failed to create blob'));
                    return;
                  }

                  const url = URL.createObjectURL(blob);
                  
                  // Guardar en cache con metadata
                  this.imageCache.set(file.name, {
                    url,
                    size: blob.size,
                    timestamp: Date.now(),
                    format: 'jpeg'
                  });

                  onProgress?.(1.0);
                  resolve(url);
                },
                'image/jpeg',
                0.85
              );
            } catch (error) {
              reject(error);
            }
          };

          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target?.result as string;
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  addImageToAlbum(albumId: string, url: string, atStart = false): boolean {
    const albums = this.albumsData();
    const albumIndex = albums.findIndex(a => a.id === albumId);
    
    if (albumIndex === -1) return false;

    const updatedAlbums = [...albums];
    const album = { ...updatedAlbums[albumIndex] };
    const images = [...(album.images || [])];
    
    // Evitar duplicados
    if (images.includes(url)) return false;

    if (atStart) {
      images.unshift(url);
    } else {
      images.push(url);
    }

    album.images = images;
    
    // Actualizar cover si no existe
    if (!album.coverImage && images.length > 0) {
      album.coverImage = images[0];
    }

    updatedAlbums[albumIndex] = album;
    this.albumsData.set(updatedAlbums);
    this.persist();
    this.updateStorageStats();

    return true;
  }

  removeImageFromAlbum(albumId: string, imageUrlOrIndex: string | number): boolean {
    const albums = this.albumsData();
    const albumIndex = albums.findIndex(a => a.id === albumId);
    
    if (albumIndex === -1) return false;

    const updatedAlbums = [...albums];
    const album = { ...updatedAlbums[albumIndex] };
    let imageUrl: string;
    
    // Handle both string URL and numeric index
    if (typeof imageUrlOrIndex === 'number') {
      const index = imageUrlOrIndex;
      if (index < 0 || index >= album.images.length) return false;
      imageUrl = album.images[index];
    } else {
      imageUrl = imageUrlOrIndex;
    }
    
    const images = album.images.filter(img => img !== imageUrl);

    // Limpiar de cache
    this.clearImageFromCache(imageUrl);

    album.images = images;
    
    // Actualizar cover si era la imagen eliminada
    if (album.coverImage === imageUrl) {
      album.coverImage = images.length > 0 ? images[0] : undefined;
    }

    updatedAlbums[albumIndex] = album;
    this.albumsData.set(updatedAlbums);
    this.persist();
    this.updateStorageStats();

    return true;
  }

  reorderAlbumImages(albumId: string, fromIndex: number, toIndex: number): boolean {
    const albums = this.albumsData();
    const albumIndex = albums.findIndex(a => a.id === albumId);
    
    if (albumIndex === -1) return false;

    const updatedAlbums = [...albums];
    const album = { ...updatedAlbums[albumIndex] };
    const images = [...album.images];

    if (fromIndex < 0 || fromIndex >= images.length || toIndex < 0 || toIndex >= images.length) {
      return false;
    }

    // Reordenar
    const [movedImage] = images.splice(fromIndex, 1);
    images.splice(toIndex, 0, movedImage);

    album.images = images;
    updatedAlbums[albumIndex] = album;
    
    this.albumsData.set(updatedAlbums);
    this.persist();

    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // 🖼️ OPTIMIZACIÓN DE IMÁGENES (MEJORADA)
  // ═══════════════════════════════════════════════════════════════

  getOptimizedImageUrl(originalUrl: string, size: 'thumbnail' | 'medium' | 'large'): string {
    const cacheKey = `${originalUrl}-${size}`;
    
    if (this.imageCache.has(cacheKey)) {
      const cached = this.imageCache.get(cacheKey)!;
      // Verificar si el cache no está muy viejo (30 días)
      if (Date.now() - cached.timestamp < 30 * 24 * 60 * 60 * 1000) {
        return cached.url;
      } else {
        this.imageCache.delete(cacheKey);
      }
    }

    // Procesar asincrónicamente
    this.resizeImageAsync(originalUrl, size);
    
    // Retornar placeholder mejorado mientras se procesa
    return this.getImagePlaceholder(
      this.UNIVERSAL_SIZES[size].width,
      this.UNIVERSAL_SIZES[size].height,
      size
    );
  }

  getAllImageVariants(originalUrl: string): ImageVariants {
    return {
      thumbnail: this.getOptimizedImageUrl(originalUrl, 'thumbnail'),
      medium: this.getOptimizedImageUrl(originalUrl, 'medium'),
      large: this.getOptimizedImageUrl(originalUrl, 'large'),
      original: originalUrl
    };
  }

  async batchProcessImages(
    urls: string[], 
    size: 'thumbnail' | 'medium' | 'large',
    onProgress?: (processed: number, total: number) => void
  ): Promise<void> {
    const batchSize = 2; // Reducido para evitar sobrecarga
    let processed = 0;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const promises = batch.map(url => this.resizeImageAsync(url, size));
      
      try {
        await Promise.allSettled(promises);
        processed += batch.length;
        onProgress?.(processed, urls.length);
        
        // Pequeña pausa entre batches
        if (i + batchSize < urls.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.warn('⚠️ Batch processing error:', error);
      }
    }

    console.log(`✅ Batch processed: ${processed}/${urls.length} images`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 💾 GESTIÓN DE ALMACENAMIENTO
  // ═══════════════════════════════════════════════════════════════

  getStorageStats(): StorageStats {
    return this.storageStats.value;
  }

  private updateStorageStats(): void {
    const albums = this.albumsData();
    let totalSize = 0;
    let cacheSize = 0;

    // Calcular tamaño del cache
    this.imageCache.forEach(item => {
      cacheSize += item.size || 0;
    });

    // Estimar tamaño total (aproximado)
    albums.forEach(album => {
      totalSize += album.images.length * 500000; // ~500KB por imagen estimado
    });

    this.storageStats.next({
      totalImages: this.totalImages(),
      totalSize: this.formatBytes(totalSize),
      cacheSize: this.formatBytes(cacheSize),
      albumsCount: this.totalAlbums(),
      lastCleanup: new Date()
    });
  }

  clearImageCache(): void {
    // Liberar URLs de blob
    this.imageCache.forEach(item => {
      if (item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    });

    this.imageCache.clear();
    this.loadingPromises.clear();
    
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {
      console.warn('⚠️ Could not clear cache from localStorage:', e);
    }

    this.updateStorageStats();
    console.log('✨ Image cache cleared completely');
  }

  private clearImageFromCache(imageUrl: string): void {
    const keysToDelete: string[] = [];
    
    this.imageCache.forEach((item, key) => {
      if (key.includes(imageUrl) && item.url.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.imageCache.delete(key));
  }

  optimizeStorage(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🧹 Starting storage optimization...');
      
      // Limpiar cache viejo
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
      
      this.imageCache.forEach((item, key) => {
        if (now - item.timestamp > maxAge) {
          if (item.url.startsWith('blob:')) {
            URL.revokeObjectURL(item.url);
          }
          this.imageCache.delete(key);
        }
      });

      this.saveImageCache();
      this.updateStorageStats();
      
      console.log('✅ Storage optimization completed');
      resolve();
    });
  }

  private schedulePeriodicCleanup(): void {
    // Limpiar cache cada 6 horas
    setInterval(() => {
      this.optimizeStorage();
    }, 6 * 60 * 60 * 1000);
  }

  // ═══════════════════════════════════════════════════════════════
  // 💾 PERSISTENCIA MEJORADA
  // ═══════════════════════════════════════════════════════════════

  private persist(): void {
    try {
      const albums = this.albumsData();
      localStorage.setItem(LS_KEY, JSON.stringify(albums));
    } catch (e) {
      console.error('❌ Failed to persist albums:', e);
    }
  }

  private loadAlbumsFromStorage(): void {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed: Album[] = JSON.parse(raw);
        parsed.forEach(album => {
          if (album.date) album.date = new Date(album.date);
          if (album.createdAt) album.createdAt = new Date(album.createdAt);
        });
        this.albumsData.set(parsed);
        console.log('✅ Albums loaded from storage:', parsed.length);
      }
    } catch (e) {
      console.error('❌ Failed to load albums:', e);
    }
  }

  private saveImageCache(): void {
    try {
      const cacheData = Array.from(this.imageCache.entries());
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('⚠️ Could not save image cache:', e);
    }
  }

  private loadImageCache(): void {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cacheData = JSON.parse(raw);
        this.imageCache = new Map(cacheData);
        console.log('✅ Image cache loaded:', this.imageCache.size, 'entries');
      }
    } catch (e) {
      console.warn('⚠️ Could not load image cache:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔧 UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════

  private async resizeImageAsync(imageUrl: string, size: 'thumbnail' | 'medium' | 'large'): Promise<void> {
    const cacheKey = `${imageUrl}-${size}`;
    
    if (this.loadingPromises.has(cacheKey)) {
      await this.loadingPromises.get(cacheKey);
      return;
    }

    const promise = this.processImageWithOptimization(imageUrl, size);
    this.loadingPromises.set(cacheKey, promise);

    try {
      const processedUrl = await promise;
      
      this.imageCache.set(cacheKey, {
        url: processedUrl,
        size: 0, // Se calculará cuando sea necesario
        timestamp: Date.now(),
        format: this.UNIVERSAL_SIZES[size].format
      });

      this.updateImageElements(cacheKey, processedUrl);
      this.saveImageCache();
    } catch (error) {
      console.error('❌ Error processing image:', error);
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  private async processImageWithOptimization(
    imageUrl: string, 
    size: 'thumbnail' | 'medium' | 'large'
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context not available');

          const config = this.UNIVERSAL_SIZES[size];
          const { width: targetWidth, height: targetHeight, quality } = config;
          
          // Calcular dimensiones manteniendo aspecto
          const scale = Math.min(targetWidth / img.width, targetHeight / img.height);
          const scaledWidth = img.width * scale;
          const scaledHeight = img.height * scale;
          
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Configurar contexto para calidad óptima
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Fondo para transparencias
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          
          // Centrar imagen
          const x = (targetWidth - scaledWidth) / 2;
          const y = (targetHeight - scaledHeight) / 2;
          
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create optimized blob'));
                return;
              }
              
              resolve(URL.createObjectURL(blob));
            },
            `image/${config.format}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
      img.src = imageUrl;
    });
  }

  private updateImageElements(cacheKey: string, newUrl: string): void {
    const images = document.querySelectorAll(`img[data-cache-key="${cacheKey}"]`);
    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        img.src = newUrl;
        img.removeAttribute('data-cache-key');
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');
      }
    });
  }

  private getImagePlaceholder(width: number = 400, height: number = 400, variant?: string): string {
    const size = Math.max(width, height);
    const cacheKey = `placeholder-${size}-${variant || 'default'}`;
    
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!.url;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    if (ctx) {
      // Gradiente más sofisticado
      const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
      gradient.addColorStop(0, '#2a2a2a');
      gradient.addColorStop(0.7, '#1a1a1a');
      gradient.addColorStop(1, '#0a0a0a');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Icono mejorado
      const iconSize = size * 0.2;
      ctx.fillStyle = '#666666';
      ctx.font = `${iconSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📷', size / 2, size / 2);

      // Borde sutil
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, size - 2, size - 2);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
    this.imageCache.set(cacheKey, {
      url: dataUrl,
      size: dataUrl.length,
      timestamp: Date.now(),
      format: 'jpeg'
    });

    return dataUrl;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // ═══════════════════════════════════════════════════════════════
  // 📊 METHODS FOR BACKWARDS COMPATIBILITY
  // ═══════════════════════════════════════════════════════════════

  getStats() {
    const albums = this.albumsData();
    return {
      totalAlbums: albums.length,
      totalImages: albums.reduce((total, album) => total + album.images.length, 0),
      totalViews: albums.reduce((total, album) => total + (album.views || 0), 0),
      totalUniqueViews: albums.reduce((total, album) => total + (album.uniqueViews || 0), 0),
      categories: [...new Set(albums.map(album => album.category).filter((category): category is string => !!category))],
      allTags: [...new Set(albums.flatMap(album => album.tags || []))]
    };
  }

  setAlbumPrivacy(id: string, isPrivate: boolean, password?: string): boolean {
    return this.updateAlbum(id, { 
      isPrivate, 
      password: isPrivate ? (password || '') : undefined 
    });
  }

  async preloadAlbumImages(albumId: string, size: 'thumbnail' | 'medium' | 'large' = 'medium'): Promise<void> {
    const album = this.getAlbumById(albumId);
    if (!album) return;
    
    const imagesToPreload = [
      album.coverImage || album.images[0],
      ...album.images.slice(0, 3)
    ].filter(Boolean);
    
    await this.batchProcessImages(imagesToPreload, size);
  }

  getImageCacheInfo(): { size: number; entries: string[] } {
    return { 
      size: this.imageCache.size, 
      entries: Array.from(this.imageCache.keys()) 
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 🔍 MÉTODOS DE DEBUG Y DESARROLLO
  // ═══════════════════════════════════════════════════════════════

  getDebugInfo() {
    return {
      totalAlbums: this.totalAlbums(),
      totalImages: this.totalImages(),
      cacheSize: this.imageCache.size,
      loadingPromises: this.loadingPromises.size,
      storageStats: this.storageStats.value,
      recentAlbums: this.getRecentAlbums('', 3).map(a => ({ id: a.id, title: a.title }))
    };
  }
}