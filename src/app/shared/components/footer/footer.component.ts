import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  year = new Date().getFullYear();

  // Reemplaza con tus URLs reales
  facebookUrl = 'https://www.facebook.com/tuUsuario';
  instagramUrl = 'https://www.instagram.com/mendez13pr';
  emailHref = 'mailto:adorno223@gmail.com';
}
