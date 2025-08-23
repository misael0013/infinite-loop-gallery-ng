import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlbumsService } from '../../core/services/albums.service'; // Solo importa el service
import { Album } from '../../core/models/album.model'; // Importa Album desde models
import { AlbumCardComponent } from '../../shared/components/album-card/album-card.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, AlbumCardComponent],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent implements OnInit {
  private readonly albumSvc = inject(AlbumsService);

  loading = true;
  err: string | null = null;
  albums: Album[] = [];

  ngOnInit(): void {
    // Usar la propiedad albums directamente (ya no es Observable)
    this.albums = this.albumSvc.albums();
    this.loading = false;
    
    // Si quieres reactividad, puedes hacer esto:
    // effect(() => {
    //   this.albums = this.albumSvc.albums();
    // });
  }
}