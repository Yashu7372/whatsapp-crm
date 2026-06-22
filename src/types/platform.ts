export interface Platform {
  code: string;
  displayName: string;
  enabled: boolean;
  capabilities: {
    supportsWebhookInbound: boolean;
    supportsOutboundMessaging: boolean;
    supportsPublishing: boolean;
    supportsAnalytics: boolean;
    supportsTrendCollection: boolean;
    supportsLeadSignals: boolean;
  };
}

export interface PlatformAccount {
  id: string;
  tenantId: string;
  platformCode: string;
  externalAccountId?: string;
  accountName?: string;
  accountHandle?: string;
  active: boolean;
  createdAt: string;
}
