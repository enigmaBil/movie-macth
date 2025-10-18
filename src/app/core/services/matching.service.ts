import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface UserMatch {
  userId: string;
  displayName?: string;
  commonMovieIds: string[];
  commonCount: number;
  matchPercentage: number; // <-- Ajout du pourcentage
}

@Injectable({ providedIn: 'root' })
export class MatchingService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  /**
   * Returns an observable array of matches for the given userId.
   * Each match contains the other user's id, displayName (if available),
   * the list/count of common favoriteMovieIds, and the match percentage.
   * Only users with a match percentage > 75% are returned.
   */
  matchesForUser(userId: string): Observable<UserMatch[]> {
    return runInInjectionContext(this.injector, () => {
      const usersRef = collection(this.firestore, 'users');
      return (collectionData(usersRef, { idField: 'id' }) as Observable<any[]>).pipe(
        map(users => {
          const me = users.find(u => u.id === userId);
          if (!me) {
            return []; // L'utilisateur n'existe pas
          }

          const myFavorites: string[] = me.favoriteMovieIds || [];
          if (myFavorites.length === 0) {
            return []; // Si l'utilisateur courant n'a pas de favoris, pas de match possible
          }

          const others = users
            .filter(u => u.id !== userId)
            .map(u => {
              const theirFavorites: string[] = u.favoriteMovieIds || [];
              const common = myFavorites.filter(id => theirFavorites.includes(id));
              const commonCount = common.length;

              // Calcul du taux de correspondance par rapport à l'utilisateur courant
              const matchPercentage = (commonCount / myFavorites.length) * 100;

              return {
                userId: u.id,
                displayName: `${u.firstName} ${u.lastName}`,
                commonMovieIds: common,
                commonCount,
                matchPercentage, // <-- Ajout du pourcentage
              } as UserMatch;
            })
            .filter(m => m.matchPercentage > 75); // <-- Filtre selon la spec

          // Tri par pourcentage (ou nombre de films en commun)
          return others.sort((a, b) => b.matchPercentage - a.matchPercentage);
        })
      );
    });
  }
}