import crypto from 'crypto';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: {
    operation_id: string;
    original_filename: string;
    [key: string]: any;
  };
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  createdAt: string;
  lastUsed?: string;
  deliveryCount: number;
  failureCount: number;
}

class WebhookService {
  private static instance: WebhookService;
  private webhooks: WebhookEndpoint[] = [];

  private constructor() {
    this.loadWebhooks();
  }

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  private loadWebhooks() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('docnestly_webhooks');
      if (saved) {
        this.webhooks = JSON.parse(saved);
      }
    }
  }

  private saveWebhooks() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('docnestly_webhooks', JSON.stringify(this.webhooks));
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  private async deliverWebhook(
    webhook: WebhookEndpoint, 
    payload: WebhookPayload, 
    attempt: number = 1
  ): Promise<boolean> {
    const payloadString = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'DocNestly-Webhook/1.0',
      'X-DocNestly-Event': payload.event,
      'X-DocNestly-Delivery': crypto.randomUUID(),
      'X-DocNestly-Timestamp': payload.timestamp,
    };

    // Add signature if secret is provided
    if (webhook.secret) {
      const signature = this.generateSignature(payloadString, webhook.secret);
      headers['X-DocNestly-Signature'] = `sha256=${signature}`;
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        // Update success metrics
        const webhookIndex = this.webhooks.findIndex(w => w.id === webhook.id);
        if (webhookIndex !== -1) {
          this.webhooks[webhookIndex].deliveryCount++;
          this.webhooks[webhookIndex].lastUsed = new Date().toISOString();
          this.saveWebhooks();
        }
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Webhook delivery failed (attempt ${attempt}):`, error);
      
      // Retry with exponential backoff (max 3 attempts)
      if (attempt < 3) {
        const delay = Math.pow(5, attempt) * 1000; // 5s, 25s, 125s
        setTimeout(() => {
          this.deliverWebhook(webhook, payload, attempt + 1);
        }, delay);
        return false;
      }

      // Update failure metrics after final attempt
      const webhookIndex = this.webhooks.findIndex(w => w.id === webhook.id);
      if (webhookIndex !== -1) {
        this.webhooks[webhookIndex].failureCount++;
        this.saveWebhooks();
      }
      return false;
    }
  }

  async sendNotification(event: string, data: any, operationId: string, filename: string) {
    // Reload webhooks to get latest config
    this.loadWebhooks();

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: {
        operation_id: operationId,
        original_filename: filename,
        ...data,
      },
    };

    // Find active webhooks that subscribe to this event
    const relevantWebhooks = this.webhooks.filter(
      webhook => webhook.active && webhook.events.includes(event)
    );

    if (relevantWebhooks.length === 0) {
      console.log(`No active webhooks found for event: ${event}`);
      return;
    }

    console.log(`Sending ${event} notification to ${relevantWebhooks.length} webhook(s)`);

    // Send to all relevant webhooks in parallel
    const deliveryPromises = relevantWebhooks.map(webhook =>
      this.deliverWebhook(webhook, payload)
    );

    try {
      const results = await Promise.allSettled(deliveryPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
      console.log(`Webhook delivery summary: ${successCount}/${relevantWebhooks.length} successful`);
    } catch (error) {
      console.error('Error in webhook delivery:', error);
    }
  }

  // Convenience methods for common events
  async notifyCompressionComplete(data: {
    original_size: number;
    compressed_size: number;
    reduction_percentage: number;
    download_url?: string;
    expires_at?: string;
  }, operationId: string, filename: string) {
    return this.sendNotification('pdf.compressed', data, operationId, filename);
  }

  async notifyMergeComplete(data: {
    input_files: string[];
    output_filename: string;
    total_pages: number;
    download_url?: string;
    expires_at?: string;
  }, operationId: string, filename: string) {
    return this.sendNotification('pdf.merged', data, operationId, filename);
  }

  async notifySplitComplete(data: {
    total_pages: number;
    output_files: string[];
    download_urls?: string[];
    expires_at?: string;
  }, operationId: string, filename: string) {
    return this.sendNotification('pdf.split', data, operationId, filename);
  }

  async notifyConversionComplete(data: {
    from_format: string;
    to_format: string;
    output_filename: string;
    download_url?: string;
    expires_at?: string;
  }, operationId: string, filename: string) {
    return this.sendNotification('pdf.converted', data, operationId, filename);
  }

  async notifyProtectionComplete(data: {
    protection_type: 'password' | 'encryption';
    permissions?: string[];
    download_url?: string;
    expires_at?: string;
  }, operationId: string, filename: string) {
    return this.sendNotification('pdf.protected', data, operationId, filename);
  }

  async notifyUnlockComplete(data: {
    was_password_protected: boolean;
    was_encrypted: boolean;
    download_url?: string;
    expires_at?: string;
  }, operationId: string, filename: string) {
    return this.sendNotification('pdf.unlocked', data, operationId, filename);
  }

  async notifySigningComplete(data: {
    signature_type: 'digital' | 'electronic';
    signer_name?: string;
    certificate_info?: any;
    download_url?: string;
    expires_at?: string;
  }, operationId: string, filename: string) {
    return this.sendNotification('pdf.signed', data, operationId, filename);
  }

  async notifyWatermarkComplete(data: {
    watermark_type: 'text' | 'image';
    watermark_content?: string;
    position: string;
    opacity: number;
    download_url?: string;
    expires_at?: string;
  }, operationId: string, filename: string) {
    return this.sendNotification('pdf.watermarked', data, operationId, filename);
  }

  async notifyOCRComplete(data: {
    pages_processed: number;
    text_extracted: boolean;
    language_detected?: string;
    confidence_score?: number;
    download_url?: string;
    expires_at?: string;
  }, operationId: string, filename: string) {
    return this.sendNotification('pdf.ocr', data, operationId, filename);
  }

  async notifyBatchComplete(data: {
    total_files: number;
    successful_files: number;
    failed_files: number;
    operations_performed: string[];
    total_processing_time: number;
    download_urls?: string[];
    expires_at?: string;
  }, operationId: string, filename: string) {
    return this.sendNotification('batch.complete', data, operationId, filename);
  }

  async notifyBatchProgress(data: {
    total_files: number;
    completed_files: number;
    current_file: string;
    progress_percentage: number;
    estimated_time_remaining?: number;
  }, operationId: string, filename: string) {
    return this.sendNotification('batch.progress', data, operationId, filename);
  }

  async notifyError(data: {
    error_type: string;
    error_message: string;
    error_code?: string;
    operation_type: string;
    retry_possible: boolean;
  }, operationId: string, filename: string) {
    return this.sendNotification('pdf.error', data, operationId, filename);
  }
}

export const webhookService = WebhookService.getInstance();
