export interface Album {
  id: string;
  title: string;
  description: string;
  images: string[];
  coverImage?: string; // Imagen principal del álbum (opcional, usa images[0] como fallback)
  date?: Date; // Fecha de creación o última actualización
  createdAt?: Date; // Alias para compatibilidad con el servicio existente
  category?: string; // Categoría del álbum (night, studio, street, outdoor, etc.)
  featured?: boolean; // Si es un álbum destacado
  tags?: string[]; // Tags para filtrado
  location?: string; // Ubicación donde se tomaron las fotos
  client?: string; // Cliente (para trabajos comerciales)
  views?: number; // Número de vistas del álbum
  uniqueViews?: number; // Vistas únicas del álbum
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