import { Component, OnInit } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonAvatar, IonIcon, IonButton, IonButtons } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { User } from 'firebase/auth';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonButtons, IonButton, IonIcon, IonAvatar, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
    user: User | null = null;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  profileImagePreview: string | null = null;
  selectedImageFile: File | null = null; 

  async selectImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        width: 400,
        height: 400,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt
      });

      // Pour affichage immédiat
      this.profileImagePreview = image.webPath || image.path!;

      // Si tu veux uploader via File (recommandé pour Storage)
      // Tu peux aussi utiliser resultType: DataUrl, mais c'est moins efficace
    } catch (error) {
      console.log('User cancelled or error:', error);
    }
  }

  private async convertBlobUrlToFile(url: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], 'profile.jpg', { type: blob.type });
  }

  ngOnInit() {
    this.userService.user$.subscribe(user => {
      this.user = user; // ou null si non connecté
      console.log(user);
      
    });
  }

  async logout() {
    await this.userService.logout();
    await this.router.navigate(['/login']);
  }

  async updateProfilePhoto() {
    // À implémenter plus tard avec Capacitor Camera + Firebase Storage
    console.log('Mettre à jour la photo');
  }

}
