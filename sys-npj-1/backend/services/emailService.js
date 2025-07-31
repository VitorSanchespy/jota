const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function enviarEmailRecuperacao(email, token) {
  const resetLink = `http://seusite.com/reset-password?token=${token}`;
  
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Redefinição de Senha',
    html: `
      <p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
      <a href="${resetLink}">Redefinir Senha</a>
      <p>Se você não solicitou isso, ignore este email.</p>
    `
  });

  console.log('Email enviado:', info.messageId);
}

module.exports = { enviarEmailRecuperacao };