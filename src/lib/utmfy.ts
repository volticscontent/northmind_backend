import https from "https";

export interface UtmfyConversionData {
  orderId: string;
  platform: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  approvedDate: string;
  customer: {
    name: string;
    email: string;
    phone: string | null;
    document: string | null;
  };
  trackingParameters: {
    utmify_id?: string | null;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_content?: string | null;
    utm_term?: string | null;
  };
  commission: {
    totalPriceInCents: number;
    gatewayFeeInCents: number;
    userCommissionInCents: number;
  };
  products: Array<{
    id: string; // Legado / Alguns eventos
    name: string; // Legado / Alguns eventos
    planId: string; // Novo Schema
    planName: string; // Novo Schema
    quantity: number;
    priceInCents: number;
  }>;
}

export async function sendToUtmfy(data: UtmfyConversionData): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const utmfyApiKey = process.env.UTMIFY_API_KEY;
      if (!utmfyApiKey) {
        console.warn('[UTMify] API Key not configured.');
        return resolve(false);
      }

      const url = new URL(process.env.UTMIFY_WEBHOOK_URL || 'https://api.utmify.com.br/api-credentials/orders');
      const postData = JSON.stringify(data);

      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': utmfyApiKey,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      console.log(`[UTMify] 🚀 Sending ${data.status} event for ${data.orderId}`);

      const req = https.request(options, (res) => {
        let responseBody = "";
        res.on("data", (chunk) => { responseBody += chunk; });
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[UTMify] ✅ Event ${data.status} sent successfully.`);
            resolve(true);
          } else {
            console.error(`[UTMify] ❌ Error (${res.statusCode}):`, responseBody);
            resolve(false);
          }
        });
      });

      req.on("error", (error) => {
        console.error("[UTMify] ❌ Request Error:", error);
        resolve(false);
      });

      req.write(postData);
      req.end();
    } catch (error) {
      console.error("[UTMify] ❌ Critical Error:", error);
      resolve(false);
    }
  });
}
