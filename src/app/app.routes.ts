import { Routes } from '@angular/router';
import { adminGuard, loginGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'galeria', loadComponent: () => import('./features/gallery/gallery.component').then(m => m.GalleryComponent) },
  { path: 'galeria/:id', loadComponent: () => import('./features/album-detail/album-detail.component').then(m => m.AlbumDetailComponent) },
  { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent) },
  { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent) },

  // 🔐 Login admin
  {
    path: 'admin/login',
    canActivate: [loginGuard],
    loadComponent: () => import('./features/admin/login/login.component').then(m => m.LoginComponent),
    title: 'Login - Infinite Loop Gallery',
  },

  // 🔐 Dashboard
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    title: 'Admin Dashboard - Infinite Loop Gallery',
  },

  // 🔧 Editor de álbum
  {
    path: 'admin/album/:id',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/album-editor/album-editor.component').then(m => m.AdminAlbumEditorComponent),
    title: 'Editar Álbum - Infinite Loop Gallery',
  },

  // Error routes
  {
    path: '404',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'Página no encontrada - Infinite Loop Gallery',
  },

  { path: '**', redirectTo: '/404' },
];
