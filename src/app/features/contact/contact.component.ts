import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface ContactInfo {
  icon: string;
  title: string;
  value: string;
  action?: string;
}

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  projectType: string;
  budget: string;
}

interface ServiceOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  
  contactInfo: ContactInfo[] = [
    {
      icon: '📧',
      title: 'Email',
      value: 'contact@infiniteloop.com',
      action: 'mailto:contact@infiniteloop.com'
    },
    {
      icon: '📱',
      title: 'Teléfono',
      value: '+1 (787) 555-0123',
      action: 'tel:+17875550123'
    },
    {
      icon: '📍',
      title: 'Ubicación',
      value: 'San Juan, Puerto Rico',
    },
    {
      icon: '🕒',
      title: 'Horario',
      value: 'Lun - Vie: 9:00 AM - 7:00 PM',
    }
  ];

  serviceOptions: ServiceOption[] = [
    { value: '', label: 'Selecciona un servicio' },
    { value: 'night-portraits', label: 'Retratos Nocturnos' },
    { value: 'studio-session', label: 'Sesión de Estudio' },
    { value: 'events', label: 'Eventos y Celebraciones' },
    { value: 'commercial', label: 'Fotografía Comercial' },
    { value: 'other', label: 'Otro' }
  ];

  budgetOptions: ServiceOption[] = [
    { value: '', label: 'Selecciona presupuesto' },
    { value: 'under-500', label: 'Menos de $500' },
    { value: '500-1000', label: '$500 - $1,000' },
    { value: '1000-2500', label: '$1,000 - $2,500' },
    { value: '2500-5000', label: '$2,500 - $5,000' },
    { value: 'over-5000', label: 'Más de $5,000' }
  ];

  form: ContactForm = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    projectType: '',
    budget: ''
  };

  isSubmitting = false;
  submitMessage = '';
  submitSuccess = false;

  // Método para enviar el formulario
  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.submitMessage = '';

    // Simular envío (en producción conectar con backend/servicio de email)
    setTimeout(() => {
      this.submitSuccess = true;
      this.submitMessage = '¡Mensaje enviado exitosamente! Te responderé pronto.';
      this.isSubmitting = false;
      
      // Resetear formulario después de 3 segundos
      setTimeout(() => {
        this.resetForm();
      }, 3000);
    }, 1500);
  }

  // Validación del formulario
  private validateForm(): boolean {
    if (!this.form.name || !this.form.email || !this.form.message) {
      this.submitMessage = 'Por favor completa todos los campos requeridos.';
      this.submitSuccess = false;
      return false;
    }

    if (!this.isValidEmail(this.form.email)) {
      this.submitMessage = 'Por favor ingresa un email válido.';
      this.submitSuccess = false;
      return false;
    }

    return true;
  }

  // Validar email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Resetear formulario
  private resetForm(): void {
    this.form = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      projectType: '',
      budget: ''
    };
    this.submitMessage = '';
    this.submitSuccess = false;
  }

  // Método para manejar clicks en información de contacto
  onContactClick(info: ContactInfo): void {
    if (info.action) {
      if (info.action.startsWith('mailto:') || info.action.startsWith('tel:')) {
        window.location.href = info.action;
      }
    }
  }

  // Método para copiar información al portapapeles
  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      // Podrías mostrar un toast notification aquí
      console.log('Información copiada al portapapeles');
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  }

  // Método para scroll suave
  scrollToForm(): void {
    const formElement = document.getElementById('contact-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  }
}