
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
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

  // State
  public selectedDevice = toSignal(this.deviceStateService.selectedDevice$);

  // Form
  public publishForm = this.fb.group({
    topic: ['', [Validators.required]],
    payload: ['{}', [Validators.required]],
    qos: [0, [Validators.required]],
    retain: [false, [Validators.required]],
  });

  constructor() {
    // Effect to auto-fill the topic when a new device is selected
    effect(() => {
      const device = this.selectedDevice();
      if (device) {
        // Suggest a default topic, e.g., the log topic for the selected device
        const suggestedTopic = `${device.tenant}_${device.moduleSerial}.Log`;
        this.publishForm.get('topic')?.setValue(suggestedTopic);
      } else {
        this.publishForm.get('topic')?.setValue('');
      }
    });
  }

  /**
   * Publishes the message using the MqttService.
   */
  publishMessage(): void {
    if (this.publishForm.valid) {
      const { topic, payload, qos, retain } = this.publishForm.getRawValue();
      
      this.mqttService.publish(topic!, payload!, { 
        qos: qos as (0 | 1 | 2), 
        retain: retain! 
      });

      this.snackBar.open(`Message published to ${topic}`, 'Close', {
        duration: 3000,
      });
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
}
