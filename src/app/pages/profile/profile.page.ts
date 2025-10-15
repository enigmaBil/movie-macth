import { Component, inject, OnInit } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController, ToastController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, IonCard, IonList, IonItem, IonLabel, IonAvatar, IonCardContent, IonCardTitle, IonCardHeader } from '@ionic/angular/standalone';
// NgIf and FormsModule not needed for the current template (using Angular 20 @if control flow)
import { ProfileService } from 'src/app/core/services/profile.service';
import { Router } from '@angular/router';
import { Auth, updatePassword } from '@angular/fire/auth';
import { User } from 'src/app/core/models/user.model';
import { from } from 'rxjs';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonAvatar, IonIcon, IonCard, IonList, IonItem, IonLabel]
})
export class ProfilePage implements OnInit {
  userProfile: User | null = null;
  profileImagePreview: string | null = null;
  // modal/edit states
  editingName = false;
  editingEmail = false;
  editingPassword = false;

  editFirstName = '';
  editLastName = '';
  editEmail = '';
  editPassword = '';
  editPasswordConfirm = '';

  constructor(
    private profileService: ProfileService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private auth: Auth,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.profileService.getCurrentUserProfile().subscribe(profile => {
      this.userProfile = profile;
      console.log(profile);
      
      this.profileImagePreview = profile?.photoDataUrl || null;
    });
  }

  async selectImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 60, // Réduit la taille
        allowEditing: true,
        width: 300,
        height: 300,
        resultType: CameraResultType.DataUrl, // ← Important
        source: CameraSource.Prompt
      });

      if (image.dataUrl) {
        this.profileImagePreview = image.dataUrl;
        await this.savePhoto(image.dataUrl);
      }
    } catch (error) {
      console.log('Sélection annulée ou erreur', error);
    }
  }

  // file input fallback
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      this.profileImagePreview = dataUrl;
      await this.savePhoto(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  // Name edit flow
  openEditName() {
    this.editFirstName = this.userProfile?.firstName || '';
    this.editLastName = this.userProfile?.lastName || '';
    this.editingName = true;
  }
  closeEditName() { this.editingName = false; }
  async submitEditName() {
    if (!this.editFirstName || !this.editLastName) {
      this.presentToast('Le prénom et le nom sont requis', 'danger');
      return;
    }
    try {
      await this.profileService.updateBasicInfo(this.editFirstName, this.editLastName, this.userProfile?.age || 0);
      this.presentToast('Nom mis à jour', 'success');
      this.loadUserProfile();
      this.closeEditName();
    } catch (e: any) {
      this.presentToast(e.message || 'Erreur', 'danger');
    }
  }

  // Email edit flow
  openEditEmail() {
    this.editEmail = this.userProfile?.email || '';
    this.editingEmail = true;
  }
  closeEditEmail() { this.editingEmail = false; }
  async submitEditEmail() {
    if (!this.editEmail) { this.presentToast('Email requis', 'danger'); return; }
    try {
      await this.profileService.updateEmail(this.editEmail);
      this.presentToast('Email mis à jour', 'success');
      this.loadUserProfile();
      this.closeEditEmail();
    } catch (e: any) {
      this.presentToast(e.message || 'Erreur lors de la mise à jour de l\'email', 'danger');
    }
  }

  // Password change flow
  openChangePassword() { this.editPassword = ''; this.editPasswordConfirm = ''; this.editingPassword = true; }
  closeChangePassword() { this.editingPassword = false; }
  async submitChangePassword() {
    if (!this.editPassword || this.editPassword.length < 6) { this.presentToast('Le mot de passe doit contenir au moins 6 caractères', 'danger'); return; }
    if (this.editPassword !== this.editPasswordConfirm) { this.presentToast('Les mots de passe ne correspondent pas', 'danger'); return; }
    try {
      await this.profileService.updatePassword(this.editPassword);
      this.presentToast('Mot de passe mis à jour', 'success');
      this.closeChangePassword();
    } catch (e: any) {
      this.presentToast(e.message || 'Erreur lors de la mise à jour du mot de passe', 'danger');
    }
  }

  onModalDismiss() {
    // no-op for now; placeholder if we want to react
  }

  private async savePhoto(dataUrl: string) {
    if (!this.userProfile) return;

    const loading = await this.toastController.create({ message: 'Sauvegarde...', duration: 2000 });
    await loading.present();

    try {
      await this.profileService.updateProfilePhoto(this.userProfile.id, dataUrl);
      this.presentToast('Photo mise à jour !', 'success');
    } catch (err: any) {
      this.presentToast(err.message || 'Erreur lors de la sauvegarde.', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async updateBasicInfo() {
    const alert = await this.alertController.create({
      header: 'Modifier vos informations',
      inputs: [
        { name: 'firstName', type: 'text', placeholder: 'Prénom', value: this.userProfile?.firstName },
        { name: 'lastName', type: 'text', placeholder: 'Nom', value: this.userProfile?.lastName },
        { name: 'age', type: 'number', placeholder: 'Âge', value: this.userProfile?.age?.toString() }
      ],
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Sauvegarder',
          handler: async (data: any) => {
            try {
              await this.profileService.updateBasicInfo(data.firstName, data.lastName, +data.age);
              this.loadUserProfile();
              this.presentToast('Informations mises à jour !');
            } catch (err) {
              this.presentToast('Erreur lors de la mise à jour.', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

    async changePassword() {
    const alert = await this.alertController.create({
      header: 'Changer le mot de passe',
      message: 'Entrez votre nouveau mot de passe (au moins 6 caractères).',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Mot de passe actuel (optionnel si récemment connecté)',
          // Note : Firebase ne demande pas le mot de passe actuel si la session est récente
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Nouveau mot de passe',
          min: 6
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirmer le nouveau mot de passe'
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Mettre à jour',
          handler: async (data) => {
            if (!data.newPassword || data.newPassword.length < 6) {
              this.presentToast('Le mot de passe doit avoir au moins 6 caractères.', 'danger');
              return false; // empêche la fermeture de l'alerte
            }

            if (data.newPassword !== data.confirmPassword) {
              this.presentToast('Les mots de passe ne correspondent pas.', 'danger');
              return false;
            }

            try {
              const user = this.userService['auth'].currentUser;
              if (!user) throw new Error('Utilisateur non connecté');

              await updatePassword(user, data.newPassword);

              this.presentToast('Mot de passe mis à jour avec succès !', 'success');
              return true;
            } catch (error: any) {
              console.error('Erreur changement mot de passe:', error);
              let message = 'Impossible de changer le mot de passe.';
              if (error.code === 'auth/requires-recent-login') {
                message = 'Veuillez vous reconnecter pour changer votre mot de passe.';
              }
              this.presentToast(message, 'danger');
              return false;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async logout() {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }

  private async presentToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({ message, color, duration: 2000 });
    toast.present();
  }
}