import crypto from "crypto";

const LOCAL_GATEWAY = "local_gateway";
const STRIPE_CHECKOUT = "stripe_checkout";
const SUPPORTED_PAYMENT_GATEWAYS = [LOCAL_GATEWAY, STRIPE_CHECKOUT];
const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;

export function paymentGatewayInfo() {
  const provider = selectedPaymentGatewayProvider();
  const stripeConfigured = Boolean(
    process.env.PAYMENT_GATEWAY_STRIPE_SECRET_KEY
    && process.env.PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET
    && process.env.PAYMENT_GATEWAY_STRIPE_SUCCESS_URL
    && process.env.PAYMENT_GATEWAY_STRIPE_CANCEL_URL,
  );

  return {
    provider,
    supportedProviders: SUPPORTED_PAYMENT_GATEWAYS,
    configured: provider === LOCAL_GATEWAY ? true : stripeConfigured,
    localAutoComplete: provider === LOCAL_GATEWAY,
    checkoutRequiresRedirect: provider !== LOCAL_GATEWAY,
    providerWebhookEndpoint: provider === STRIPE_CHECKOUT ? "/api/payment/webhook/provider/stripe" : "/api/payment/webhook/local-gateway",
    stripe: {
      enabled: provider === STRIPE_CHECKOUT,
      secretKeyConfigured: Boolean(process.env.PAYMENT_GATEWAY_STRIPE_SECRET_KEY),
      webhookSecretConfigured: Boolean(process.env.PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET),
      successUrlConfigured: Boolean(process.env.PAYMENT_GATEWAY_STRIPE_SUCCESS_URL),
      cancelUrlConfigured: Boolean(process.env.PAYMENT_GATEWAY_STRIPE_CANCEL_URL),
      priceIdsConfigured: {
        starter: Boolean(stripePriceIdForPlan("starter")),
        pro: Boolean(stripePriceIdForPlan("pro")),
        advisor: Boolean(stripePriceIdForPlan("advisor")),
      },
    },
  };
}

export function paymentGatewayAutoCompletesCheckout() {
  return selectedPaymentGatewayProvider() === LOCAL_GATEWAY;
}

export async function createGatewayCheckoutSession({ paymentSession, plan, user, fetchImpl = globalThis.fetch }) {
  const provider = selectedPaymentGatewayProvider();
  if (provider === LOCAL_GATEWAY) {
    return {
      provider: LOCAL_GATEWAY,
      checkoutUrl: `/local-checkout/${plan.id}`,
      externalPaymentId: `local_${paymentSession.id}`,
      requiresRedirect: false,
      providerStatus: "local_ready",
    };
  }

  if (provider === STRIPE_CHECKOUT) {
    return createStripeCheckoutSession({ paymentSession, plan, user, fetchImpl });
  }

  throw new Error(`Unsupported payment gateway provider: ${provider}`);
}

export function parseProviderPaymentWebhook(providerName, options = {}) {
  const provider = normalizeProviderName(providerName);
  if (provider === STRIPE_CHECKOUT) {
    return parseStripeWebhook(options);
  }

  throw new Error(`Unsupported provider webhook: ${providerName}`);
}

export function createStripeWebhookSignature(rawBody, secret = stripeWebhookSecret(), timestamp = currentEpochSeconds()) {
  const digest = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return `t=${timestamp},v1=${digest}`;
}

async function createStripeCheckoutSession({ paymentSession, plan, user, fetchImpl }) {
  assertStripeCheckoutConfigured(plan.id);
  if (typeof fetchImpl !== "function") {
    throw new Error("Stripe Checkout requires fetch support.");
  }

  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("success_url", renderUrlTemplate(process.env.PAYMENT_GATEWAY_STRIPE_SUCCESS_URL, paymentSession));
  body.set("cancel_url", renderUrlTemplate(process.env.PAYMENT_GATEWAY_STRIPE_CANCEL_URL, paymentSession));
  body.set("client_reference_id", paymentSession.id);
  body.set("customer_email", user.email);
  body.set("line_items[0][price]", stripePriceIdForPlan(plan.id));
  body.set("line_items[0][quantity]", "1");
  body.set("metadata[stockflix_session_id]", paymentSession.id);
  body.set("metadata[user_id]", user.id);
  body.set("metadata[organization_id]", user.organizationId || "");
  body.set("metadata[plan_id]", plan.id);

  const response = await fetchImpl(stripeCheckoutSessionUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYMENT_GATEWAY_STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Stripe Checkout session failed: ${payload.error?.message || response.status}`);
  }

  if (!payload.id || !payload.url) {
    throw new Error("Stripe Checkout response must include id and url.");
  }

  return {
    provider: STRIPE_CHECKOUT,
    checkoutUrl: payload.url,
    externalPaymentId: payload.id,
    requiresRedirect: true,
    providerStatus: payload.status || "created",
  };
}

function parseStripeWebhook(options = {}) {
  const rawBody = String(options.rawBody || "");
  const body = options.body || parseJsonBody(rawBody);
  const signatureHeader = headerValue(options.headers, "stripe-signature") || options.signature || "";
  const verification = verifyStripeWebhookSignature(rawBody || JSON.stringify(body), signatureHeader);
  const stripeObject = body?.data?.object || {};
  const metadata = stripeObject.metadata || {};
  const input = {
    sessionId: metadata.stockflix_session_id || metadata.sessionId || stripeObject.client_reference_id || "",
    eventType: stripeEventTypeToPaymentEvent(body?.type),
    providerEventId: String(body?.id || `stripe_${crypto.randomUUID()}`).slice(0, 120),
    externalPaymentId: stripeObject.id || "",
    failureReason: stripeFailureReason(stripeObject, body),
  };

  return {
    provider: STRIPE_CHECKOUT,
    source: "stripe_webhook",
    input,
    verification,
  };
}

function verifyStripeWebhookSignature(rawBody, signatureHeader) {
  const parts = Object.fromEntries(String(signatureHeader || "")
    .split(",")
    .map((part) => part.trim().split("="))
    .filter(([key, value]) => key && value));
  const timestamp = normalizeTimestamp(parts.t);
  const ageSeconds = Math.abs(currentEpochSeconds() - timestamp);

  if (!signatureHeader) {
    return webhookVerificationResult("missing_signature", "Stripe-Signature header is required.", timestamp, ageSeconds, false);
  }

  if (!timestamp) {
    return webhookVerificationResult("missing_timestamp", "Stripe webhook timestamp is required.", timestamp, ageSeconds, false);
  }

  if (ageSeconds > STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
    return webhookVerificationResult("stale_timestamp", "Stripe webhook timestamp is outside the allowed tolerance.", timestamp, ageSeconds, false);
  }

  const expected = crypto
    .createHmac("sha256", stripeWebhookSecret())
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  if (!secureCompare(parts.v1, expected)) {
    return webhookVerificationResult("invalid_signature", "Stripe webhook signature is invalid.", timestamp, ageSeconds, false);
  }

  return webhookVerificationResult("verified", "Stripe webhook signature verified.", timestamp, ageSeconds, true);
}

function webhookVerificationResult(status, message, timestamp, ageSeconds, signatureVerified) {
  return {
    ok: signatureVerified,
    status,
    message,
    signatureVerified,
    timestamp,
    signedAt: timestamp ? new Date(timestamp * 1000).toISOString() : "",
    ageSeconds: Number.isFinite(ageSeconds) ? Math.round(ageSeconds) : null,
    toleranceSeconds: STRIPE_WEBHOOK_TOLERANCE_SECONDS,
  };
}

function selectedPaymentGatewayProvider() {
  const provider = normalizeProviderName(process.env.PAYMENT_GATEWAY_PROVIDER || LOCAL_GATEWAY);
  if (!SUPPORTED_PAYMENT_GATEWAYS.includes(provider)) {
    throw new Error(`Unsupported PAYMENT_GATEWAY_PROVIDER: ${provider}`);
  }
  return provider;
}

function normalizeProviderName(providerName) {
  const normalized = String(providerName || "").trim().toLowerCase();
  if (normalized === "stripe") {
    return STRIPE_CHECKOUT;
  }
  return normalized || LOCAL_GATEWAY;
}

function assertStripeCheckoutConfigured(planId) {
  const missing = [];
  if (!process.env.PAYMENT_GATEWAY_STRIPE_SECRET_KEY) missing.push("PAYMENT_GATEWAY_STRIPE_SECRET_KEY");
  if (!process.env.PAYMENT_GATEWAY_STRIPE_SUCCESS_URL) missing.push("PAYMENT_GATEWAY_STRIPE_SUCCESS_URL");
  if (!process.env.PAYMENT_GATEWAY_STRIPE_CANCEL_URL) missing.push("PAYMENT_GATEWAY_STRIPE_CANCEL_URL");
  if (!stripePriceIdForPlan(planId)) missing.push(stripePriceEnvName(planId));

  if (missing.length) {
    throw new Error(`Stripe Checkout is not configured. Missing: ${missing.join(", ")}`);
  }
}

function stripeCheckoutSessionUrl() {
  return process.env.PAYMENT_GATEWAY_STRIPE_CHECKOUT_URL || "https://api.stripe.com/v1/checkout/sessions";
}

function stripeWebhookSecret() {
  const secret = process.env.PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
  if (!secret) {
    throw new Error("Stripe webhook verification requires PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET.");
  }
  return secret;
}

function stripePriceIdForPlan(planId) {
  return process.env[stripePriceEnvName(planId)] || "";
}

function stripePriceEnvName(planId) {
  return `PAYMENT_GATEWAY_STRIPE_PRICE_${String(planId || "").trim().toUpperCase()}`;
}

function renderUrlTemplate(template, paymentSession) {
  return String(template || "")
    .replaceAll("{sessionId}", encodeURIComponent(paymentSession.id))
    .replaceAll("{planId}", encodeURIComponent(paymentSession.planId));
}

function stripeEventTypeToPaymentEvent(type) {
  const normalized = String(type || "").trim();
  if (normalized === "checkout.session.completed" || normalized === "invoice.paid") {
    return "payment.succeeded";
  }

  if (normalized === "checkout.session.async_payment_failed" || normalized === "invoice.payment_failed" || normalized === "payment_intent.payment_failed") {
    return "payment.failed";
  }

  return "payment.succeeded";
}

function stripeFailureReason(stripeObject, body) {
  return String(
    stripeObject.failure_message
    || stripeObject.last_payment_error?.message
    || body?.data?.object?.status
    || "Payment provider reported a failed payment.",
  ).slice(0, 160);
}

function headerValue(headers = {}, name) {
  if (typeof headers.get === "function") {
    return headers.get(name);
  }

  const normalizedName = String(name).toLowerCase();
  const match = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === normalizedName);
  return match?.[1] || "";
}

function parseJsonBody(rawBody) {
  try {
    return rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return {};
  }
}

function normalizeTimestamp(timestamp) {
  const value = Number(timestamp);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value > 9999999999 ? Math.floor(value / 1000) : Math.floor(value);
}

function currentEpochSeconds() {
  return Math.floor(Date.now() / 1000);
}

function secureCompare(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
