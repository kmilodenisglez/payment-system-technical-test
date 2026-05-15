import { env } from '../../config/env';

export interface ProcessPaymentRequest {
  amount: number;
}

export interface ProcessPaymentResponse {
  approved: boolean;
  message: string;
  transaction_id: string | null;
  processed_at: string;
}

/**
 * Calls the Python payment-processor service.
 *
 * A 10-second AbortController timeout prevents the Node.js API from
 * hanging indefinitely if the Python service is unreachable.
 *
 * @throws {Error} when the network request fails or the service responds
 *   with a non-2xx status code.
 */
export async function processPayment(
  amount: number,
): Promise<ProcessPaymentResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${env.PYTHON_SERVICE_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount } satisfies ProcessPaymentRequest),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '(no body)');
      throw new Error(
        `Payment processor returned ${response.status}: ${body}`,
      );
    }

    return (await response.json()) as ProcessPaymentResponse;
  } finally {
    clearTimeout(timeoutId);
  }
}
