import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';

export interface UserMatch {
  userId: string;
  displayName?: string;
  commonMovieIds: string[];
  commonCount: number;
}

@Injectable({ providedIn: 'root' })
export class MatchingService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  /**
   * Returns an observable array of matches for the given userId.
   * Each match contains the other user's id, displayName (if available), and the list/count of common favoriteMovieIds.
   */
  matchesForUser(userId: string): Observable<UserMatch[]> {
    return runInInjectionContext(this.injector, () => {
      const usersRef = collection(this.firestore, 'users');
      return (collectionData(usersRef, { idField: 'id' }) as Observable<any[]>).pipe(
        map(users => {
          const me = users.find(u => u.id === userId) || { favoriteMovieIds: [] };
          const mine: string[] = me.favoriteMovieIds || [];

          const others = users.filter(u => u.id !== userId).map(u => {
            const their: string[] = u.favoriteMovieIds || [];
            const common = mine.filter(id => their.includes(id));
            return {
              userId: u.id,
              displayName: u.displayName || u.name || null,
              commonMovieIds: common,
              commonCount: common.length
            } as UserMatch;
          }).filter(m => m.commonCount > 0).sort((a, b) => b.commonCount - a.commonCount);

          return others;
        })
      );
    });
  }
}
