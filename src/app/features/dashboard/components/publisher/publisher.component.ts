import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

// Core Services
import { MqttService } from '../../../../core/services/mqtt.service';
import { DeviceStateService } from '../../../../core/services/device-state.service';
import { MqttTopic, MqttTopicService } from '../../../../core/services/mqtt-topic.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-publisher',
  templateUrl: './publisher.component.html',
  styleUrls: ['./publisher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule
  ],
})
export class PublisherComponent {
  // Services
  private fb = inject(FormBuilder);
  private mqttService = inject(MqttService);
  private deviceStateService = inject(DeviceStateService);
  private snackBar = inject(MatSnackBar);
  private mqttTopicService = inject(MqttTopicService); // Yeni
  private authService = inject(AuthService); // Yeni

  // State
  public selectedDevice = toSignal(this.deviceStateService.selectedDevice$);
  public availableTopicsForPublish = signal<MqttTopic[]>([]); // Yeni

  // Form
  public publishForm = this.fb.group({
    selectedTopic: [<MqttTopic | null>(null), [Validators.required]], // Topic nesnesini tutacak
    payload: ['', [Validators.required]],
    qos: [0, [Validators.required]],
    retain: [false, [Validators.required]],
  });

  // Varsayılan Payload
  private defaultPayload = {
    "readSpeacilValues": 0,
    "readSPIFFS": 0,
    "printVerbose": 0,
    "deleteVersions": 0,
    "deleteSPIFFS": 0,
    "debugMode": 0
  };

  constructor() {
    // Cihaz seçimi değiştiğinde topic'leri ve payload'u güncelle
    effect(() => {
      const device = this.selectedDevice();
      const tenant = this.authService.tenant();

      if (device && tenant) {
        // Cihaza özel topic'leri oluştur
        const generatedTopics = this.mqttTopicService.generateTopicsForDevice(device.serialNo, tenant);
        this.availableTopicsForPublish.set(generatedTopics);

        // Varsayılan payload'u ayarla
        this.publishForm.get('payload')?.setValue(JSON.stringify(this.defaultPayload, null, 2));

        // Eğer seçili bir topic varsa ve yeni listede yoksa sıfırla
        const currentSelectedTopic = this.publishForm.get('selectedTopic')?.value;
        if (currentSelectedTopic && !generatedTopics.some(t => t.id === currentSelectedTopic.id)) {
          this.publishForm.get('selectedTopic')?.setValue(null);
        }
      } else {
        this.availableTopicsForPublish.set([]);
        this.publishForm.get('payload')?.setValue('');
        this.publishForm.get('selectedTopic')?.setValue(null);
      }
    });
  }

  /**
   * Publishes the message using the MqttService.
   */
  publishMessage(): void {
    if (this.publishForm.valid) {
      const { selectedTopic, payload, qos, retain } = this.publishForm.getRawValue();

      if (selectedTopic) {
        this.mqttService.publish(selectedTopic.name, payload!, {
          qos: qos as (0 | 1 | 2),
          retain: retain!
        });

        this.snackBar.open(`Message published to ${selectedTopic.name}`, 'Close', {
          duration: 3000,
        });
      }
    }
  }

  /**
   * Validates if the payload is a valid JSON.
   * @returns True if the payload is not valid JSON, otherwise false.
   */
  isInvalidJson(): boolean {
    const payload = this.publishForm.get('payload')?.value;
    if (!payload) return false; // Don't show error for empty payload
    try {
      JSON.parse(payload);
      return false;
    } catch (e) {
      return true;
    }
  }

  /**
   * Compares two MqttTopic objects for equality based on their 'id' property.
   * Used by mat-select's [compareWith] input.
   */
  compareTopics(t1: MqttTopic, t2: MqttTopic): boolean {
    return t1 && t2 ? t1.id === t2.id : t1 === t2;
  }
}
