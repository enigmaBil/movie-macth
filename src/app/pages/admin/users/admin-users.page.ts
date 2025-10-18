import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Firestore, collection, query, where, getDocs, doc, updateDoc } from '@angular/fire/firestore';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AdminUsersPage implements OnInit {
  users: User[] = [];
  private firestore = inject(Firestore);

  constructor() {}

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('role', '==', 'user'));
      const snap = await getDocs(q);
      this.users = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as User));
    } catch (e) {
      console.error('Error loading users', e);
    }
  }

  async toggleUser(user: User) {
    try {
      const ref = doc(this.firestore, `users/${user.id}`);
      await updateDoc(ref, { isActive: !user.isActive });
      user.isActive = !user.isActive;
    } catch (e) { console.error('Toggle user error', e); }
  }
}
