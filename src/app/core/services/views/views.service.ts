import { Injectable, signal } from '@angular/core';
import { Album, AlbumView } from '../../models/album.model';

@Injectable({
  providedIn: 'root'
})
export class ViewsService {
  private albumViews = signal<AlbumView[]>([]);

  constructor() {
    this.loadViewsFromStorage();
  }

  // Registrar una nueva vista de álbum
  recordView(albumId: string): void {
    const sessionId = this.getSessionId();
    const view: AlbumView = {
      id: this.generateId(),
      albumId,
      sessionId,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      referrer: document.referrer
    };

    this.albumViews.update(views => [...views, view]);
    this.saveViewsToStorage();
  }

  // Obtener total de vistas para un álbum
  getTotalViews(albumId: string): number {
    return this.albumViews().filter(view => view.albumId === albumId).length;
  }

  // Obtener vistas únicas para un álbum (por sessionId)
  getUniqueViews(albumId: string): number {
    const albumViews = this.albumViews().filter(view => view.albumId === albumId);
    const uniqueSessions = new Set(albumViews.map((v: AlbumView) => v.sessionId));
    return uniqueSessions.size;
  }

  // Obtener estadísticas de vistas por fecha
  getViewsByDate(albumId: string, days: number = 30): { date: string; views: number }[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentViews = this.albumViews()
      .filter(view => view.albumId === albumId && view.timestamp >= cutoffDate);

    const viewsByDate = new Map<string, number>();
    
    recentViews.forEach(view => {
      const dateKey = view.timestamp.toISOString().split('T')[0];
      viewsByDate.set(dateKey, (viewsByDate.get(dateKey) || 0) + 1);
    });

    return Array.from(viewsByDate.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Obtener álbumes más vistos
  getMostViewedAlbums(limit: number = 10): { albumId: string; views: number; uniqueViews: number }[] {
    const viewCounts = new Map<string, { total: number; unique: Set<string> }>();

    this.albumViews().forEach(view => {
      if (!viewCounts.has(view.albumId)) {
        viewCounts.set(view.albumId, { total: 0, unique: new Set() });
      }
      
      const stats = viewCounts.get(view.albumId)!;
      stats.total++;
      stats.unique.add(view.sessionId);
    });

    return Array.from(viewCounts.entries())
      .map(([albumId, stats]) => ({
        albumId,
        views: stats.total,
        uniqueViews: stats.unique.size
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  // Limpiar vistas antiguas (más de X días)
  cleanOldViews(days: number = 365): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    this.albumViews.update(views => 
      views.filter(view => view.timestamp >= cutoffDate)
    );
    
    this.saveViewsToStorage();
  }

  // Exportar datos de vistas (para analytics)
  exportViewsData(): AlbumView[] {
    return [...this.albumViews()];
  }

  // Obtener estadísticas generales
  getGeneralStats() {
    const views = this.albumViews();
    const uniqueSessions = new Set(views.map((v: AlbumView) => v.sessionId));
    
    return {
      totalViews: views.length,
      uniqueVisitors: uniqueSessions.size,
      avgViewsPerVisitor: views.length / uniqueSessions.size || 0,
      albumsViewed: new Set(views.map(v => v.albumId)).size,
      viewsLast30Days: this.getRecentViewsCount(30),
      viewsLast7Days: this.getRecentViewsCount(7),
      viewsToday: this.getRecentViewsCount(1)
    };
  }

  private getRecentViewsCount(days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.albumViews()
      .filter(view => view.timestamp >= cutoffDate)
      .length;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('photo-gallery-session');
    
    if (!sessionId) {
      sessionId = this.generateId();
      sessionStorage.setItem('photo-gallery-session', sessionId);
    }
    
    return sessionId;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveViewsToStorage(): void {
    try {
      const viewsData = this.albumViews().map(view => ({
        ...view,
        timestamp: view.timestamp.toISOString()
      }));
      localStorage.setItem('album-views', JSON.stringify(viewsData));
    } catch (error) {
      console.warn('Could not save views to localStorage:', error);
    }
  }

  private loadViewsFromStorage(): void {
    try {
      const stored = localStorage.getItem('album-views');
      if (stored) {
        const viewsData = JSON.parse(stored);
        const views = viewsData.map((view: any) => ({
          ...view,
          timestamp: new Date(view.timestamp)
        }));
        this.albumViews.set(views);
      }
    } catch (error) {
      console.warn('Could not load views from localStorage:', error);
    }
  }
}