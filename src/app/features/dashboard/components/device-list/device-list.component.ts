
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

// Define a type for the parsed client ID for better type safety
interface ParsedClientId {
  clientId: string;
  tenant: string;
  moduleSerial: string;
  softwareVersion: string;
  displayVersion: string;
  ipAddress: string;
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

  // Form Control for filtering
  public filterControl = new FormControl('');

  // State Signals
  public clients = toSignal(this.mqttService.connectedClients$, { initialValue: [] });
  public selectedDevice = toSignal(this.deviceStateService.selectedDevice$);
  
  private filterTerm = toSignal(
    this.filterControl.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
    ),
    { initialValue: '' }
  );

  // Computed signal to get the filtered and parsed list of devices
  public filteredClients = computed(() => {
    const clients = this.clients();
    const term = this.filterTerm()?.toLowerCase() || '';

    return clients
      .map(client => this.parseClientId(client.clientId))
      .filter((client): client is ParsedClientId => {
        // This is a type guard that filters out nulls and satisfies TypeScript
        if (!client) return false;
        return client.moduleSerial.toLowerCase().includes(term);
      });
  });

  /**
   * Parses the raw MQTT client ID string into a structured object.
   * @param clientId The raw client ID, e.g., "tenant@moduleSerial@swVersion@displayVersion@ip"
   * @returns A ParsedClientId object or null if parsing fails.
   */
  private parseClientId(clientId: string): ParsedClientId | null {
    if (!clientId) return null;
    const parts = clientId.split('@');
    if (parts.length < 5) return null; // Ensure all parts are present
    return {
      clientId,
      tenant: parts[0],
      moduleSerial: parts[1],
      softwareVersion: parts[2],
      displayVersion: parts[3],
      ipAddress: parts[4],
    };
  }

  /**
   * Sets the selected device in the DeviceStateService.
   * @param client The client object that was selected.
   */
  selectDevice(client: ParsedClientId): void {
    this.deviceStateService.selectedDevice$.next(client);
  }
}
