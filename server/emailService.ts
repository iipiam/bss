import nodemailer from 'nodemailer';

interface TicketEmailData {
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  userId: string;
  userName?: string;
  createdAt: string;
}

export async function sendTicketNotificationEmail(ticketData: TicketEmailData): Promise<void> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM || smtpUser;
  const itEmail = process.env.IT_EMAIL || 'IT@saudikinzhal.org';

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('Email configuration missing. Skipping email notification.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .info-row { margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }
        .info-label { font-weight: bold; color: #667eea; }
        .priority-badge { 
          display: inline-block; 
          padding: 4px 12px; 
          border-radius: 12px; 
          font-size: 12px; 
          font-weight: bold; 
        }
        .priority-urgent { background: #fee2e2; color: #dc2626; }
        .priority-high { background: #fef3c7; color: #d97706; }
        .priority-medium { background: #dbeafe; color: #2563eb; }
        .priority-low { background: #f3f4f6; color: #6b7280; }
        .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Support Ticket Created</h1>
          <p style="margin: 0; opacity: 0.9;">Ticket #${ticketData.ticketNumber}</p>
        </div>
        <div class="content">
          <div class="ticket-info">
            <div class="info-row">
              <span class="info-label">Ticket Number:</span>
              <span>${ticketData.ticketNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Subject:</span>
              <span>${ticketData.subject}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Category:</span>
              <span>${ticketData.category}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Priority:</span>
              <span class="priority-badge priority-${ticketData.priority}">${ticketData.priority.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Created By:</span>
              <span>${ticketData.userName || ticketData.userId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Created At:</span>
              <span>${new Date(ticketData.createdAt).toLocaleString('en-US', { 
                dateStyle: 'full', 
                timeStyle: 'short' 
              })}</span>
            </div>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Description:</h3>
            <p style="white-space: pre-wrap; line-height: 1.8;">${ticketData.description}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; margin-bottom: 15px;">Please log in to the BlindSpot System (BSS) to respond to this ticket.</p>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification from BlindSpot System (BSS) Support</p>
          <p>© ${new Date().getFullYear()} BlindSpot System - Business Management Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"BSS Support" <${emailFrom}>`,
    to: itEmail,
    subject: `[New Ticket] ${ticketData.ticketNumber} - ${ticketData.subject}`,
    html: emailHtml,
    text: `
New Support Ticket Created

Ticket Number: ${ticketData.ticketNumber}
Subject: ${ticketData.subject}
Category: ${ticketData.category}
Priority: ${ticketData.priority}
Created By: ${ticketData.userName || ticketData.userId}
Created At: ${new Date(ticketData.createdAt).toLocaleString()}

Description:
${ticketData.description}

Please log in to the BlindSpot System (BSS) to respond to this ticket.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email notification sent for ticket ${ticketData.ticketNumber}`);
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // Don't throw error - ticket creation should succeed even if email fails
  }
}
