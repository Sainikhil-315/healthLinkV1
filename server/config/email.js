const nodemailer = require('nodemailer');
const logger = require('../utils/logger.js')

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Use App Password for Gmail
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email transporter verification failed:', error);
  } else {
    logger.info('Email server is ready to send messages');
  }
});

/**
 * Send email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @returns {Promise<object>} Email send result
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || `HealthLink <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent to ${to}: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    logger.error('Email send error:', error);
    throw new Error('Failed to send email');
  }
};

/**
 * Send emergency alert email to contacts
 * @param {object} data - Emergency data
 */
async function sendEmergencyAlertEmail(data) {
  const { contactEmail, contactName, patientName, location, trackingLink, eta } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .alert-box { background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        .info-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
        .label { font-weight: bold; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 EMERGENCY ALERT</h1>
        </div>
        <div class="content">
          <div class="alert-box">
            <strong>This is an automated emergency notification from HealthLink</strong>
          </div>
          
          <p>Dear ${contactName},</p>
          
          <p><strong>${patientName}</strong> has triggered an emergency alert and listed you as an emergency contact.</p>
          
          <div class="info-row">
            <span class="label">Patient:</span> ${patientName}
          </div>
          
          <div class="info-row">
            <span class="label">Location:</span> ${location.address || `${location.lat}, ${location.lng}`}
          </div>
          
          <div class="info-row">
            <span class="label">Ambulance ETA:</span> ${eta || 'Dispatching...'}
          </div>
          
          <div class="info-row">
            <span class="label">Status:</span> Ambulance has been dispatched
          </div>
          
          <center>
            <a href="${trackingLink}" class="button">📍 TRACK LIVE LOCATION</a>
          </center>
          
          <p style="margin-top: 30px;">You can track the ambulance and patient location in real-time using the link above.</p>
          
          <p style="color: #dc2626; font-weight: bold;">If you're nearby, please try to reach the location immediately.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated message from HealthLink Emergency Response System</p>
          <p>For support: support@healthlink.com | Emergency: 108</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: contactEmail,
    subject: `🚨 EMERGENCY ALERT - ${patientName} needs help`,
    html
  });
};

/**
 * Send blood request email to donor
 * @param {object} data - Blood request data
 */
async function sendBloodRequestEmail(data) {
  const { donorEmail, donorName, bloodGroup, hospitalName, hospitalAddress, patientName, urgency } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .urgent { background: #fee; border: 2px solid #dc2626; padding: 15px; margin: 20px 0; text-align: center; font-weight: bold; }
        .info-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
        .blood-type { font-size: 32px; color: #dc2626; font-weight: bold; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩸 URGENT BLOOD NEEDED</h1>
        </div>
        <div class="content">
          ${urgency === 'CRITICAL' ? '<div class="urgent">⚠️ CRITICAL - IMMEDIATE RESPONSE NEEDED</div>' : ''}
          
          <p>Dear ${donorName},</p>
          
          <p>A patient urgently needs blood donation. You have been identified as a compatible donor in the area.</p>
          
          <div class="blood-type">${bloodGroup}</div>
          
          <div class="info-row">
            <strong>Hospital:</strong> ${hospitalName}
          </div>
          
          <div class="info-row">
            <strong>Address:</strong> ${hospitalAddress}
          </div>
          
          <div class="info-row">
            <strong>Patient:</strong> ${patientName || 'Emergency case'}
          </div>
          
          <p style="margin-top: 30px; font-weight: bold;">Your blood donation can save a life today. Please respond immediately if you're available.</p>
          
          <p>Please open the HealthLink app to accept or decline this request.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: donorEmail,
    subject: `🩸 URGENT: ${bloodGroup} Blood Needed - ${hospitalName}`,
    html
  });
};

/**
 * Send volunteer request email
 * @param {object} data - Volunteer request data
 */
async function sendVolunteerRequestEmail(data) {
  const { volunteerEmail, volunteerName, location, distance, situation } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .critical { background: #fee; border: 2px solid #dc2626; padding: 20px; margin: 20px 0; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .info-row { margin: 15px 0; padding: 10px; background: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 EMERGENCY - CPR NEEDED</h1>
        </div>
        <div class="content">
          <div class="critical">
            <h2>⚠️ CRITICAL EMERGENCY</h2>
            <p style="font-size: 18px; margin: 10px 0;">Patient unconscious/not breathing</p>
          </div>
          
          <p>Dear ${volunteerName},</p>
          
          <p><strong>An emergency has occurred ${distance}m from your location. Immediate CPR may be required.</strong></p>
          
          <div class="info-row">
            <strong>Situation:</strong> ${situation}
          </div>
          
          <div class="info-row">
            <strong>Distance:</strong> ${distance}m (${Math.round(distance / 1000 * 3)} min walk)
          </div>
          
          <div class="info-row">
            <strong>Location:</strong> ${location.address || 'See app for map'}
          </div>
          
          <p style="color: #dc2626; font-weight: bold; font-size: 16px;">⏱️ Every second counts. Please open the HealthLink app immediately to accept this request.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: volunteerEmail,
    subject: '🚨 CRITICAL - CPR Needed Nearby',
    html
  });
};

/**
 * Send welcome email to new user
 * @param {object} data - User data
 */
async function sendWelcomeEmail(data) {
  const { email, name, role } = data;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Welcome to HealthLink</h1>
        </div>
        <div class="content">
          <p>Dear ${name},</p>
          
          <p>Welcome to HealthLink - Smart Emergency Response System!</p>
          
          <p>Your account has been successfully created as a <strong>${role}</strong>.</p>
          
          <p>With HealthLink, you can:</p>
          <ul>
            <li>Trigger emergency alerts instantly</li>
            <li>Track ambulances in real-time</li>
            <li>Connect with nearby volunteers and donors</li>
            <li>Receive immediate medical assistance</li>
          </ul>
          
          <p>Thank you for joining our mission to save lives.</p>
          
          <p>Stay safe,<br>Team HealthLink</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to HealthLink 🏥',
    html
  });
};

module.exports = {
  transporter,
  sendEmail,
  sendEmergencyAlertEmail,
  sendBloodRequestEmail,
  sendVolunteerRequestEmail,
  sendWelcomeEmail
};