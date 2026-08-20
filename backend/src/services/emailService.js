const nodemailer = require('nodemailer');

const getTransporter = async () => {
  // If no SMTP settings are provided in .env, create a test Ethereal account
  if (!process.env.SMTP_HOST) {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Test Email Account Created:', testAccount.user);
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

exports.sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = await getTransporter();
    
    // In a real app, this should be the frontend URL from environment
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    
    const info = await transporter.sendMail({
      from: '"BirrWise Finance" <noreply@birrwise.com>',
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5;">BirrWise Password Reset</h2>
          <p>You recently requested to reset your password for your BirrWise account. Click the button below to reset it.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 0.9em;">If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next 15 minutes.</p>
        </div>
      `,
    });

    console.log('Message sent: %s', info.messageId);
    
    // For ethereal, we can get a preview URL
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
