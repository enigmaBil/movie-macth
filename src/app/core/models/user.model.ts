export interface User {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  photoBase64?: string;
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
  photoDataUrl?: string;
}