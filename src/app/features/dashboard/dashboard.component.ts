
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';

// Core Services & Components
import { MqttService } from '../../core/services/mqtt.service';
import { DeviceListComponent } from './components/device-list/device-list.component';
import { TopicMonitorComponent } from './components/topic-monitor/topic-monitor.component';
import { PublisherComponent } from './components/publisher/publisher.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    DeviceListComponent,
    TopicMonitorComponent,
    PublisherComponent, // Import the final component
  ],
})
export class DashboardComponent {
  // Services
  private router = inject(Router);
  private mqttService = inject(MqttService);

  // State
  public connectionState = toSignal(this.mqttService.connectionState$);

  /**
   * Disconnects from the MQTT broker and navigates back to the login page.
   */
  disconnect(): void {
    this.mqttService.disconnect();
    this.router.navigate(['/login']);
  }
}
