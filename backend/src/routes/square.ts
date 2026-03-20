import { Hono } from "hono";

const squareRouter = new Hono();

const isSandbox = (process.env.SQUARE_APP_ID ?? '').startsWith('sandbox');

const SQUARE_BASE = isSandbox
  ? 'https://connect.squareupsandbox.com'
  : 'https://connect.squareup.com';

squareRouter.post("/checkout", async (c) => {
  const body = await c.req.json<{ name?: string; email?: string; amountCents?: number; note?: string }>();

  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;

  if (!token || !locationId) {
    return c.json({ error: "Square not configured" }, 500);
  }

  const idempotencyKey = `afeeree-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const payload = {
    idempotency_key: idempotencyKey,
    order: {
      location_id: locationId,
      line_items: [
        {
          name: "AFeeree Certification Program",
          quantity: "1",
          base_price_money: {
            amount: body.amountCents ?? 60000,
            currency: "USD",
          },
        },
      ],
      ...(body.name || body.email ? {
        fulfillments: [{
          type: "DIGITAL",
          digital_fulfillment_details: {
            recipient: {
              display_name: body.name ?? "",
              email_address: body.email ?? "",
            },
          },
        }],
      } : {}),
    },
    checkout_options: {
      redirect_url: "https://afeeree.com",
      ask_for_shipping_address: false,
    },
    ...(body.email ? {
      pre_populated_data: {
        buyer_email: body.email,
      },
    } : {}),
  };

  const response = await fetch(`${SQUARE_BASE}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Square-Version": "2024-01-18",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json() as {
    payment_link?: { url: string; id: string };
    errors?: Array<{ detail: string }>;
  };

  if (!response.ok || !data.payment_link) {
    console.error("[Square] Error:", JSON.stringify(data.errors));
    return c.json({ error: data.errors?.[0]?.detail ?? "Checkout creation failed" }, 500);
  }

  return c.json({ url: data.payment_link.url });
});

export { squareRouter };
