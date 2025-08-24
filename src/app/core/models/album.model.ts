// Interface principal del Álbum
export interface Album {
  id: string;
  title: string;
  description: string;
  images: string[];
  coverImage?: string;          // Imagen principal
  date?: Date;                  // Fecha de creación o última actualización
  createdAt?: Date;             // Alias para compatibilidad con el servicio existente
  category?: string;            // Categoría (night, studio, street, etc.)
  featured?: boolean;           // Destacado
  tags?: string[];              // Tags
  location?: string;            // Ubicación
  client?: string;              // Cliente
  views?: number;               // Vistas
  uniqueViews?: number;         // Vistas únicas
  equipment?: {
    camera?: string;
    lens?: string;
    settings?: string;
  };
  metadata?: {
    views?: number;
    likes?: number;
    downloads?: number;
  };

  /** 🔐 Privacidad */
  isPrivate?: boolean;
  password?: string;
}

// Interface para el sistema de vistas
export interface AlbumView {
  id: string;
  albumId: string;
  sessionId: string;
  timestamp: Date;
  userAgent: string;
  referrer: string;
}
