import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

// Core Services
import { MqttService } from '../../core/services/mqtt.service';
import { CommonModule } from '@angular/common';
import { DeviceDataService } from '../../core/services/device-data.service';
import { AuthService } from '../../core/services/auth.service';

// The 'declare global' block has been removed from here.
// TypeScript will now automatically use the centralized definition
// in /src/electron-api.d.ts

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
    MatSelectModule,
    MatIconModule,
  ],
})
export class LoginComponent implements OnInit, OnDestroy {
  // Services
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private mqttService = inject(MqttService);
  private deviceDataService = inject(DeviceDataService);
  private authService = inject(AuthService);

  // State
  public connectionState$ = this.mqttService.connectionState$;
  public hidePassword = true;
  public fileName: string | null = null;
  private destroy$ = new Subject<void>();

  // Form
  public loginForm = this.fb.group({
    hostname: ['test.mosquitto.org', [Validators.required]],
    port: [8081, [Validators.required, Validators.pattern(/^[0-9]+$/)]],
    protocol: ['ws', [Validators.required]],
    tenant: ['', [Validators.required]],
    username: [''],
    password: [''],
  });

  constructor() {
    this.connectionState$
      .pipe(
        filter(state => state === 'Error'),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.snackBar.open('Connection Failed. Please check the details and try again.', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
      });
  }

  ngOnInit(): void {
    this.loadSavedCredentials();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadSavedCredentials(): Promise<void> {
    if (window.electronAPI) {
      const credentials = await window.electronAPI.loadCredentials();
      if (credentials) {
        this.loginForm.patchValue(credentials);
      }
    }
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.fileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(reader.result as string);
          this.deviceDataService.setDeviceData(content.data || []);
          this.snackBar.open('Device data loaded successfully!', 'Close', { duration: 3000 });
        } catch (error) {
          this.snackBar.open('Failed to parse device data. Invalid JSON.', 'Close', { duration: 5000 });
        }
      };
      reader.readAsText(file);
    } else {
      this.fileName = null;
      this.deviceDataService.setDeviceData([]);
    }
  }

  connect(): void {
    if (this.loginForm.invalid) {
      return;
    }
    const { hostname, port, protocol, tenant, username, password } = this.loginForm.getRawValue();

    // 1. Set tenant in the AuthService
    this.authService.setTenant(tenant!);

    // 2. Connect to MQTT
    this.mqttService.connect({
      host: hostname!,
      port: port!,
      protocol: protocol as 'ws' | 'wss' | 'mqtt' | 'mqtts',
      username: username || undefined,
      password: password || undefined,
    });

    // 3. Save credentials on successful connection (using a clean subscription)
    this.mqttService.connectionState$.pipe(
      filter(state => state === 'Connected'),
      take(1) // Take the first 'Connected' emission and then complete
    ).subscribe(() => {
      if (window.electronAPI) {
        window.electronAPI.saveCredentials({ hostname, port, protocol, tenant, username, password });
      }
    });
  }

  togglePasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword = !this.hidePassword;
  }
}
