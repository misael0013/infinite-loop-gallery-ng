import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SlideItem {
  src: string;
  alt?: string;
  caption?: string;
}

@Component({
  selector: 'slideshow',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slideshow.component.html',
  styleUrls: ['./slideshow.component.scss'],
})
export class SlideshowComponent implements OnInit, OnDestroy {
  @Input({ required: true }) items: SlideItem[] = [];
  @Input() interval = 4000;        // ms
  @Input() autoplay = true;
  @Input() loop = true;

  index = signal(0);
  private timer: any = null;
  hovering = false;

  ngOnInit(): void {
    if (this.autoplay && this.items.length > 1) {
      this.start();
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  start(): void {
    this.stop();
    if (this.items.length <= 1) return;
    
    this.timer = setInterval(() => {
      if (!this.hovering) this.next();
    }, this.interval);
  }

  stop(): void {
    if (this.timer) { 
      clearInterval(this.timer); 
      this.timer = null; 
    }
  }

  prev(): void {
    const i = this.index();
    if (i > 0) {
      this.index.set(i - 1);
    } else if (this.loop) {
      this.index.set(this.items.length - 1);
    }
  }

  next(): void {
    const i = this.index();
    if (i < this.items.length - 1) {
      this.index.set(i + 1);
    } else if (this.loop) {
      this.index.set(0);
    }
  }

  goTo(i: number): void { 
    if (i >= 0 && i < this.items.length) {
      this.index.set(i); 
    }
  }

  onMouse(hover: boolean): void {
    this.hovering = hover;
  }

  // Swipe handling mejorado
  private startX = 0;
  private startY = 0;
  private minSwipeDistance = 50;

  onTouchStart(e: TouchEvent): void {
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
  }

  onTouchEnd(e: TouchEvent): void {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    
    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    
    // Solo procesar si el swipe horizontal es mayor que el vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.minSwipeDistance) {
      if (deltaX > 0) {
        this.prev();
      } else {
        this.next();
      }
    }
  }

  // Método para verificar si hay navegación disponible
  canGoPrev(): boolean {
    return this.index() > 0 || this.loop;
  }

  canGoNext(): boolean {
    return this.index() < this.items.length - 1 || this.loop;
  }
}