import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  Renderer2,
  inject,
} from '@angular/core';
import { AlbumsService } from '../../../core/services/albums.service';

@Directive({
  selector: '[appLazyImage]',
  standalone: true,
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input() appLazyImage!: string; // URL de la imagen original
  @Input() imageSize: 'thumbnail' | 'medium' | 'large' = 'medium';
  @Input() alt: string = '';
  @Input() class: string = ''; // Clases CSS adicionales (opcionales)

  private albumsService = inject(AlbumsService);
  private elementRef = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private renderer = inject(Renderer2);

  private observer?: IntersectionObserver;
  private img!: HTMLImageElement;

  ngOnInit(): void {
    this.img = this.elementRef.nativeElement;

    if (!this.img || this.img.tagName !== 'IMG') {
      console.warn('⚠️ LazyImageDirective debe usarse solo en elementos <img>');
      return;
    }

    this.setPlaceholder();
    this.setupObserver();

    if (this.class) {
      this.class.split(' ').forEach((cls) => {
        const c = cls.trim();
        if (c) this.renderer.addClass(this.img, c);
      });
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  /** 🖼️ Placeholder mientras carga */
  private setPlaceholder(): void {
    const sizes = {
      thumbnail: { width: 400, height: 400 },
      medium: { width: 800, height: 800 },
      large: { width: 1200, height: 1200 },
    } as const;

    const size = sizes[this.imageSize];

    const placeholder = this.albumsService.getImagePlaceholder(
      size.width,
      size.height
    );

    this.renderer.setAttribute(this.img, 'src', placeholder);
    this.renderer.setAttribute(
      this.img,
      'alt',
      this.alt || 'Cargando imagen…'
    );
    this.renderer.addClass(this.img, 'lazy-loading');

    this.renderer.setStyle(this.img, 'width', `${size.width}px`);
    this.renderer.setStyle(this.img, 'height', `${size.height}px`);
    this.renderer.setStyle(this.img, 'object-fit', 'cover');
    this.renderer.setStyle(this.img, 'object-position', 'center');
  }

  /** 👁️ IntersectionObserver */
  private setupObserver(): void {
    const isMobile = window.innerWidth < 768;
    const rootMargin = isMobile ? '20px' : '50px';

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.observer?.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin, threshold: 0.1 }
    );

    this.observer.observe(this.img);
  }

  /** 🔄 Carga optimizada */
  private loadImage(): void {
    if (!this.appLazyImage) {
      console.warn('⚠️ Falta URL de imagen');
      return;
    }

    this.albumsService.prepareImageElement(
      this.img,
      this.appLazyImage,
      this.imageSize
    );

    if (this.alt) this.renderer.setAttribute(this.img, 'alt', this.alt);

    this.renderer.setStyle(
      this.img,
      'transition',
      'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
    );

    if (this.isDevelopment()) {
      console.log(`🖼️ Lazy loading: ${this.appLazyImage} (${this.imageSize})`);
    }
  }

  /** 🔍 Dev mode (público por si lo llamas en plantillas) */
  public isDevelopment(): boolean {
    const h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1';
  }
}
