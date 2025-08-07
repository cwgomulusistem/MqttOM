import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
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
import { MqttTopic } from '../../../../core/services/mqtt-topic.service';

@Component({
  selector: 'app-publisher',
  standalone: true,
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
    MatIconModule,
  ],
  templateUrl: './publisher.component.html',
  styleUrls: ['./publisher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublisherComponent {
  private fb = inject(FormBuilder);
  private mqttService = inject(MqttService);
  private deviceStateService = inject(DeviceStateService);
  private snackBar = inject(MatSnackBar);

  public selectedDevice = toSignal(this.deviceStateService.selectedDevice$);
  
  // Compute available topics from the selected device
  public availableTopics = computed<MqttTopic[]>(() => {
    return this.selectedDevice()?.topics ?? [];
  });

  public publishForm = this.fb.group({
    topic: ['', [Validators.required]],
    payload: ['{}', [Validators.required]],
    qos: [2, [Validators.required]], // Default QoS to 2
    retain: [false, [Validators.required]],
  });

  constructor() {
    // Disable the form by default
    this.publishForm.disable();

    // Effect to enable/disable the form based on device selection
    effect(() => {
      const device = this.selectedDevice();
      if (device && device.topics.length > 0) {
        this.publishForm.enable();
        // Reset topic selection when a new device is chosen
        this.publishForm.get('topic')?.setValue(''); 
      } else {
        this.publishForm.disable();
      }
    });
  }

  /**
   * Publishes the message using the MqttService.
   */
  publishMessage(): void {
    if (this.publishForm.invalid || this.isInvalidJson()) {
      this.snackBar.open('Please fix the errors before publishing.', 'Close', {
        duration: 3000,
        panelClass: 'error-snackbar',
      });
      return;
    }
      
    const { topic, payload, qos, retain } = this.publishForm.getRawValue();
    
    this.mqttService.publish(topic!, payload!, { 
      qos: qos as (0 | 1 | 2), 
      retain: retain! 
    });

    this.snackBar.open(`Message published to ${topic}`, 'Close', {
      duration: 3000,
      panelClass: 'success-snackbar',
    });
  }

   /**
   * Validates if the payload is a valid JSON.
   */
  isInvalidJson(): boolean {
    const payloadControl = this.publishForm.get('payload');
    if (!payloadControl?.value) return false;
    try {
      JSON.parse(payloadControl.value);
      return false;
    } catch (e) {
      return true;
    }
  }
}
