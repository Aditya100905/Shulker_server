import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

const apiKey = process.env.MAILJET_API_KEY;
const secretKey = process.env.MAILJET_SECRET;

const sendEmail = async ({ email, subject, message }) => {
  if (!email) {
    throw new Error("Recipient email is undefined.");
  }

  try {
    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization":
          "Basic " + Buffer.from(`${apiKey}:${secretKey}`).toString("base64"),
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_FROM_EMAIL,
              Name: process.env.MAILJET_FROM_NAME || "Your App",
            },
            To: [
              {
                Email: email,
              },
            ],
            Subject: subject,
            TextPart: message,
          },
        ],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Mailjet Error:", result);
      throw new Error(result?.Messages?.[0]?.Errors?.[0]?.ErrorMessage || "Failed to send email");
    }

    console.log("Email sent:", result);
  } catch (error) {
    console.error("Mailjet Email Error:", error);
  }
};

export default sendEmail;
