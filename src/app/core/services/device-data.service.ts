import { Injectable, signal } from '@angular/core';

export interface DeviceData {
  id: number;
  type: number;
  moduleCode: string;
  serialNo: string;
  branchGameId?: string;
  isRisingEdge: boolean;
  isFunctional: boolean;
  branchName?: string;
  gameName?: string;
  branchId?: number;
  variationName?: string;
  isConnected: boolean;
  currentModuleVersion: string;
  requiredModuleVersion: string;
  currentDisplayVersion: string;
  requiredDisplayVersion: string;
  ipAddress?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceDataService {
  public deviceData = signal<DeviceData[]>([]);

  constructor() {}

  setDeviceData(data: DeviceData[]): void {
    console.log('[DeviceDataService] setDeviceData called with:', data);
    this.deviceData.set(data);
  }

  getDeviceBySerialNo(serialNo: string): DeviceData | undefined {
    return this.deviceData().find(device => device.serialNo === serialNo);
  }
}
