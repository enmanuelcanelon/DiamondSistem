import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Obtiene la URL completa de una imagen del backend
 * @param {string} imagePath - Ruta relativa de la imagen (ej: /fotos/servicios/torta/medium/cake.webp)
 * @returns {string} URL completa de la imagen
 */
export function getImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  
  // Obtener la URL base del API
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const baseUrl = apiUrl.replace('/api', '') || 'http://localhost:5001';
  
  // Asegurar que la ruta comience con /
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${path}`;
}

/**
 * Obtiene una imagen aleatoria de un tipo de servicio
 * @param {string} tipo - Tipo de servicio: 'torta', 'decoracion', 'menu', 'bar'
 * @param {string} size - Tamaño: 'thumbnails', 'medium', 'large'
 * @returns {string} URL de la imagen
 */
export function getServiceImageUrl(tipo, size = 'medium') {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const baseUrl = apiUrl.replace('/api', '') || 'http://localhost:5001';
  return `${baseUrl}/fotos/servicios/${tipo}/${size}/`;
}

