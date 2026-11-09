import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'lead' | 'campaign' | 'system' | 'security';
  read: boolean;
  actionUrl?: string;
}

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-panel.component.html',
})
export class NotificationPanelComponent {
  @Output() onClose = new EventEmitter<void>();

  activeTab: string = 'all';

  

  notifications: NotificationItem[] = [
    {
      id: '1',
      title: 'New Student Lead Verified',
      description: 'Rahul Sharma submitted admission inquiry from New Town branch.',
      time: '2m ago',
      type: 'lead',
      read: false
    },
    {
      id: '2',
      title: 'Google Ads CPC Campaign Spike',
      description: 'School Admission 2026 CTR increased by +19.8%.',
      time: '18m ago',
      type: 'campaign',
      read: false
    },
    {
      id: '3',
      title: 'Database Auto-Sync Complete',
      description: 'All 1,420 lead records successfully synchronized.',
      time: '1h ago',
      type: 'system',
      read: true
    },
    {
      id: '4',
      title: 'New Admin Login Detected',
      description: 'Successful administrative login from secure IP.',
      time: '3h ago',
      type: 'security',
      read: true
    }
  ];

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  get filteredNotifications(): NotificationItem[] {
    if (this.activeTab === 'all') return this.notifications;
    return this.notifications.filter(n => n.type === this.activeTab);
  }

  get limitedNotifications(): NotificationItem[] {
    return this.filteredNotifications.slice(0, 4); // Max 4 items, no scroll needed
  }

  markAsRead(item: NotificationItem): void {
    item.read = true;
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  clearAll(): void {
    this.notifications = [];
  }

  closePanel(): void {
    this.onClose.emit();
  }
}