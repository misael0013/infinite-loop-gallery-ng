import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AlbumsService } from '../../../core/services/albums.service';
import { Album } from '../../../core/models/album.model';

@Component({
  standalone: true,
  selector: 'app-admin-album-editor',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './album-editor.component.html',
  styleUrls: ['./album-editor.component.scss'],
})
export class AdminAlbumEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  albumSvc = inject(AlbumsService);

  album = signal<Album | null>(null);

  title = ''; description = ''; category = '';
  isPrivate = false; password = '';
  newImageUrl = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    const a = this.albumSvc.getAlbumById(id) || null;
    if (!a) { this.router.navigateByUrl('/admin'); return; }
    this.album.set(a);
    this.title = a.title || '';
    this.description = a.description || '';
    this.category = a.category || '';
    this.isPrivate = !!a.isPrivate;
    this.password = a.password || '';
  }

  get images() { return this.album()?.images || []; }

  saveMeta() {
    const a = this.album(); if (!a) return;
    this.albumSvc.updateAlbum(a.id, {
      title: this.title.trim() || a.title,
      description: this.description,
      category: this.category.trim() || undefined,
    });
    this.albumSvc.setAlbumPrivacy(a.id, this.isPrivate, this.password);
    this.album.set(this.albumSvc.getAlbumById(a.id) || null);
  }

  addImage() {
    const a = this.album(); if (!a) return;
    const url = this.newImageUrl.trim(); if (!url) return;
    this.albumSvc.addImageToAlbum(a.id, url);
    this.newImageUrl = '';
    this.album.set(this.albumSvc.getAlbumById(a.id) || null);
  }

  removeImage(i: number) {
    const a = this.album(); if (!a) return;
    this.albumSvc.removeImageFromAlbum(a.id, i);
    this.album.set(this.albumSvc.getAlbumById(a.id) || null);
  }

  setAsCover(i: number) {
    const a = this.album(); if (!a) return;
    const imgs = [...(a.images||[])];
    const chosen = imgs[i];
    const rest = imgs.filter((_, idx) => idx !== i);
    this.albumSvc.updateAlbum(a.id, { coverImage: chosen, images: [chosen, ...rest] });
    this.album.set(this.albumSvc.getAlbumById(a.id) || null);
  }
}
