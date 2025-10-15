import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonAvatar, IonIcon, IonButton, IonButtons, IonInput, IonItem, IonLabel, IonSpinner, LoadingController, ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import type { User } from 'firebase/auth';
import { UserService } from 'src/app/core/services/user.service';
import { ProfileService } from 'src/app/core/services/profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonButtons, IonButton, IonIcon, IonAvatar, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ReactiveFormsModule,
    // structural directives
    NgIf
  ]
})
export class ProfilePage implements OnInit {
  user: User | null = null;

  private profileService = inject(ProfileService);
  private fb = inject(FormBuilder);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required]
  });

  isSaving = false;
  profileImagePreview: string | null = null;
  selectedImageFile: File | null = null;

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  async selectImage() {
    try {
      const dataUrl = await this.profileService.takePhotoFallback();
      if (dataUrl) {
        this.profileImagePreview = dataUrl;
        this.selectedImageFile = null;
      }
    } catch (e) {
      console.error('takePhoto failed', e);
    }
  }

  async openPwaCameraModal() {
    try {
      // create the element dynamically so we don't need CUSTOM_ELEMENTS_SCHEMA in the component metadata
      const modalEl = document.createElement('pwa-camera-modal') as any;

      const handler = async (ev: any) => {
        try {
          const detail = ev?.detail;
          if (!detail) return;

          let dataUrl: string | null = null;
          if (typeof detail === 'string') {
            dataUrl = detail.startsWith('data:') ? detail : null;
          } else if (detail instanceof Blob) {
            dataUrl = await this.profileService.fileToDataUrl(new File([detail], 'photo.jpg', { type: detail.type }));
          } else if (detail && typeof detail === 'object') {
            if (typeof detail.dataUrl === 'string') dataUrl = detail.dataUrl;
            else if (typeof detail.base64 === 'string') dataUrl = `data:image/jpeg;base64,${detail.base64}`;
            else if (detail.blob instanceof Blob) dataUrl = await this.profileService.fileToDataUrl(new File([detail.blob], 'photo.jpg', { type: detail.blob.type }));
          }

          if (dataUrl) {
            this.profileImagePreview = dataUrl;
            this.selectedImageFile = null;

            // Auto-upload after capture
            await this.performUploadAfterCapture();
          }
        } catch (err) {
          console.error('Error handling photo event', err);
        } finally {
          modalEl.removeEventListener('onPhoto', handler);
          // dismiss and remove the element
          try { await modalEl.dismiss(); } catch {}
          if (modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
        }
      };

      modalEl.addEventListener('onPhoto', handler);

      // append to body and present
      document.body.appendChild(modalEl);
      if (typeof modalEl.present === 'function') {
        await modalEl.present();
      } else {
        // fallback if present isn't available
        const dataUrl = await this.profileService.takePhotoFallback();
        if (dataUrl) {
          this.profileImagePreview = dataUrl;
          this.selectedImageFile = null;
          await this.performUploadAfterCapture();
        }
        modalEl.removeEventListener('onPhoto', handler);
        if (modalEl.parentNode) modalEl.parentNode.removeChild(modalEl);
      }
    } catch (e) {
      console.error('openPwaCameraModal error', e);
    }
  }

  private async performUploadAfterCapture() {
    if (!this.user) return;
    // show loading
    const loading = await this.loadingCtrl.create({ message: 'Upload en cours...' });
    await loading.present();
    try {
      await this.updateProfilePhoto();
      const toast = await this.toastCtrl.create({ message: 'Photo mise à jour', duration: 2000, color: 'success' });
      await toast.present();
    } catch (err) {
      console.error('Auto upload failed', err);
      const toast = await this.toastCtrl.create({ message: 'Erreur lors de l\'upload', duration: 3000, color: 'danger' });
      await toast.present();
    } finally {
      await loading.dismiss();
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
      if (user) {
        const parts = (user.displayName || '').split(' ');
        this.form.patchValue({ firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') ?? '' });
        this.profileImagePreview = user.photoURL ?? null;
      }
    });
  }

  async logout() {
    await this.userService.logout();
    await this.router.navigate(['/login']);
  }

  async updateProfilePhoto() {
    if (!this.user) return;
    this.isSaving = true;
    try {
      let dataUrl: string | null = null;
      if (this.selectedImageFile) {
        dataUrl = await this.profileService.fileToDataUrl(this.selectedImageFile);
      } else if (this.profileImagePreview) {
        dataUrl = this.profileImagePreview;
      }

      let downloadUrl: string | undefined;
      if (dataUrl) {
        downloadUrl = await this.profileService.uploadProfilePhoto(this.user.uid, dataUrl);
      }

      const updates: any = {};
      if (this.form.value.firstName) updates.firstName = this.form.value.firstName;
      if (this.form.value.lastName) updates.lastName = this.form.value.lastName;
      if (downloadUrl) updates.photoURL = downloadUrl;

      await this.profileService.updateProfileData(this.user.uid, updates);
    } catch (e) {
      console.error('updateProfilePhoto error', e);
    } finally {
      this.isSaving = false;
    }
  }

  // file input handler
  async onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.selectedImageFile = input.files[0];
    this.profileImagePreview = await this.profileService.fileToDataUrl(this.selectedImageFile);
  }

}
