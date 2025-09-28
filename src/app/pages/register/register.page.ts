import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonInput, IonContent, IonButton, IonText, IonItem, IonLabel, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { getAuthErrorMessage } from 'src/app/core/utils/error-messages';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonInput, IonCardContent, IonCard, IonLabel, IonItem, IonText, IonButton, IonContent, CommonModule, FormsModule, ReactiveFormsModule, RouterLink]
})
export class RegisterPage implements OnInit {

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    age: ['', [Validators.required, Validators.min(13), Validators.max(120)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isSubmitting = false;
  authError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
  }

  get firstName() { return this.form.get('firstName') as FormControl; }
  get lastName() { return this.form.get('lastName') as FormControl; }
  get age() { return this.form.get('age') as FormControl; }
  get email() { return this.form.get('email') as FormControl; }
  get password() { return this.form.get('password') as FormControl; }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.authError = null;

    const { firstName, lastName, age, email, password } = this.form.value;

    try {
      await this.userService.register({
        firstName: firstName!,
        lastName: lastName!,
        age: +age!,
        email: email!,
        password: password!
      });
      await this.router.navigate(['/login']);
    } catch (err: any) {
      const errorCode = err?.code;
      this.authError = getAuthErrorMessage(errorCode);
    } finally {
      this.isSubmitting = false;
    }
  }

}
