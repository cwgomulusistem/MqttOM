
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

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

declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data?: any) => void;
      invoke: (channel: string, data?: any) => Promise<any>;
      on: (channel: string, func: (...args: any[]) => void) => () => void;
      loadCredentials: () => Promise<any>;
      saveCredentials: (credentials: any) => void;
    };
  }
}

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
export class LoginComponent implements OnInit {
  // Services
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private mqttService = inject(MqttService);
  private deviceDataService = inject(DeviceDataService);

  // State
  public connectionState$ = this.mqttService.connectionState$;
  public hidePassword = true;
  public fileName: string | null = null;

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
    this.connectionState$.subscribe(state => {
      if (state === 'Error') {
        this.snackBar.open('Connection Failed. Please check the details and try again.', 'Close', {
          duration: 5000,
          panelClass: 'error-snackbar',
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadSavedCredentials();
  }

  async loadSavedCredentials(): Promise<void> {
    if (window.electronAPI) {
      const credentials = await window.electronAPI.loadCredentials();
      if (credentials) {
        this.loginForm.patchValue(credentials);
        // Otomatik bağlanma
        // this.connect();
      }
    }
  }

  onFileSelected(event: Event): void {
    console.log('onFileSelected triggered.');
    const element = event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.fileName = file.name;
      console.log('File selected:', this.fileName);
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('FileReader onload triggered.');
        const rawContent = reader.result as string;
        console.log('Raw file content:', rawContent.substring(0, 200) + '...'); // İlk 200 karakteri göster
        try {
          const content = JSON.parse(rawContent);
          console.log('JSON content parsed:', content);
          console.log('Data being set to DeviceDataService:', content.data);
          this.deviceDataService.setDeviceData(content.data); // JSON'daki 'data' dizisini al
          this.snackBar.open('Device data loaded successfully!', 'Close', { duration: 3000 });
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          this.snackBar.open('Failed to parse device data. Invalid JSON.', 'Close', { duration: 5000 });
        }
      };
      reader.readAsText(file);
    } else {
      this.fileName = null;
      this.deviceDataService.setDeviceData([]);
      console.log('No file selected or file list empty.');
    }
  }

  connect(): void {
    if (this.loginForm.valid) {
      const { hostname, port, protocol, tenant, username, password } = this.loginForm.getRawValue();
      const credentialsToSave = { hostname, port, protocol, tenant, username, password };

      this.mqttService.connect({
        host: hostname!,
        port: port!,
        protocol: protocol as 'ws' | 'wss' | 'mqtt' | 'mqtts',
        username: username || undefined,
        password: password || undefined,
      });
      // Tenant bilgisini DeviceDataService'e kaydet
      this.deviceDataService.setTenant(tenant!);

      // Başarılı bağlantıdan sonra kimlik bilgilerini kaydet
      this.mqttService.connectionState$.subscribe(state => {
        if (state === 'Connected') {
          if (window.electronAPI) {
            window.electronAPI.saveCredentials(credentialsToSave);
          }
        }
      });
    }
  }

  togglePasswordVisibility(event: MouseEvent): void {
    event.stopPropagation();
    this.hidePassword = !this.hidePassword;
  }
}
