import { Injectable, signal } from '@angular/core';
import { Album } from '../models/album.model';

export interface ImageVariants {
  thumbnail: string;
  medium: string;
  large: string;
  original: string;
}

const LS_KEY = 'ilg.albums.v1';

@Injectable({ providedIn: 'root' })
export class AlbumsService {
  // 🖼️ Tamaños universales para TODAS las imágenes
  private readonly UNIVERSAL_SIZES = {
    thumbnail: { width: 400, height: 400, quality: 0.8 },
    medium:    { width: 800, height: 800, quality: 0.85 },
    large:     { width: 1200, height: 1200, quality: 0.9 }
  };

  // 💾 Cache para imágenes procesadas
  private imageCache = new Map<string, string>();
  private loadingPromises = new Map<string, Promise<string>>();

  private albumsData = signal<Album[]>([
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
  ]);

  // Getter para acceder a los álbumes
  albums = this.albumsData.asReadonly();

  constructor() {
    // Cargar desde localStorage si existe
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed: Album[] = JSON.parse(raw);
        parsed.forEach(a => {
          if (a.date) a.date = new Date(a.date);
          if (a.createdAt) a.createdAt = new Date(a.createdAt);
        });
        this.albumsData.set(parsed);
      } catch {}
    }
  }

  private persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.albumsData()));
    } catch {}
  }

  // ═══════════════════════════════════════════════════════════════
  // 📸 MÉTODOS DE ÁLBUMES
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
      album.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  incrementViews(albumId: string): void {
    const albums = this.albumsData();
    const albumIndex = albums.findIndex(album => album.id === albumId);
    if (albumIndex !== -1) {
      const updatedAlbums = [...albums];
      updatedAlbums[albumIndex] = {
        ...updatedAlbums[albumIndex],
        views: (updatedAlbums[albumIndex].views || 0) + 1
      };
      this.albumsData.set(updatedAlbums);
      this.persist();
    }
  }

  addAlbum(album: Omit<Album, 'id' | 'views' | 'uniqueViews'>): void {
    const newAlbum: Album = {
      ...album,
      id: this.generateId(),
      views: 0,
      uniqueViews: 0,
      date: album.date || new Date(),
      createdAt: new Date()
    };
    this.albumsData.update(albums => [...albums, newAlbum]);
    this.persist();
  }

  updateAlbum(id: string, updates: Partial<Album>): void {
    this.albumsData.update(albums =>
      albums.map(album => album.id === id ? { ...album, ...updates } : album)
    );
    this.persist();
  }

  deleteAlbum(id: string): void {
    this.albumsData.update(albums => albums.filter(album => album.id !== id));
    this.persist();
  }

  // Fotos
  addImageToAlbum(id: string, url: string, atStart = false) {
    this.albumsData.update(albums =>
      albums.map(a => {
        if (a.id !== id) return a;
        const imgs = a.images ? [...a.images] : [];
        atStart ? imgs.unshift(url) : imgs.push(url);
        return { ...a, images: imgs, coverImage: a.coverImage || imgs[0] };
      })
    );
    this.persist();
  }

  removeImageFromAlbum(id: string, index: number) {
    this.albumsData.update(albums =>
      albums.map(a => {
        if (a.id !== id) return a;
        const imgs = [...a.images];
        imgs.splice(index, 1);
        const cover = imgs.length
          ? (a.coverImage && imgs.includes(a.coverImage) ? a.coverImage : imgs[0])
          : undefined;
        return { ...a, images: imgs, coverImage: cover };
      })
    );
    this.persist();
  }

  // Privacidad
  setAlbumPrivacy(id: string, isPrivate: boolean, password?: string) {
    this.updateAlbum(id, { isPrivate, password: isPrivate ? (password || '') : undefined });
  }

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

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // ═══════════════════════════════════════════════════════════════
  // 🖼️ OPTIMIZACIÓN DE IMÁGENES (igual a tu versión, con cache)
  // ═══════════════════════════════════════════════════════════════

  getOptimizedImageUrl(originalUrl: string, size: 'thumbnail' | 'medium' | 'large'): string {
    const cacheKey = `${originalUrl}-${size}`;
    if (this.imageCache.has(cacheKey)) return this.imageCache.get(cacheKey)!;
    this.resizeImageAsync(originalUrl, size);
    return this.getImagePlaceholder(
      this.UNIVERSAL_SIZES[size].width,
      this.UNIVERSAL_SIZES[size].height
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

  async batchProcessImages(urls: string[], size: 'thumbnail' | 'medium' | 'large'): Promise<void> {
    const batchSize = 3;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const promises = batch.map(url => this.resizeImageAsync(url, size));
      try {
        await Promise.all(promises);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn('⚠️ Batch processing error:', error);
      }
    }
  }

  private async resizeImageAsync(imageUrl: string, size: 'thumbnail' | 'medium' | 'large'): Promise<void> {
    const cacheKey = `${imageUrl}-${size}`;
    if (this.loadingPromises.has(cacheKey)) {
      await this.loadingPromises.get(cacheKey);
      return;
    }
    const promise = this.processImageUniversalSize(imageUrl, size);
    this.loadingPromises.set(cacheKey, promise);
    try {
      const processedUrl = await promise;
      this.imageCache.set(cacheKey, processedUrl);
      this.updateImageElements(cacheKey, processedUrl);
    } catch (error) {
      console.error('❌ Error processing image:', error);
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  private async processImageUniversalSize(imageUrl: string, size: 'thumbnail' | 'medium' | 'large'): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('No canvas context')); return; }

          const target = this.UNIVERSAL_SIZES[size];
          canvas.width = target.width;
          canvas.height = target.height;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, target.width, target.height);

          const aspect = img.width / img.height;
          let w = target.width, h = target.height, x = 0, y = 0;
          if (aspect > 1) { h = target.width / aspect; y = (target.height - h) / 2; }
          else if (aspect < 1) { w = target.height * aspect; x = (target.width - w) / 2; }

          ctx.drawImage(img, x, y, w, h);

          canvas.toBlob(
            blob => blob ? resolve(URL.createObjectURL(blob)) : reject(new Error('Failed to create blob')),
            'image/jpeg',
            target.quality
          );
        } catch (e) { reject(e); }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
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

  getImagePlaceholder(width: number = 400, height: number = 400): string {
    const size = Math.max(width, height);
    const cacheKey = `placeholder-${size}`;
    if (this.imageCache.has(cacheKey)) return this.imageCache.get(cacheKey)!;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size; canvas.height = size;
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, '#1f2937');
      gradient.addColorStop(0.5, '#111827');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#4b5563';
      ctx.font = `${size * 0.15}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('📷', size / 2, size / 2);
      ctx.strokeStyle = '#374151'; ctx.lineWidth = 1; ctx.strokeRect(0, 0, size, size);
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.3);
    this.imageCache.set(cacheKey, dataUrl);
    return dataUrl;
  }

  prepareImageElement(img: HTMLImageElement, originalUrl: string, size: 'thumbnail' | 'medium' | 'large'): void {
    const cacheKey = `${originalUrl}-${size}`;
    if (this.imageCache.has(cacheKey)) {
      img.src = this.imageCache.get(cacheKey)!;
      img.classList.add('lazy-loaded');
    } else {
      img.src = this.getImagePlaceholder(this.UNIVERSAL_SIZES[size].width, this.UNIVERSAL_SIZES[size].height);
      img.setAttribute('data-cache-key', cacheKey);
      img.classList.add('lazy-loading');
      this.resizeImageAsync(originalUrl, size);
    }
  }

  getImageCacheInfo(): { size: number; entries: string[] } {
    return { size: this.imageCache.size, entries: Array.from(this.imageCache.keys()) };
  }

  clearImageCache(): void {
    this.imageCache.forEach(url => { if (url.startsWith('blob:')) URL.revokeObjectURL(url); });
    this.imageCache.clear(); this.loadingPromises.clear();
    console.log('✨ Image cache cleared - memory freed');
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
}
