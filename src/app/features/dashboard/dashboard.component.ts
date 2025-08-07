
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// Core Services & Components
import { MqttService } from '../../core/services/mqtt.service';
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
    MatTooltipModule,
    TopicMonitorComponent,
    PublisherComponent,
  ],
})
export class DashboardComponent {
  // Services
  private router = inject(Router);
  private mqttService = inject(MqttService);

  // State
  public connectionState = toSignal(this.mqttService.connectionState$);

  /**
   * Navigates to the settings page.
   */
  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * Disconnects from the MQTT broker and returns to the login page.
   */
  disconnect(): void {
    this.mqttService.disconnect();
    this.router.navigate(['/login']);
  }
}
