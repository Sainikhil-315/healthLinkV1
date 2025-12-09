const { sendEmail, sendEmergencyAlertEmail, sendBloodRequestEmail, sendVolunteerRequestEmail, sendWelcomeEmail } = require('../config/email.js');
const logger = require('../utils/logger.js');


/**
 * Send emergency alert to emergency contacts via email
 * @param {object} incident - Incident object
 * @param {object} patient - Patient/user object
 * @param {array} emergencyContacts - Array of emergency contacts
 */
async function sendEmergencyContactAlerts(incident, patient, emergencyContacts) {
  try {
    const trackingLink = `${process.env.CLIENT_URL}/track/${incident._id}`;

    const emailPromises = emergencyContacts.map(contact => {
      return sendEmergencyAlertEmail({
        contactEmail: contact.email || contact.phone + '@sms.gateway.com', // Fallback for SMS gateway
        contactName: contact.name,
        patientName: patient.fullName,
        location: {
          lat: incident.location.coordinates[1],
          lng: incident.location.coordinates[0],
          address: incident.location.address
        },
        trackingLink,
        eta: incident.estimatedTimes?.ambulanceETA || 'Calculating...'
      });
    });

    const results = await Promise.allSettled(emailPromises);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    logger.info(`Emergency contact emails sent: ${successCount} success, ${failCount} failed`);

    return {
      success: successCount,
      failed: failCount,
      total: emergencyContacts.length
    };
  } catch (error) {
    logger.error('Error sending emergency contact alerts:', error);
    throw error;
  }
};

/**
 * Send blood donation request email
 * @param {object} donor - Donor object
 * @param {object} hospital - Hospital object
 * @param {string} bloodGroup - Required blood group
 * @param {object} incident - Incident object
 */
async function sendBloodRequestNotification(donor, hospital, bloodGroup, incident) {
  try {
    await sendBloodRequestEmail({
      donorEmail: donor.email,
      donorName: donor.fullName,
      bloodGroup,
      hospitalName: hospital.name,
      hospitalAddress: hospital.location.address,
      patientName: incident.patient?.name || 'Emergency patient',
      urgency: incident.severity.toUpperCase()
    });

    logger.info(`Blood request email sent to ${donor.email}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending blood request email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send volunteer dispatch request email
 * @param {object} volunteer - Volunteer object
 * @param {object} incident - Incident object
 * @param {number} distance - Distance in meters
 */
async function sendVolunteerDispatchEmail(volunteer, incident, distance) {
  try {
    await sendVolunteerRequestEmail({
      volunteerEmail: volunteer.email,
      volunteerName: volunteer.fullName,
      location: {
        lat: incident.location.coordinates[1],
        lng: incident.location.coordinates[0],
        address: incident.location.address
      },
      distance,
      situation: incident.triage ?
        `${!incident.triage.isConscious ? 'Unconscious' : 'Conscious'}, ${!incident.triage.isBreathing ? 'Not breathing' : 'Breathing'}` :
        'Critical emergency'
    });

    logger.info(`Volunteer request email sent to ${volunteer.email}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending volunteer email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new user
 * @param {object} user - User object
 * @param {string} role - User role
 */
async function sendUserWelcomeEmail(user, role) {
  try {
    await sendWelcomeEmail({
      email: user.email,
      name: user.fullName || user.name,
      role: role || 'user'
    });

    logger.info(`Welcome email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send verification email
 * @param {object} user - User object
 * @param {string} otp - OTP code
 */
async function sendVerificationEmail(user, otp) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .otp-box { background: #fff; border: 2px dashed #059669; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #059669; letter-spacing: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 HealthLink Verification</h1>
          </div>
          <div class="content">
            <p>Dear ${user.fullName || user.name},</p>
            
            <p>Thank you for registering with HealthLink. Please use the following OTP to verify your account:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <p>This OTP is valid for 10 minutes.</p>
            
            <p>If you didn't request this verification, please ignore this email.</p>
            
            <p>Best regards,<br>Team HealthLink</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: 'HealthLink - Verify Your Account',
      html
    });

    logger.info(`Verification email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {object} user - User object
 * @param {string} resetToken - Password reset token
 */
async function sendPasswordResetEmail(user, resetToken) {
  try {
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Password Reset</h1>
          </div>
          <div class="content">
            <p>Dear ${user.fullName || user.name},</p>
            
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            
            <center>
              <a href="${resetLink}" class="button">Reset Password</a>
            </center>
            
            <p>This link will expire in 30 minutes.</p>
            
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <p>Best regards,<br>Team HealthLink</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: 'HealthLink - Password Reset Request',
      html
    });

    logger.info(`Password reset email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send account verification approved email
 * @param {object} user - User object
 * @param {string} accountType - Account type (volunteer, ambulance, hospital, etc.)
 */
async function sendVerificationApprovedEmail(user, accountType) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
          .success-box { background: #d1fae5; border: 2px solid #059669; padding: 20px; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Account Verified</h1>
          </div>
          <div class="content">
            <div class="success-box">
              <h2>🎉 Congratulations!</h2>
            </div>
            
            <p>Dear ${user.fullName || user.name},</p>
            
            <p>Your ${accountType} account has been verified and approved by our admin team.</p>
            
            <p>You can now start using HealthLink to save lives and respond to emergencies.</p>
            
            <p>Thank you for joining our mission to make emergency response faster and more efficient.</p>
            
            <p>Best regards,<br>Team HealthLink</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: 'HealthLink - Account Approved ✅',
      html
    });

    logger.info(`Verification approved email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending verification approved email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send incident resolution email
 * @param {object} user - User object
 * @param {object} incident - Incident object
 */
async function sendIncidentResolvedEmail(user, incident) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9fafb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Emergency Resolved</h1>
          </div>
          <div class="content">
            <p>Dear ${user.fullName || user.name},</p>
            
            <p>Your emergency incident has been successfully resolved.</p>
            
            <p><strong>Incident Summary:</strong></p>
            <ul>
              <li>Severity: ${incident.severity.toUpperCase()}</li>
              <li>Location: ${incident.location.address}</li>
              <li>Status: Resolved</li>
              <li>Resolved At: ${new Date(incident.resolvedAt).toLocaleString()}</li>
            </ul>
            
            <p>We hope you're safe now. If you need any further assistance, please don't hesitate to contact us.</p>
            
            <p>Take care,<br>Team HealthLink</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: 'HealthLink - Emergency Resolved ✅',
      html
    });

    logger.info(`Incident resolved email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    logger.error('Error sending incident resolved email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmergencyContactAlerts,
  sendBloodRequestNotification,
  sendVolunteerDispatchEmail,
  sendUserWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendVerificationApprovedEmail,
  sendIncidentResolvedEmail
};