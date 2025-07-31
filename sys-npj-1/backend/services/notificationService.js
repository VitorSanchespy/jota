const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NOTIFICATION_EMAIL,
    pass: process.env.NOTIFICATION_PASSWORD,
  },
});

const sendNotification = async (to, subject, message) => {
  try {
    const mailOptions = {
      from: process.env.NOTIFICATION_EMAIL,
      to,
      subject,
      text: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Notification sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = { sendNotification };
