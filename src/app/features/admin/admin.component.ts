import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlbumsService } from '../../core/services/albums.service';
import { ViewsService } from '../../core/services/views/views.service';
import { AuthService } from '../../core/auth/auth.service';
import { Album } from '../../core/models/album.model';

interface AdminStats {
  totalAlbums: number;
  totalImages: number;
  totalViews: number;
  totalUniqueViews: number;
  uniqueVisitors: number;
  viewsToday: number;
  categories: string[];
  allTags: string[];
}

interface ViewStats {
  totalViews: number;
  uniqueVisitors: number;
  avgViewsPerVisitor: number;
  albumsViewed: number;
  viewsLast30Days: number;
  viewsLast7Days: number;
  viewsToday: number;
}

interface AdminTab {
  id: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  albums: Album[] = [];
  stats: AdminStats | null = null;
  viewStats: ViewStats | null = null;
  isLoading = true;
  activeTab = 'dashboard';

  // ❌ Quitamos la pestaña de Configuración
  tabs: AdminTab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'albums', label: 'Álbumes', icon: '📸' },
    { id: 'users', label: 'Usuarios', icon: '👥' }
  ];

  constructor(
    private albumsService: AlbumsService,
    private viewsService: ViewsService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;

    try {
      this.albums = this.albumsService.albums();
      const albumStats = this.albumsService.getStats();
      const viewStats = this.viewsService.getGeneralStats();

      this.stats = {
        ...albumStats,
        uniqueVisitors: viewStats.uniqueVisitors,
        viewsToday: viewStats.viewsToday
      };

      this.viewStats = viewStats;
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  formatViews(views: number): string {
    return this.formatNumber(views);
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    }).format(new Date(date));
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  refreshData(): void {
    this.loadData();
  }

  cleanOldViews(): void {
    try {
      this.viewsService.cleanOldViews(365);
      this.loadData();
    } catch (error) {
      console.error('Error cleaning old views:', error);
    }
  }

  formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  }

  getMostViewedAlbums(): { albumId: string; views: number; uniqueViews: number; album?: Album }[] {
    const mostViewed = this.viewsService.getMostViewedAlbums(5);
    return mostViewed.map(item => ({
      ...item,
      album: this.albumsService.getAlbumById(item.albumId)
    }));
  }

  deleteAlbum(albumId: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este álbum?')) {
      try {
        this.albumsService.deleteAlbum(albumId);
        this.loadData();
      } catch (error) {
        console.error('Error deleting album:', error);
      }
    }
  }

  toggleFeatured(albumId: string): void {
    const album = this.albumsService.getAlbumById(albumId);
    if (album) {
      this.albumsService.updateAlbum(albumId, { featured: !album.featured });
      this.loadData();
    }
  }

  exportData(): void {
    try {
      const data = {
        albums: this.albums,
        stats: this.stats,
        viewStats: this.viewStats,
        views: this.viewsService.exportViewsData(),
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gallery-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }
}
