import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, Validators } from '@angular/forms';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { getAuthErrorMessage } from 'src/app/core/utils/error-messages';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonCardContent, IonCard,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    CommonModule,
    ReactiveFormsModule, RouterLink]
})
export class LoginPage implements OnInit {
  form = this.fb.group({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
  });

  isSubmitting = false;
  authError: string | null = null;

  constructor(private fb: FormBuilder, private userService: UserService, private router: Router) {}

  ngOnInit() {}

  get email() {
    return this.form.get('email') as FormControl;
  }

  get password() {
    return this.form.get('password') as FormControl;
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authError = null;

    console.log('Attempting login with', this.email.value, this.password.value);
    

    try {
      await this.userService.login(this.email.value, this.password.value);
      console.log('Login successful');
      
      // navigate to home (adjust route if needed)
      await this.router.navigate(['/tabs/home']);
    } catch (err: any) {
      const errorCode = err?.code;
      this.authError = getAuthErrorMessage(errorCode);
    } finally {
      this.isSubmitting = false;
    }
  }

}
