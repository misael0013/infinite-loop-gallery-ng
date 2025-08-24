import { Directive, ElementRef, Input, NgZone, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: 'img[lazySrc]',
  standalone: true
})
export class LazyImageDirective implements OnInit, OnDestroy {
  @Input() lazySrc = '';
  private io?: IntersectionObserver;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private zone: NgZone,
    private r: Renderer2
  ) {}

  ngOnInit(): void {
    const img = this.el.nativeElement as HTMLImageElement;
    (img as any).decoding = 'async';
    (img as any).loading = 'lazy';

    this.r.addClass(img, 'lazy-loading');
    this.toggleWrapperState('is-loading', true);

    if (!('IntersectionObserver' in window)) {
      this.load();
      return;
    }

    this.zone.runOutsideAngular(() => {
      this.io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              this.load();
              this.io?.disconnect();
            }
          });
        },
        { rootMargin: '200px' }
      );
      this.io.observe(img);
    });
  }

  private load(): void {
    const img = this.el.nativeElement;

    const cleanup = () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    };

    const onLoad = () => {
      cleanup();
      this.r.removeClass(img, 'lazy-loading');
      this.r.addClass(img, 'lazy-loaded');
      this.toggleWrapperState('is-loading', false);
    };

    const onError = () => {
      cleanup();
      this.r.removeClass(img, 'lazy-loading');
      this.r.addClass(img, 'lazy-error');
      this.toggleWrapperState('is-loading', false);
      this.toggleWrapperState('is-error', true);
    };

    img.addEventListener('load', onLoad, { once: true });
    img.addEventListener('error', onError, { once: true });
    img.src = this.lazySrc;
  }

  private toggleWrapperState(cls: string, on: boolean) {
    const wrappers = ['media', 'image-card', 'img-wrap'];
    let p: HTMLElement | null = this.el.nativeElement.parentElement;
    while (p && p !== document.body) {
      if (wrappers.some((w) => p!.classList.contains(w))) {
        on ? this.r.addClass(p, cls) : this.r.removeClass(p, cls);
        break;
      }
      p = p.parentElement;
    }
  }

  ngOnDestroy(): void {
    this.io?.disconnect();
  }
}
