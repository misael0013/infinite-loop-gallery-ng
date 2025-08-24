import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlbumsService } from '../../core/services/albums.service';
import { Album } from '../../core/models/album.model';
import { AlbumCardComponent } from '../../shared/components/album-card/album-card.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, AlbumCardComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent implements OnInit {
  private readonly albumSvc = inject(AlbumsService);
  private readonly router = inject(Router);

  loading = true;
  err: string | null = null;

  albums: Album[] = [];

  // Filtros
  activeCategory: string = sessionStorage.getItem('ilg-filter') || 'Todos';
  query: string = sessionStorage.getItem('ilg-q') || '';

  // Paginación
  page = Number(sessionStorage.getItem('ilg-page') || 1);
  readonly perPage = 6;

  ngOnInit(): void {
    this.albums = this.albumSvc.albums();
    this.loading = false;
  }

  // Píldoras de categorías (sin hashtags)
  get categories(): string[] {
    const set = new Set<string>(['Todos']);
    this.albums.forEach(a => a.category && set.add(a.category));
    // “Privados” o similares al final (si existieran)
    return Array.from(set).sort((a, b) => {
      if (a === 'Todos') return -1;
      if (b === 'Todos') return 1;
      if (a === 'Privados') return 1;
      if (b === 'Privados') return -1;
      return a.localeCompare(b);
    });
  }

  // Lista filtrada por categoría + búsqueda (por título)
  get filtered(): Album[] {
    let list = [...this.albums];

    if (this.activeCategory === 'Todos') {
      // si algún día marcas “Privados”, aquí puedes excluirlos
      list = list;
    } else {
      list = list.filter(a => a.category === this.activeCategory);
    }

    if (this.query.trim()) {
      const q = this.query.trim().toLowerCase();
      list = list.filter(a => (a.title || '').toLowerCase().includes(q));
    }

    return list;
  }

  // Paginación
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.perPage));
  }
  get pageItems(): Album[] {
    const start = (this.page - 1) * this.perPage;
    return this.filtered.slice(start, start + this.perPage);
  }
  goPage(p: number) {
    this.page = Math.min(Math.max(1, p), this.totalPages);
    sessionStorage.setItem('ilg-page', String(this.page));
  }
  prevPage() { this.goPage(this.page - 1); }
  nextPage() { this.goPage(this.page + 1); }

  // Acciones UI
  setCategory(cat: string) {
    this.activeCategory = cat;
    sessionStorage.setItem('ilg-filter', cat);
    this.goPage(1);
  }
  clearQuery() {
    this.query = '';
    sessionStorage.removeItem('ilg-q');
    this.goPage(1);
  }
  searchAndGo() {
    const q = this.query.trim().toLowerCase();
    if (!q) return;
    const matches = this.albums.filter(a => (a.title || '').toLowerCase().includes(q));
    if (matches.length) {
      sessionStorage.setItem('ilg-q', this.query);
      this.router.navigate(['/galeria', matches[0].id]);
    }
  }

  trackById(_i: number, a: Album) { return a.id; }
}
