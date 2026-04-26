import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_SENDER_NAME = "Shapes and Sizes";

app.use("*", logger(console.log));

app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/make-server-7b8ddc1c/health", (c) => {
  return c.json({ status: "ok" });
});

function createOtpRecord(prefix: string, email: string, otp: string) {
  const key = `${prefix}:${email}`;
  const expiresAt = Date.now() + 10 * 60 * 1000;

  return {
    key,
    value: JSON.stringify({ otp, expiresAt }),
  };
}

async function sendBrevoEmail({
  to,
  subject,
  htmlContent,
}: {
  to: string;
  subject: string;
  htmlContent: string;
}) {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") || DEFAULT_SENDER_NAME;

  if (!apiKey || !senderEmail) {
    return {
      success: false,
      missingConfig: true,
      message: "Brevo is not configured",
    };
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      success: false,
      missingConfig: false,
      message: result?.message || result?.code || "Unknown Brevo error",
    };
  }

  return {
    success: true,
    missingConfig: false,
    message: "Email sent successfully",
  };
}

async function verifyStoredOtp(prefix: string, email: string, otp: string) {
  const key = `${prefix}:${email}`;
  const storedData = await kv.get(key);

  if (!storedData) {
    return { success: false, status: 400, message: "OTP expired or not found" };
  }

  const { otp: storedOtp, expiresAt } = JSON.parse(storedData);

  if (Date.now() > expiresAt) {
    await kv.del(key);
    return { success: false, status: 400, message: "OTP has expired" };
  }

  if (otp !== storedOtp) {
    return { success: false, status: 400, message: "Invalid OTP" };
  }

  await kv.del(key);
  return { success: true, status: 200, message: "OTP verified successfully" };
}

function buildVerificationEmail(firstName: string | undefined, otp: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 24px; font-weight: bold; color: #BE185D; }
          .content { background: #f9f9f9; border-radius: 10px; padding: 30px; margin: 20px 0; }
          .otp { font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; color: #BE185D; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Shapes and Sizes</div>
          </div>
          <div class="content">
            <h2>Hello ${firstName || "there"}!</h2>
            <p>Thank you for signing up for Shapes and Sizes. To complete your registration, please use the verification code below:</p>
            <div class="otp">${otp}</div>
            <p style="text-align: center; color: #666;">This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Shapes and Sizes. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildResetEmail(otp: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; padding: 20px 0; }
          .logo { font-size: 24px; font-weight: bold; color: #BE185D; }
          .content { background: #f9f9f9; border-radius: 10px; padding: 30px; margin: 20px 0; }
          .otp { font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 8px; color: #BE185D; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Shapes and Sizes</div>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Use the verification code below to proceed:</p>
            <div class="otp">${otp}</div>
            <p style="text-align: center; color: #666;">This code will expire in 10 minutes.</p>
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Shapes and Sizes. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

app.get("/make-server-7b8ddc1c/inventory", async (c) => {
  try {
    const products = await kv.get("inventory:products");

    return c.json({
      success: true,
      products: Array.isArray(products) ? products : [],
    });
  } catch (error) {
    console.error("Error in inventory GET endpoint:", error);
    return c.json({
      success: false,
      message: `Server error: ${error.message}`,
    }, 500);
  }
});

app.post("/make-server-7b8ddc1c/inventory", async (c) => {
  try {
    const { products } = await c.req.json();

    if (!Array.isArray(products)) {
      return c.json({ success: false, message: "Products must be an array" }, 400);
    }

    await kv.set("inventory:products", products);

    return c.json({
      success: true,
      message: "Inventory saved successfully",
    });
  } catch (error) {
    console.error("Error in inventory POST endpoint:", error);
    return c.json({
      success: false,
      message: `Server error: ${error.message}`,
    }, 500);
  }
});

app.get("/make-server-7b8ddc1c/users", async (c) => {
  try {
    const users = await kv.get("app:users");

    return c.json({
      success: true,
      users: Array.isArray(users) ? users : [],
    });
  } catch (error) {
    console.error("Error in users GET endpoint:", error);
    return c.json({
      success: false,
      message: `Server error: ${error.message}`,
    }, 500);
  }
});

app.post("/make-server-7b8ddc1c/users", async (c) => {
  try {
    const { users } = await c.req.json();

    if (!Array.isArray(users)) {
      return c.json({ success: false, message: "Users must be an array" }, 400);
    }

    await kv.set("app:users", users);

    return c.json({
      success: true,
      message: "Users saved successfully",
    });
  } catch (error) {
    console.error("Error in users POST endpoint:", error);
    return c.json({
      success: false,
      message: `Server error: ${error.message}`,
    }, 500);
  }
});

app.get("/make-server-7b8ddc1c/sales", async (c) => {
  try {
    const sales = await kv.get("app:sales");

    return c.json({
      success: true,
      sales: Array.isArray(sales) ? sales : [],
    });
  } catch (error) {
    console.error("Error in sales GET endpoint:", error);
    return c.json({
      success: false,
      message: `Server error: ${error.message}`,
    }, 500);
  }
});

app.post("/make-server-7b8ddc1c/sales", async (c) => {
  try {
    const { sales } = await c.req.json();

    if (!Array.isArray(sales)) {
      return c.json({ success: false, message: "Sales must be an array" }, 400);
    }

    await kv.set("app:sales", sales);

    return c.json({
      success: true,
      message: "Sales saved successfully",
    });
  } catch (error) {
    console.error("Error in sales POST endpoint:", error);
    return c.json({
      success: false,
      message: `Server error: ${error.message}`,
    }, 500);
  }
});

app.post("/make-server-7b8ddc1c/send-otp", async (c) => {
  try {
    const { email, firstName } = await c.req.json();

    if (!email) {
      return c.json({ success: false, message: "Email is required" }, 400);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const record = createOtpRecord("otp", email, otp);
    await kv.set(record.key, record.value);

    const emailResult = await sendBrevoEmail({
      to: email,
      subject: "Your Verification Code for Shapes and Sizes",
      htmlContent: buildVerificationEmail(firstName, otp),
    });

    if (emailResult.missingConfig) {
      console.log("Brevo not configured. OTP:", otp);
      return c.json({
        success: true,
        message: "OTP generated (email not sent - Brevo not configured)",
        otp,
      });
    }

    if (!emailResult.success) {
      console.error("Failed to send email:", emailResult.message);
      return c.json({
        success: false,
        message: `Failed to send email: ${emailResult.message}`,
        otp,
      }, 500);
    }

    console.log("OTP email sent successfully to:", email);
    return c.json({
      success: true,
      message: "OTP sent to your email address",
    });
  } catch (error) {
    console.error("Error in send-otp endpoint:", error);
    return c.json({
      success: false,
      message: `Server error: ${error.message}`,
    }, 500);
  }
});

app.post("/make-server-7b8ddc1c/verify-otp", async (c) => {
  try {
    const { email, otp } = await c.req.json();

    if (!email || !otp) {
      return c.json({ success: false, message: "Email and OTP are required" }, 400);
    }

    const result = await verifyStoredOtp("otp", email, otp);
    return c.json({ success: result.success, message: result.message }, result.status);
  } catch (error) {
    console.error("Error in verify-otp endpoint:", error);
    return c.json({
      success: false,
      message: `Server error: ${error.message}`,
    }, 500);
  }
});

app.post("/make-server-7b8ddc1c/send-reset-otp", async (c) => {
  try {
    const { email } = await c.req.json();

    if (!email) {
      return c.json({ success: false, message: "Email is required" }, 400);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const record = createOtpRecord("reset", email, otp);
    await kv.set(record.key, record.value);

    const emailResult = await sendBrevoEmail({
      to: email,
      subject: "Password Reset Code for Shapes and Sizes",
      htmlContent: buildResetEmail(otp),
    });

    if (emailResult.missingConfig) {
      console.log("Brevo not configured. Reset OTP:", otp);
      return c.json({
        success: true,
        message: "Reset OTP generated (email not sent - Brevo not configured)",
        otp,
      });
    }

    if (!emailResult.success) {
      console.error("Failed to send email:", emailResult.message);
      return c.json({
        success: false,
        message: `Failed to send email: ${emailResult.message}`,
        otp,
      }, 500);
    }

    console.log("Password reset OTP email sent successfully to:", email);
    return c.json({
      success: true,
      message: "Password reset code sent to your email address",
    });
  } catch (error) {
    console.error("Error in send-reset-otp endpoint:", error);
    return c.json({
      success: false,
      message: `Server error: ${error.message}`,
    }, 500);
  }
});

app.post("/make-server-7b8ddc1c/verify-reset-otp", async (c) => {
  try {
    const { email, otp } = await c.req.json();

    if (!email || !otp) {
      return c.json({ success: false, message: "Email and OTP are required" }, 400);
    }

    const result = await verifyStoredOtp("reset", email, otp);
    return c.json({ success: result.success, message: result.message }, result.status);
  } catch (error) {
    console.error("Error in verify-reset-otp endpoint:", error);
    return c.json({
      success: false,
      message: `Server error: ${error.message}`,
    }, 500);
  }
});

Deno.serve(app.fetch);
