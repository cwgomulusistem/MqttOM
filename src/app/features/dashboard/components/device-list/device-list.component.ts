import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DeviceDataService, DeviceData } from '../../../../core/services/device-data.service';
import { DeviceStateService } from '../../../../core/services/device-state.service';
import { MqttTopicService, MqttTopic } from '../../../../core/services/mqtt-topic.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface DisplayDevice extends DeviceData {
  topics: MqttTopic[];
}

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceListComponent {
  private readonly deviceDataService = inject(DeviceDataService);
  private readonly deviceStateService = inject(DeviceStateService);
  private readonly mqttTopicService = inject(MqttTopicService);
  private readonly authService = inject(AuthService);

  public readonly allDevices = this.deviceDataService.deviceData;
  public readonly selectedDevice = toSignal(this.deviceStateService.selectedDevice$, { initialValue: null });
  private readonly tenant = this.authService.tenant;

  public readonly deviceFilterControl = new FormControl('');

  public readonly filteredDevices = computed<DisplayDevice[]>(() => {
    const tenant = this.tenant();
    // Guard Clause: Only run if tenant is a valid string
    if (!tenant) {
      return [];
    }

    const devices = this.allDevices();
    const filterText = this.deviceFilterControl.value?.toLowerCase() || '';

    return devices
      .filter((device: DeviceData) => device.isConnected)
      .map((device: DeviceData) => this.createDisplayDevice(device, tenant)) // Pass tenant
      .filter((device: DisplayDevice) => {
        if (!filterText) return true;
        
        const branchNameMatch = device.branchName ? device.branchName.toLowerCase().includes(filterText) : false;
        const branchIdMatch = device.branchId ? device.branchId.toString().toLowerCase().includes(filterText) : false;

        return (
          device.serialNo.toLowerCase().includes(filterText) ||
          branchNameMatch ||
          branchIdMatch
        );
      });
  });

  public selectDevice(device: DisplayDevice): void {
    this.deviceStateService.selectedDevice$.next(device);
  }

  private createDisplayDevice(device: DeviceData, tenant: string): DisplayDevice {
    const topics = this.mqttTopicService.generateTopicsForDevice(
      device.serialNo,
      tenant
    );
    return { ...device, topics };
  }
}
