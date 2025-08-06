
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Core Services
import { MqttService, MqttConnectionState } from '../../core/services/mqtt.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
})
export class LoginComponent {
  // Services
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private mqttService = inject(MqttService);

  // State
  public connectionState = toSignal(this.mqttService.connectionState$);
  public hidePassword = signal(true);

  // Form
  public loginForm = this.fb.group({
    hostname: ['test.mosquitto.org', [Validators.required]],
    port: [8081, [Validators.required, Validators.pattern(/^[0-9]+$/)]],
    username: [''],
    password: [''],
  });

  constructor() {
    // Effect to react to connection state changes
    effect(() => {
      const state = this.connectionState();
      if (state === 'Connected') {
        this.router.navigate(['/dashboard']);
      }
      if (state === 'Error') {
        this.snackBar.open('Connection Failed. Please check the details and try again.', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
      }
    });
  }

  /**
   * Tries to connect to the MQTT broker using the form values.
   */
  connect(): void {
    if (this.loginForm.valid) {
      const { hostname, port, username, password } = this.loginForm.getRawValue();
      this.mqttService.connect({
        hostname: hostname!,
        port: port!,
        username: username || undefined,
        password: password || undefined
      });
    }
  }

   /**
   * Toggles the visibility of the password in the input field.
   */
   togglePasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword.set(!this.hidePassword());
  }
}
