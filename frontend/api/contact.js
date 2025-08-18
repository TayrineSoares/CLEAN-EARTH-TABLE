// backend/routes/contact.js
const express = require('express');
const { Resend } = require('resend');
const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

const CONTACT_TO = (process.env.CONTACT_TO || 'earthtabledatabase@gmail.com')
  .split(',').map(s => s.trim()).filter(Boolean);
const CONTACT_FROM = process.env.CONTACT_FROM || 'Earth Table Contact <hello@mail.earthtableco.ca>';

function escapeHtml(s = '') {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

router.post('/', async (req, res) => {
  try {
    const { name = '', email = '', message = '' } = req.body || {};
    if (!name.trim() || !email.trim() || !message.trim())
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    if (!CONTACT_TO.length) return res.status(500).json({ error: 'Contact destination not configured.' });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMsgHtml = escapeHtml(message).replace(/\n/g, '<br>');

    await resend.emails.send({
      from: CONTACT_FROM,
      to: CONTACT_TO,
      subject: `New message from ${safeName}`,
      html: `<p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p><p><strong>Message:</strong></p><p>${safeMsgHtml}</p>`,
      text: `From: ${name} <${email}>\n\nMessage:\n${message}`,
      reply_to: email,
    });

    res.json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
