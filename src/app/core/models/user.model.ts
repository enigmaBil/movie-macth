export interface User {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  photoDataUrl?: string; // ← Remplace photoBase64
  role: 'user' | 'admin';
  isActive: boolean;
  favoriteMovieIds: string[];
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
  // optional data URL for a profile photo; stored in Firestore when provided
  photoDataUrl?: string;
}