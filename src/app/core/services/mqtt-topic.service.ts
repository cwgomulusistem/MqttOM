import { Injectable } from '@angular/core';

// Define a type for our topics to allow for easier filtering/styling later
export interface MqttTopic {
  name: string;
  type: 'rpc' | 'device-specific' | 'general';
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class MqttTopicService {

  constructor() { }

  /**
   * Generates a list of MQTT topics for a specific device and tenant.
   * @param serialNo The device's serial number (replaces 'moduleSerial').
   * @param tenant The tenant ID.
   * @returns An array of MqttTopic objects.
   */
  generateTopicsForDevice(serialNo: string, tenant: string): MqttTopic[] {
    const topics: MqttTopic[] = [
      // --- RPC Topics (require a response) ---
      {
        name: `MQTTnet.RPC/+/${tenant}_${serialNo}.PriceChange`,
        type: 'rpc',
        description: 'Request a price change for the device.'
      },
      {
        name: `MQTTnet.RPC/+/${tenant}_${serialNo}.StartGame`,
        type: 'rpc',
        description: 'Request to start a game on the device.'
      },
      {
        name: `MQTTnet.RPC/+/${tenant}_${serialNo}.StartGameError`,
        type: 'rpc',
        description: 'Listens for errors during game start.'
      },
       {
        name: `MQTTnet.RPC/+/${tenant}_${serialNo}.TicketLoaded`,
        type: 'rpc',
        description: 'Indicates a ticket has been loaded.'
      },

      // --- Device-Specific Topics ---
      {
        name: `${tenant}_${serialNo}.FunctionalStatusChanged`,
        type: 'device-specific',
        description: 'Fires when the device\'s functional status changes.'
      },
      {
        name: `${tenant}_${serialNo}.ParametersChanged`,
        type: 'device-specific',
        description: 'Fires when device parameters are updated.'
      },
      {
        name: `${tenant}_${serialNo}.ModuleDeleted`,
        type: 'device-specific',
        description: 'Fires when the module is marked as deleted.'
      },
      { // This was previously a general topic, but now device-specific based on your request
        name: `${tenant}_${serialNo}.Log`,
        type: 'device-specific',
        description: 'Topic for device logs.'
      },
      { // This was previously a general topic, but now device-specific based on your request
        name: `${tenant}_${serialNo}.ModuleReset`,
        type: 'device-specific',
        description: 'Fires when the module is reset.'
      },

       // --- General Tenant Topics (not specific to one module) ---
      {
        name: `${tenant}.NewModuleVersionCreated`,
        type: 'general',
        description: 'Fires when a new firmware version is available for any module.'
      },
      {
        name: `${tenant}.QrStateChanged`,
        type: 'general',
        description: 'Fires when the QR payment state changes for the tenant.'
      }
    ];
    
    // Adding the control topics you listed
    topics.push({ name: `${tenant}_${serialNo}.StartGame`, type: 'device-specific', description: 'Control topic to start game.' });
    topics.push({ name: `${tenant}_${serialNo}.StartGameError`, type: 'device-specific', description: 'Control topic for game start errors.' });
    topics.push({ name: `${tenant}_${serialNo}.TicketLoaded`, type: 'device-specific', description: 'Control topic for loaded tickets.' });


    return topics;
  }
}