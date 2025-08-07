
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { startWith, debounceTime } from 'rxjs';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips'; // Import Chips module for topic types

// Core Services
import { DeviceStateService } from '../../../../core/services/device-state.service';
import { DeviceData, DeviceDataService } from '../../../../core/services/device-data.service';
import { MqttTopic, MqttTopicService } from '../../../../core/services/mqtt-topic.service'; // Import Topic Service

// Extend the display device to include topics
interface DisplayDevice extends DeviceData {
  displayId: string;
  topics: MqttTopic[];
}

@Component({
  selector: 'app-device-list',
  standalone: true, // Make it a standalone component for modern Angular
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
    MatChipsModule, // Add chips to imports
  ],
})
export class DeviceListComponent {
  // --- Services ---
  private deviceStateService = inject(DeviceStateService);
  private deviceDataService = inject(DeviceDataService);
  private mqttTopicService = inject(MqttTopicService);

  // --- Form Controls ---
  public deviceFilterControl = new FormControl('');
  public topicFilterControl = new FormControl(''); // New control for filtering topics

  // --- State Signals ---
  private allDevices = this.deviceDataService.deviceData;
  public selectedDevice = toSignal(this.deviceStateService.selectedDevice$);

  private deviceFilterTerm = toSignal(
    this.deviceFilterControl.valueChanges.pipe(startWith(''), debounceTime(300)),
    { initialValue: '' }
  );

  private topicFilterTerm = toSignal(
    this.topicFilterControl.valueChanges.pipe(startWith(''), debounceTime(300)),
    { initialValue: '' }
  );
  
  // --- Computed Signals ---

  // 1. Computed signal to get the filtered and parsed list of devices
  public filteredDevices = computed(() => {
    const devices = this.allDevices();
    const term = this.deviceFilterTerm()?.toLowerCase() || '';
    const currentTenant = this.deviceDataService.currentTenant(); // Get current tenant value

    if (!currentTenant) return []; // Don't process if tenant isn't set

    return devices
      .filter(device => device.isConnected) // Sadece bağlı cihazları göster
      .map(device => this.createDisplayDevice(device, currentTenant))
      .filter((device): device is DisplayDevice => {
        if (!device) return false;
        // Filter by serial, branch, or game name
        return device.serialNo.toLowerCase().includes(term) ||
               (device.branchName?.toLowerCase().includes(term) ?? false) ||
               (device.gameName?.toLowerCase().includes(term) ?? false);
      })
      .sort((a, b) => a.serialNo.localeCompare(b.serialNo)); // Optional: sort the list
  });
  
  // 2. Computed signal to filter the topics of the *selected* device
  public filteredTopics = computed(() => {
    const selected = this.selectedDevice();
    const term = this.topicFilterTerm()?.toLowerCase() || '';
    
    if (!selected) return [];

    return selected.topics.filter((topic: MqttTopic) => 
        topic.name.toLowerCase().includes(term) ||
        topic.type.toLowerCase().includes(term) ||
        topic.description.toLowerCase().includes(term)
    );
  });

  /**
   * Creates a display-ready device object, including its MQTT topics.
   */
  private createDisplayDevice(device: DeviceData, tenant: string): DisplayDevice {
    const displayId = `${device.branchName || 'N/A'} - ${device.gameName || 'N/A'} (${device.serialNo})`;
    const topics = this.mqttTopicService.generateTopicsForDevice(device.serialNo, tenant);
    return { ...device, displayId, topics };
  }

  /**
   * Sets the selected device in the DeviceStateService.
   * This now implicitly makes the device's topics available for display.
   */
  selectDevice(device: DisplayDevice): void {
    if (this.selectedDevice()?.serialNo !== device.serialNo) {
      this.deviceStateService.selectedDevice$.next(device);
      this.topicFilterControl.setValue(''); // Reset topic filter on new device selection
    }
  }

  /**
   * Clears the current device selection.
   */
  clearSelection(): void {
    this.deviceStateService.selectedDevice$.next(null);
  }

  // Helper for tracking in ngFor to improve performance
  trackBySerialNo(index: number, device: DisplayDevice): string {
    return device.serialNo;
  }
}

