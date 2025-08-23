import { Injectable, effect, signal } from '@angular/core';
type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'ilg-theme';
  theme = signal<Theme>(this.readInitialTheme());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem(this.STORAGE_KEY, t); } catch {}
    });
  }

  toggle() { this.theme.set(this.theme() === 'dark' ? 'light' : 'dark'); }

  private readInitialTheme(): Theme {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
