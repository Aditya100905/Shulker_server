import nodemailer from "nodemailer";

const sendEmail = async ({ email, subject, message }) => {
  if (!email) {
    throw new Error("Recipient email is undefined.");
  }

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    text: message,
  });
};

export default sendEmail;
