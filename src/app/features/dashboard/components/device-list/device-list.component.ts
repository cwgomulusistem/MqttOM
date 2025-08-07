
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { map, startWith, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

// Core Services
import { MqttService } from '../../../../core/services/mqtt.service';
import { DeviceStateService } from '../../../../core/services/device-state.service';
import { DeviceData, DeviceDataService } from '../../../../core/services/device-data.service';

// Define a type for our devices
interface DisplayDevice extends DeviceData {
  displayId: string;
}

@Component({
  selector: 'app-device-list',
  templateUrl: './device-list.component.html',
  styleUrls: ['./device-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
  ],
})
export class DeviceListComponent {
  // Services
  private mqttService = inject(MqttService);
  private deviceStateService = inject(DeviceStateService);
  private deviceDataService = inject(DeviceDataService);

  // Form Control for filtering
  public filterControl = new FormControl('');

  // State Signals
  public devices = this.deviceDataService.deviceData; // Cihaz verilerini DeviceDataService'ten al
  public selectedDevice = toSignal(this.deviceStateService.selectedDevice$);
  
  private filterTerm = toSignal(
    this.filterControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
    ),
    { initialValue: '' }
  );

  // Computed signal to get the filtered and parsed list of devices
  public filteredDevices = computed(() => {
    const devices = this.devices();
    const term = this.filterTerm()?.toLowerCase() || '';

    return devices
      .map(device => this.createDisplayDevice(device))
      .filter((device): device is DisplayDevice => {
        if (!device) return false;
        return device.serialNo.toLowerCase().includes(term) ||
               (device.branchName?.toLowerCase().includes(term) ?? false) ||
               (device.gameName?.toLowerCase().includes(term) ?? false);
      });
  });

  private createDisplayDevice(device: DeviceData): DisplayDevice {
    // Burada displayId'yi nasıl oluşturacağınıza karar verin
    // Örneğin: `${device.branchName || ''} - ${device.gameName || ''} (${device.serialNo})`
    const displayId = `${device.branchName || ''} - ${device.gameName || ''} (${device.serialNo})`;
    return { ...device, displayId };
  }

  /**
   * Sets the selected device in the DeviceStateService.
   * @param device The device object that was selected.
   */
  selectDevice(device: DisplayDevice): void {
    this.deviceStateService.selectedDevice$.next(device);
  }
}

