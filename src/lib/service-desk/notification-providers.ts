import type { NotificationChannel } from "@prisma/client";

export type NotificationProviderMessage = {
  notificationId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  recipient: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
};

export type NotificationDeliveryAttemptResult = {
  ok: boolean;
  provider: string;
  providerMessageId?: string;
  error?: string;
};

export interface NotificationProvider {
  readonly channel: NotificationChannel;
  send(message: NotificationProviderMessage): Promise<NotificationDeliveryAttemptResult>;
}

export class LocalNotificationProvider implements NotificationProvider {
  constructor(readonly channel: NotificationChannel) {}

  async send(message: NotificationProviderMessage): Promise<NotificationDeliveryAttemptResult> {
    return {
      ok: true,
      provider: "local-stub",
      providerMessageId: `local-${message.notificationId}`,
    };
  }
}

const providerOverrides = new Map<NotificationChannel, NotificationProvider>();

export function getNotificationProvider(channel: NotificationChannel): NotificationProvider {
  return providerOverrides.get(channel) ?? new LocalNotificationProvider(channel);
}

export function setNotificationProviderForTesting(channel: NotificationChannel, provider: NotificationProvider | null) {
  if (provider) {
    providerOverrides.set(channel, provider);
    return;
  }

  providerOverrides.delete(channel);
}
