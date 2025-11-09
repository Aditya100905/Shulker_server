import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ email, subject, message }) => {
  if (!email) {
    throw new Error("Recipient email is undefined.");
  }

  try {
    const info = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: subject,
      text: message,
    });

    console.log("Email sent:", info);
  } catch (error) {
    console.error("Resend Email Error:", error);
  }
};

export default sendEmail;
