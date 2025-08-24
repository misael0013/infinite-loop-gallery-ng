// src/app/features/album-detail/album-detail.component.ts
import {
  Component,
  OnDestroy,
  OnInit,
  HostListener,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlbumsService } from '../../core/services/albums.service';
import { Album } from '../../core/models/album.model';

@Component({
  selector: 'app-album-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './album-detail.component.html',
  styleUrls: ['./album-detail.component.scss'],
})
export class AlbumDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private albums = inject(AlbumsService);

  album: Album | undefined;
  images: string[] = [];

  /** índice actual dentro del lightbox */
  private currentIndex = signal(0);
  /** estado del lightbox */
  private isOpen = signal(false);

  /** señal derivada para usar en plantilla: *ngIf="showLightbox()" */
  showLightbox = computed(() => this.isOpen());

  /** helpers leíbles en TS y plantilla */
  get current() {
    return this.currentIndex; // señal invocable: current()
  }
  get currentSrc() {
    return this.images[this.current()] ?? '';
  }
  get currentFilename() {
    return this.getFilename(this.currentSrc);
  }

  /** storage seguro (evita SSR errores) */
  private ss: Storage | null =
    typeof window !== 'undefined' ? window.sessionStorage : null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.album = this.albums.getAlbumById(id);
    this.images = this.album?.images ?? [];

    // restaurar índice previo (si existía)
    if (this.ss && id && this.images.length) {
      const raw = this.ss.getItem(`alb:${id}:idx`);
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0 && n < this.images.length) {
        this.currentIndex.set(n);
      }
    }

    // precargar vecinos del índice inicial
    this.preloadAround(this.current());
  }

  ngOnDestroy(): void {
    // Si quieres limpiar el índice guardado al salir, descomenta:
    // const id = this.album?.id;
    // if (this.ss && id) this.ss.removeItem(`alb:${id}:idx`);
  }

  /** abrir/cerrar */
  openLightbox(i: number) {
    this.currentIndex.set(i);
    this.isOpen.set(true);
    this.persistIndex(i);
    this.preloadAround(i);
  }

  closeLightbox() {
    this.isOpen.set(false);
  }

  /** navegación */
  prev() {
    if (!this.images.length) return;
    const n = (this.current() - 1 + this.images.length) % this.images.length;
    this.currentIndex.set(n);
    this.persistIndex(n);
    this.preloadAround(n);
  }

  next() {
    if (!this.images.length) return;
    const n = (this.current() + 1) % this.images.length;
    this.currentIndex.set(n);
    this.persistIndex(n);
    this.preloadAround(n);
  }

  /** gestos táctiles */
  private touchX = 0;
  onTouchStart(e: TouchEvent) {
    this.touchX = e.changedTouches[0]?.clientX ?? 0;
  }
  onTouchEnd(e: TouchEvent) {
    const dx = (e.changedTouches[0]?.clientX ?? 0) - this.touchX;
    if (dx > 40) this.prev();
    else if (dx < -40) this.next();
  }

  /** teclado: Escape / Flechas */
  @HostListener('document:keydown', ['$event'])
  onKey(ev: KeyboardEvent) {
    if (!this.showLightbox()) return;
    if (ev.key === 'Escape') this.closeLightbox();
    else if (ev.key === 'ArrowLeft') this.prev();
    else if (ev.key === 'ArrowRight') this.next();
  }

  /** utilidades */
  getFilename(src: string): string {
    try {
      return decodeURIComponent(src.split('/').pop() || '');
    } catch {
      return src;
    }
  }

  private persistIndex(i: number) {
    const id = this.album?.id;
    if (this.ss && id) this.ss.setItem(`alb:${id}:idx`, String(i));
  }

  private preload(url: string | undefined) {
    if (!url) return;
    const im = new Image();
    im.decoding = 'async';
    im.loading = 'eager';
    im.src = url;
  }

  private preloadAround(i: number) {
    if (!this.images.length) return;
    const n = this.images.length;
    this.preload(this.images[(i + 1) % n]);
    this.preload(this.images[(i - 1 + n) % n]);
  }
}
