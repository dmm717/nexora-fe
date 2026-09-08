'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import crypto from 'node:crypto';

// eslint-disable-next-line react-doctor/server-auth-actions
export async function handleFakePayment(formData: FormData) {
  const cookieStore = await cookies();
  const hasRefreshToken = cookieStore.has('refreshToken');
  if (!hasRefreshToken) {
    redirect('/auth');
  }

  const transactionId = formData.get('transactionId') as string;
  if (!transactionId || !transactionId.startsWith('fake_')) {
    redirect('/dashboard/billing?error=invalid_transaction');
  }

  // Extract the orderId string (32 hex chars) and format it as Guid
  // e.g. fake_f6be8f2b5e9d434f91ad3776228d5093
  const hex = transactionId.substring(5); 
  if (hex.length !== 32) {
    redirect('/dashboard/billing?error=invalid_transaction');
  }

  const orderId = `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
  
  const payload = {
    eventId: crypto.randomUUID(),
    orderId: orderId,
    transactionId: transactionId,
    status: 'paid',
    occurredAt: new Date().toISOString()
  };

  const bodyString = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Sign using the secret from appsettings.Development.json
  const secret = 'nexora-local-development-only-webhook-secret';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}.${bodyString}`, 'utf8');
  const signature = hmac.digest('hex').toUpperCase();

  // Call the webhook endpoint
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5088/api/v1';
    const apiUrl = baseUrl.replace('localhost', '127.0.0.1') + '/webhooks/payments/fake';
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payment-Signature': signature,
        'X-Payment-Timestamp': timestamp
      },
      body: bodyString
    });

    if (!res.ok) {
      console.error('Webhook failed:', await res.text());
      redirect('/dashboard/billing?error=webhook_failed');
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err; // Allow Next.js redirect to bubble up
    }
    console.error('Webhook request failed:', err);
    redirect('/dashboard/billing?error=webhook_error');
  }

  // Redirect back to billing with success
  redirect('/dashboard/billing?success=true');
}
