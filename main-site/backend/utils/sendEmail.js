import nodemailer from "nodemailer";

export const sendEmail = async ({ subject, text, html, replyTo, to }) => {
  try {
    const user = process.env.EMAIL_USER || "hello.octoinkstudios@gmail.com";
    const pass = process.env.EMAIL_PASS;
    if (!pass) {
      console.warn("⚠️ EMAIL_PASS not set, skipping email send");
      return;
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Octoink Studios" <${user}>`,
      to: to || process.env.NOTIFICATION_EMAIL || user,
      replyTo: replyTo || user,
      subject,
      text,
      html,
    });
  } catch (err) {
    console.error("❌ Send email utility error:", err.message);
  }
};
