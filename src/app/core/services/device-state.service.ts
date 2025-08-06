
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DeviceStateService {
  /**
   * Holds the state of the currently selected device from the device list.
   * Components can subscribe to this BehaviorSubject to react to device changes.
   * Emits `null` when no device is selected.
   */
  public selectedDevice$ = new BehaviorSubject<any | null>(null);

  constructor() {}
}
