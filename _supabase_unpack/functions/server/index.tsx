import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
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

// Health check endpoint
app.get("/make-server-7b8ddc1c/health", (c) => {
  return c.json({ status: "ok" });
});

// Send OTP endpoint
app.post("/make-server-7b8ddc1c/send-otp", async (c) => {
  try {
    const { email, firstName } = await c.req.json();
    
    if (!email) {
      return c.json({ success: false, message: "Email is required" }, 400);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in KV store with 10 minute expiration
    const otpKey = `otp:${email}`;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await kv.set(otpKey, JSON.stringify({ otp, expiresAt }));

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured. OTP:", otp);
      return c.json({ 
        success: true, 
        message: "OTP generated (email not sent - API key not configured)", 
        otp // Return OTP for demo purposes when email isn't configured
      });
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Shapes and Sizes <onboarding@resend.dev>",
        to: [email],
        subject: "Your Verification Code for Shapes and Sizes",
        html: `
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
                  <div class="logo">📦 Shapes and Sizes</div>
                </div>
                <div class="content">
                  <h2>Hello ${firstName || 'there'}!</h2>
                  <p>Thank you for signing up for Shapes and Sizes. To complete your registration, please use the verification code below:</p>
                  <div class="otp">${otp}</div>
                  <p style="text-align: center; color: #666;">This code will expire in 10 minutes.</p>
                  <p>If you didn't request this code, please ignore this email.</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Shapes and Sizes. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailResult);
      return c.json({ 
        success: false, 
        message: `Failed to send email: ${emailResult.message || 'Unknown error'}`,
        otp // Return OTP for demo purposes when email fails
      }, 500);
    }

    console.log("OTP email sent successfully to:", email);
    return c.json({ 
      success: true, 
      message: "OTP sent to your email address" 
    });

  } catch (error) {
    console.error("Error in send-otp endpoint:", error);
    return c.json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    }, 500);
  }
});

// Verify OTP endpoint
app.post("/make-server-7b8ddc1c/verify-otp", async (c) => {
  try {
    const { email, otp } = await c.req.json();
    
    if (!email || !otp) {
      return c.json({ success: false, message: "Email and OTP are required" }, 400);
    }

    // Retrieve stored OTP from KV store
    const otpKey = `otp:${email}`;
    const storedData = await kv.get(otpKey);
    
    if (!storedData) {
      return c.json({ success: false, message: "OTP expired or not found" }, 400);
    }

    const { otp: storedOtp, expiresAt } = JSON.parse(storedData);

    // Check if OTP has expired
    if (Date.now() > expiresAt) {
      await kv.del(otpKey);
      return c.json({ success: false, message: "OTP has expired" }, 400);
    }

    // Verify OTP
    if (otp === storedOtp) {
      // Delete OTP after successful verification
      await kv.del(otpKey);
      return c.json({ success: true, message: "OTP verified successfully" });
    } else {
      return c.json({ success: false, message: "Invalid OTP" }, 400);
    }

  } catch (error) {
    console.error("Error in verify-otp endpoint:", error);
    return c.json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    }, 500);
  }
});

// Send password reset OTP endpoint
app.post("/make-server-7b8ddc1c/send-reset-otp", async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ success: false, message: "Email is required" }, 400);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in KV store with 10 minute expiration
    const otpKey = `reset:${email}`;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    await kv.set(otpKey, JSON.stringify({ otp, expiresAt }));

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured. Reset OTP:", otp);
      return c.json({ 
        success: true, 
        message: "Reset OTP generated (email not sent - API key not configured)", 
        otp // Return OTP for demo purposes when email isn't configured
      });
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Shapes and Sizes <onboarding@resend.dev>",
        to: [email],
        subject: "Password Reset Code for Shapes and Sizes",
        html: `
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
                  <div class="logo">📦 Shapes and Sizes</div>
                </div>
                <div class="content">
                  <h2>Password Reset Request</h2>
                  <p>We received a request to reset your password. Use the verification code below to proceed:</p>
                  <div class="otp">${otp}</div>
                  <p style="text-align: center; color: #666;">This code will expire in 10 minutes.</p>
                  <div class="warning">
                    <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
                  </div>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Shapes and Sizes. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailResult);
      return c.json({ 
        success: false, 
        message: `Failed to send email: ${emailResult.message || 'Unknown error'}`,
        otp // Return OTP for demo purposes when email fails
      }, 500);
    }

    console.log("Password reset OTP email sent successfully to:", email);
    return c.json({ 
      success: true, 
      message: "Password reset code sent to your email address" 
    });

  } catch (error) {
    console.error("Error in send-reset-otp endpoint:", error);
    return c.json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    }, 500);
  }
});

// Verify password reset OTP endpoint
app.post("/make-server-7b8ddc1c/verify-reset-otp", async (c) => {
  try {
    const { email, otp } = await c.req.json();
    
    if (!email || !otp) {
      return c.json({ success: false, message: "Email and OTP are required" }, 400);
    }

    // Retrieve stored OTP from KV store
    const otpKey = `reset:${email}`;
    const storedData = await kv.get(otpKey);
    
    if (!storedData) {
      return c.json({ success: false, message: "OTP expired or not found" }, 400);
    }

    const { otp: storedOtp, expiresAt } = JSON.parse(storedData);

    // Check if OTP has expired
    if (Date.now() > expiresAt) {
      await kv.del(otpKey);
      return c.json({ success: false, message: "OTP has expired" }, 400);
    }

    // Verify OTP
    if (otp === storedOtp) {
      // Delete OTP after successful verification
      await kv.del(otpKey);
      return c.json({ success: true, message: "OTP verified successfully" });
    } else {
      return c.json({ success: false, message: "Invalid OTP" }, 400);
    }

  } catch (error) {
    console.error("Error in verify-reset-otp endpoint:", error);
    return c.json({ 
      success: false, 
      message: `Server error: ${error.message}` 
    }, 500);
  }
});

Deno.serve(app.fetch);