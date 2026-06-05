import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-payment-provider-"));
const originalFetch = globalThis.fetch;

process.chdir(tempRoot);
process.env.PAYMENT_GATEWAY_PROVIDER = "stripe_checkout";
process.env.PAYMENT_GATEWAY_STRIPE_SECRET_KEY = "sk_test_stockflix";
process.env.PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET = "whsec_stockflix";
process.env.PAYMENT_GATEWAY_STRIPE_SUCCESS_URL = "https://stockflix.example/success?session={sessionId}&plan={planId}";
process.env.PAYMENT_GATEWAY_STRIPE_CANCEL_URL = "https://stockflix.example/cancel?session={sessionId}";
process.env.PAYMENT_GATEWAY_STRIPE_PRICE_STARTER = "price_starter";
process.env.PAYMENT_GATEWAY_STRIPE_PRICE_PRO = "price_pro";
process.env.PAYMENT_GATEWAY_STRIPE_PRICE_ADVISOR = "price_advisor";

const checkoutRequests = [];
globalThis.fetch = async (url, options = {}) => {
  const body = options.body instanceof URLSearchParams ? options.body : new URLSearchParams(String(options.body || ""));
  checkoutRequests.push({
    url,
    method: options.method,
    authorization: options.headers?.Authorization,
    mode: body.get("mode"),
    price: body.get("line_items[0][price]"),
    clientReferenceId: body.get("client_reference_id"),
    successUrl: body.get("success_url"),
    cancelUrl: body.get("cancel_url"),
  });

  return {
    ok: true,
    async json() {
      return {
        id: `cs_test_${checkoutRequests.length}`,
        url: `https://checkout.stripe.test/pay/cs_test_${checkoutRequests.length}`,
        status: "open",
      };
    },
  };
};

try {
  const auth = await import(pathToFileURL(path.join(repoRoot, "src", "services", "authService.js")).href);
  const {
    businessMetrics,
    checkoutSubscription,
    createPaymentSession,
    createStripeWebhookSignature,
    createUser,
    getBillingHistory,
    processProviderPaymentWebhook,
  } = auth;

  const owner = await createUser({
    name: "Owner",
    email: "owner@example.test",
    password: "password123",
  }).then((result) => result.user);

  const sessionResult = await createPaymentSession(owner.id, "pro");
  assertEqual(sessionResult.paymentSession.provider, "stripe_checkout", "Payment session should use Stripe provider.");
  assertEqual(sessionResult.paymentSession.requiresRedirect, true, "Stripe checkout should require redirect.");
  assertEqual(sessionResult.paymentSession.status, "pending", "Stripe checkout session should stay pending until webhook.");
  assert(sessionResult.paymentSession.checkoutUrl.includes("checkout.stripe.test"), "Stripe checkout URL should be returned to the UI.");
  assertEqual(checkoutRequests[0].mode, "subscription", "Stripe Checkout should use subscription mode.");
  assertEqual(checkoutRequests[0].price, "price_pro", "Stripe Checkout should use configured price id.");
  assert(checkoutRequests[0].successUrl.includes(encodeURIComponent(sessionResult.paymentSession.id)), "Success URL should include internal session id.");

  const checkoutResult = await checkoutSubscription(owner.id, "starter");
  assertEqual(checkoutResult.redirectRequired, true, "Checkout endpoint should return redirectRequired for Stripe.");
  assertEqual(checkoutResult.billingEvent, null, "Stripe checkout should not create invoice before provider webhook.");
  assertEqual(checkoutResult.user.subscription.status, "trialing", "Subscription should remain trialing before provider webhook.");

  const successPayload = stripePayload({
    id: "evt_provider_success",
    type: "checkout.session.completed",
    sessionId: sessionResult.paymentSession.id,
    externalPaymentId: sessionResult.paymentSession.externalPaymentId,
  });
  const success = await processProviderPaymentWebhook("stripe", signedOptions(successPayload, createStripeWebhookSignature));
  assertEqual(success.paymentSession.status, "paid", "Provider success webhook should mark session paid.");
  assertEqual(success.user.subscription.status, "active", "Provider success webhook should activate subscription.");
  assertEqual(success.webhookEvent.signatureVerified, true, "Provider success webhook should verify signature.");
  assertEqual((await getBillingHistory(owner.id)).length, 1, "Provider success should create one invoice.");

  const duplicate = await processProviderPaymentWebhook("stripe", signedOptions(successPayload, createStripeWebhookSignature));
  assertEqual(duplicate.duplicate, true, "Duplicate provider event should be reconciled.");
  assertEqual((await getBillingHistory(owner.id)).length, 1, "Duplicate provider event should not create another invoice.");

  const failedSession = await createPaymentSession(owner.id, "advisor");
  const failedPayload = stripePayload({
    id: "evt_provider_failed",
    type: "checkout.session.async_payment_failed",
    sessionId: failedSession.paymentSession.id,
    externalPaymentId: failedSession.paymentSession.externalPaymentId,
  });
  const failed = await processProviderPaymentWebhook("stripe", signedOptions(failedPayload, createStripeWebhookSignature));
  assertEqual(failed.paymentSession.status, "failed", "Provider failed webhook should mark session failed.");
  assertEqual((await getBillingHistory(owner.id)).length, 1, "Failed provider webhook should not create invoice.");

  const invalidPayload = stripePayload({
    id: "evt_provider_invalid_signature",
    type: "checkout.session.completed",
    sessionId: checkoutResult.paymentSession.id,
    externalPaymentId: checkoutResult.paymentSession.externalPaymentId,
  });
  await expectReject(
    () => processProviderPaymentWebhook("stripe", {
      rawBody: JSON.stringify(invalidPayload),
      body: invalidPayload,
      headers: { "stripe-signature": "t=1,v1=bad" },
    }),
    "Invalid provider signature should be rejected.",
  );

  const metrics = await businessMetrics();
  assertEqual(metrics.paymentGateway.provider, "stripe_checkout", "Business metrics should expose active payment provider.");
  assertEqual(metrics.paymentGateway.configured, true, "Business metrics should show Stripe configured.");
  assertEqual(metrics.rejectedWebhookEvents, 1, "Rejected provider webhook should be counted.");

  console.log(JSON.stringify({
    ok: true,
    checkoutRequests: checkoutRequests.length,
    provider: metrics.paymentGateway.provider,
    paidSession: success.paymentSession.status,
    failedSession: failed.paymentSession.status,
    rejectedWebhookEvents: metrics.rejectedWebhookEvents,
  }, null, 2));
} finally {
  globalThis.fetch = originalFetch;
  delete process.env.PAYMENT_GATEWAY_PROVIDER;
  delete process.env.PAYMENT_GATEWAY_STRIPE_SECRET_KEY;
  delete process.env.PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET;
  delete process.env.PAYMENT_GATEWAY_STRIPE_SUCCESS_URL;
  delete process.env.PAYMENT_GATEWAY_STRIPE_CANCEL_URL;
  delete process.env.PAYMENT_GATEWAY_STRIPE_PRICE_STARTER;
  delete process.env.PAYMENT_GATEWAY_STRIPE_PRICE_PRO;
  delete process.env.PAYMENT_GATEWAY_STRIPE_PRICE_ADVISOR;
  process.chdir(repoRoot);
  await fs.rm(tempRoot, { recursive: true, force: true });
}

function stripePayload({ id, type, sessionId, externalPaymentId }) {
  return {
    id,
    type,
    data: {
      object: {
        id: externalPaymentId,
        client_reference_id: sessionId,
        metadata: {
          stockflix_session_id: sessionId,
        },
      },
    },
  };
}

function signedOptions(payload, createSignature) {
  const rawBody = JSON.stringify(payload);
  return {
    rawBody,
    body: payload,
    headers: {
      "stripe-signature": createSignature(rawBody, process.env.PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET),
    },
  };
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n${JSON.stringify({ actual, expected }, null, 2)}`);
  }
}

async function expectReject(action, message) {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(message);
}
