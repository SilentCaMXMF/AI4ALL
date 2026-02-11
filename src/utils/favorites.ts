/**
 * Favorites Store - Manages user's favorite models using localStorage
 */

const STORAGE_KEY = 'freeai4all-favorites';

export interface FavoritesState {
  ids: string[];
}

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: FavoritesState = JSON.parse(stored);
    return parsed.ids || [];
  } catch {
    return [];
  }
}

export function addFavorite(id: string): void {
  if (typeof window === 'undefined') return;
  
  const favorites = getFavorites();
  if (!favorites.includes(id)) {
    favorites.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: favorites }));
  }
}

export function removeFavorite(id: string): void {
  if (typeof window === 'undefined') return;
  
  const favorites = getFavorites();
  const index = favorites.indexOf(id);
  if (index > -1) {
    favorites.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ids: favorites }));
  }
}

export function toggleFavorite(id: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const favorites = getFavorites();
  const isFavorite = favorites.includes(id);
  
  if (isFavorite) {
    removeFavorite(id);
    return false;
  } else {
    addFavorite(id);
    return true;
  }
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function clearFavorites(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}