import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Skill {
  name: string;
  level: number;
  icon: string;
}

interface Experience {
  year: string;
  title: string;
  description: string;
  highlight?: boolean;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  
  // Servicios movidos desde Home
  services: Service[] = [
    {
      id: 'night-portraits',
      title: 'Retratos Nocturnos',
      description: 'Sesiones especializadas en fotografía nocturna con juego de luces y sombras dramáticas.',
      icon: 'camera'
    },
    {
      id: 'studio-sessions',
      title: 'Sesiones de Estudio',
      description: 'Retratos profesionales en estudio controlado con iluminación profesional y conceptos únicos.',
      icon: 'monitor'
    },
    {
      id: 'special-events',
      title: 'Eventos Especiales',
      description: 'Cobertura fotográfica para eventos, bodas y celebraciones con un estilo artístico distintivo.',
      icon: 'activity'
    },
    {
      id: 'commercial',
      title: 'Fotografía Comercial',
      description: 'Servicios profesionales para marcas, productos y contenido comercial de alta calidad.',
      icon: 'target'
    }
  ];

  skills: Skill[] = [
    { name: 'Fotografía Nocturna', level: 95, icon: '🌙' },
    { name: 'Retrato Artístico', level: 90, icon: '👤' },
    { name: 'Edición Digital', level: 88, icon: '🎨' },
    { name: 'Iluminación de Estudio', level: 85, icon: '💡' },
    { name: 'Fotografía de Eventos', level: 82, icon: '🎉' },
    { name: 'Fotografía Comercial', level: 80, icon: '💼' }
  ];

  experience: Experience[] = [
    {
      year: '2024',
      title: 'Infinite Loop Gallery',
      description: 'Lanzamiento de mi galería online especializada en fotografía nocturna y retratos artísticos.',
      highlight: true
    },
    {
      year: '2023',
      title: 'Exposición "Sombras Urbanas"',
      description: 'Primera exposición individual en el Centro de Arte Contemporáneo de San Juan.'
    },
    {
      year: '2022',
      title: 'Premio Fotografía Nocturna',
      description: 'Reconocimiento por mejor serie fotográfica en el Festival Internacional de Fotografía.'
    },
    {
      year: '2021',
      title: 'Formación Especializada',
      description: 'Certificación en técnicas avanzadas de fotografía nocturna y astrofotografía.'
    },
    {
      year: '2020',
      title: 'Primeros Trabajos Comerciales',
      description: 'Inicio de colaboraciones con marcas locales y agencias de publicidad.'
    },
    {
      year: '2019',
      title: 'Inicios en Fotografía',
      description: 'Primeros pasos en la fotografía profesional, enfocándose en retratos y eventos.'
    }
  ];

  stats = {
    experience: '5+',
    projects: '150+',
    clients: '80+',
    awards: '3'
  };

  // Método para obtener el ancho de la barra de skill
  getSkillWidth(level: number): string {
    return `${level}%`;
  }

  // Método para scroll suave a sección
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Método para manejar clicks en servicios
  onServiceClick(serviceId: string): void {
    console.log(`Clicked on service: ${serviceId}`);
    // Podrías agregar navegación a una página específica del servicio
    // o mostrar más información, analytics, etc.
    
    // Opcional: scroll suave a la sección de contacto
    this.scrollToContactSection();
  }

  // Método auxiliar para hacer scroll a la sección de contacto
  private scrollToContactSection(): void {
    // Si tienes una sección de contacto en esta página
    const contactSection = document.querySelector('.about-cta');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
    // O redirigir a la página de contacto
    // this.router.navigate(['/contact']);
  }
}