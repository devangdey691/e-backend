const nodemailer = require("nodemailer");

// Create the transporter once
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Generic email sender function
 */
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"E-Commerce" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email Error:", error);
    throw error;
  }
};

/**
 * Send welcome email to a new user
 */
const sendWelcomeEmail = async (user) => {
    const html = `
    <div style="background:#f4f6f8;padding:40px 20px;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <div style="background:#284B63;padding:30px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;">Welcome to E-Commerce 🚀</h1>
            </div>
            <div style="padding:40px 30px;">
                <h2 style="color:#333;">Hello ${user.name},</h2>
                <p style="color:#555;font-size:16px;line-height:1.7;">
                    Thank you for joining <strong>E-Commerce</strong>.
                    Your account has been created successfully and you're now ready to explore our latest products and exclusive deals.
                </p>
                <div style="background:#f8f9fa;border-left:4px solid #284B63;padding:15px;margin:25px 0;">
                    <p style="margin:0;color:#444;">🎁 New customer benefits:</p>
                    <ul style="color:#555;">
                        <li>Fast & secure shopping</li>
                        <li>Order tracking</li>
                        <li>Exclusive discounts</li>
                        <li>Latest product updates</li>
                    </ul>
                </div>
                <div style="text-align:center;margin:35px 0;">
                    <a href="http://localhost:3000" style="background:#284B63;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">
                        Start Shopping 🛍️
                    </a>
                </div>
                <p style="color:#666;line-height:1.7;">
                    We're excited to have you with us and look forward to serving you.
                </p>
                <p style="margin-top:30px;">
                    Regards,<br>
                    <strong>E-Commerce Store Team</strong>
                </p>
            </div>
            <div style="background:#f5f5f5;padding:20px;text-align:center;color:#777;font-size:13px;">
                © ${new Date().getFullYear()} E-commerce Store. All Rights Reserved.
            </div>
        </div>
    </div>
    `;
    return sendEmail(user.email, "🎉 Welcome to E-commerce!", html);
};

/**
 * Send login notification email to a user
 */
const sendLoginEmail = async (user) => {
    const html = `
    <div style="background:#f4f6f8;padding:40px 20px;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <div style="background:#284B63;padding:30px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;">E-Commerce Store 🛡️</h1>
            </div>
            <div style="padding:40px 30px;">
                <h2 style="color:#333;">Hello ${user.name},</h2>
                <p style="color:#555;font-size:16px;line-height:1.7;">
                    We detected a new login to your account on <strong>${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} (IST)</strong>.
                </p>
                <div style="background:#fff9db;border-left:4px solid #f59f00;padding:15px;margin:25px 0;border-radius:4px;">
                    <p style="margin:0;color:#666;font-size:14px;">
                        ⚠️ If this was you, you can safely ignore this email. If you did not perform this login, please secure your account immediately or contact support.
                    </p>
                </div>
                <div style="text-align:center;margin:35px 0;">
                    <a href="http://localhost:3000" style="background:#284B63;color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;display:inline-block;">
                        Go to Store 🛍️
                    </a>
                </div>
                <p style="color:#666;line-height:1.7;">
                    If you have any questions or security concerns, do not hesitate to contact our support team.
                </p>
                <p style="margin-top:30px;">
                    Regards,<br>
                    <strong>E-Commerce Store Team</strong>
                </p>
            </div>
            <div style="background:#f5f5f5;padding:20px;text-align:center;color:#777;font-size:13px;">
                © ${new Date().getFullYear()} E-Commerce Store. All Rights Reserved.
            </div>
        </div>
    </div>
    `;
    return sendEmail(user.email, "🛡️ New Login Detected - E-Commerce Store", html);
};

/**
 * Send contact confirmation email to a customer
 */
const sendContactConfirmationEmail = async (inquiry) => {
  const html = `
    <h2>Thank you for contacting us, ${inquiry.name}!</h2>
    <p>We have received your message regarding: <strong>${inquiry.subject}</strong></p>
    <p>Here is a copy of your message:</p>
    <blockquote style="background: #f9f9f9; border-left: 10px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px;">${inquiry.message.replace(/\n/g, '<br>')}</blockquote>
    <p>Our support team will review your inquiry and get back to you as soon as possible.</p>
    <br>
    <p>Best regards,</p>
    <p><strong>MyStore Support Team</strong></p>
  `;
  return sendEmail(inquiry.email, `We received your inquiry: ${inquiry.subject}`, html);
};

/**
 * Send contact submission notification email to the admin
 */
const sendContactFormSubmissionEmail = async (inquiry) => {
  const html = `
    <h2>New Contact Inquiry Received</h2>
    <p><strong>From:</strong> ${inquiry.name} (${inquiry.email})</p>
    <p><strong>Subject:</strong> ${inquiry.subject}</p>
    <p><strong>Message:</strong></p>
    <div style="border-left: 3px solid #ccc; padding-left: 10px; margin-left: 10px;">
      ${inquiry.message.replace(/\n/g, '<br>')}
    </div>
    <br>
    <p>This inquiry has been saved to the database.</p>
  `;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  return sendEmail(adminEmail, `[New Inquiry] ${inquiry.subject}`, html);
};

/**
 * Send order confirmation email to a user
 */
const sendOrderConfirmationEmail = async (user, order) => {
    const itemsHtml = order.items.map(item => `<li>${item.name} x ${item.quantity}</li>`).join('');
    const html = `
    <div style="background:#f4f6f8;padding:40px 20px;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <div style="background:#284B63;padding:30px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;">Order Confirmed! 🎉</h1>
            </div>
            <div style="padding:40px 30px;">
                <h2 style="color:#333;">Hello ${user.name},</h2>
                <p style="color:#555;font-size:16px;line-height:1.7;">
                    Thank you for Buying Products from our Store! We will update you as per we received it and  we are currently processing it.
                </p>
                <div style="background:#f8f9fa;border-left:4px solid #284B63;padding:15px;margin:25px 0;">
                    <p style="margin:0 0 10px 0;color:#444;font-weight:bold;">Order Information:</p>
                    <p style="margin:5px 0;color:#555;"><strong>Order ID:</strong> ${order.orderId || order._id}</p>
                    <p style="margin:5px 0;color:#555;"><strong>Total:</strong> $${order.total}</p>
                    <p style="margin:5px 0;color:#555;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p style="margin:10px 0 5px 0;color:#444;font-weight:bold;">Items ordered:</p>
                    <ul style="color:#555;margin:5px 0;padding-left:20px;">
                        ${itemsHtml}
                    </ul>
                </div>
                <p style="color:#666;line-height:1.7;">
                    You will receive another update when your order status changes.
                </p>
                <p style="margin-top:30px;">
                    Regards,<br>
                    <strong>E-Commerce Store Team</strong>
                </p>
            </div>
            <div style="background:#f5f5f5;padding:20px;text-align:center;color:#777;font-size:13px;">
                © ${new Date().getFullYear()} E-Commerce Store. All Rights Reserved.
            </div>
        </div>
    </div>
    `;
    return sendEmail(user.email, `Order Confirmation - ${order.orderId || order._id}`, html);
};

/**
 * Send order status update email to a user
 */
const sendOrderStatusUpdateEmail = async (user, order) => {
    const html = `
    <div style="background:#f4f6f8;padding:40px 20px;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <div style="background:#284B63;padding:30px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;">Order Status Update 📦</h1>
            </div>
            <div style="padding:40px 30px;">
                <h2 style="color:#333;">Hello ${user.name},</h2>
                <p style="color:#555;font-size:16px;line-height:1.7;">
                    The status of your order <strong>${order.orderId || order._id}</strong> has been updated to:
                </p>
                <div style="background:#e8f4fd;border-left:4px solid #1890ff;padding:15px;margin:25px 0;border-radius:4px;">
                    <h3 style="margin:0;color:#096dd9;text-align:center;">
                        ${order.status}
                    </h3>
                </div>
                <p style="color:#666;line-height:1.7;">
                    If you have any questions about your delivery, feel free to contact our support team.
                </p>
                <p style="margin-top:30px;">
                    Regards,<br>
                    <strong>E-Commerce Store Team</strong>
                </p>
            </div>
            <div style="background:#f5f5f5;padding:20px;text-align:center;color:#777;font-size:13px;">
                © ${new Date().getFullYear()} E-Commerce Store. All Rights Reserved.
            </div>
        </div>
    </div>
    `;
    return sendEmail(user.email, `Order Status Update: ${order.status} - ${order.orderId || order._id}`, html);
};

/**
 * Send order notification email to the admin
 */
const sendAdminOrderNotificationEmail = async (user, order) => {
    const itemsHtml = order.items.map(item => `<li>${item.name} x ${item.quantity}</li>`).join('');
    const html = `
    <div style="background:#f4f6f8;padding:40px 20px;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <div style="background:#d9534f;padding:30px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;">New Order Received! 🛍️</h1>
            </div>
            <div style="padding:40px 30px;">
                <h2 style="color:#333;">New Order Placement</h2>
                <p style="color:#555;font-size:16px;line-height:1.7;">
                    A customer has placed a new order. Here are the details:
                </p>
                <div style="background:#f8f9fa;border-left:4px solid #d9534f;padding:15px;margin:25px 0;">
                    <p style="margin:0 0 10px 0;color:#444;font-weight:bold;">Customer Info:</p>
                    <p style="margin:5px 0;color:#555;"><strong>Name:</strong> ${user.name}</p>
                    <p style="margin:5px 0;color:#555;"><strong>Email:</strong> ${user.email}</p>
                    
                    <p style="margin:15px 0 10px 0;color:#444;font-weight:bold;">Order Info:</p>
                    <p style="margin:5px 0;color:#555;"><strong>Order ID:</strong> ${order.orderId || order._id}</p>
                    <p style="margin:5px 0;color:#555;"><strong>Total Amount:</strong> $${order.total}</p>
                    <p style="margin:5px 0;color:#555;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                    <p style="margin:5px 0;color:#555;"><strong>Shipping Address:</strong> ${order.address}</p>
                    <p style="margin:5px 0;color:#555;"><strong>Phone:</strong> ${order.phone}</p>
                    
                    <p style="margin:15px 0 5px 0;color:#444;font-weight:bold;">Items ordered:</p>
                    <ul style="color:#555;margin:5px 0;padding-left:20px;">
                        ${itemsHtml}
                    </ul>
                </div>
            </div>
            <div style="background:#f5f5f5;padding:20px;text-align:center;color:#777;font-size:13px;">
                © ${new Date().getFullYear()} E-Commerce Store. All Rights Reserved.
            </div>
        </div>
    </div>
    `;
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    return sendEmail(adminEmail, `[New Order Alert] ID: ${order.orderId || order._id}`, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendLoginEmail,
  sendContactConfirmationEmail,
  sendContactFormSubmissionEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendAdminOrderNotificationEmail,
};