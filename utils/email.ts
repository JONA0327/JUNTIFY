import nodemailer from "nodemailer"

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  try {
    const transport = getTransporter()
    const html = `
      <div style="font-family:sans-serif;color:#003d7a">
        <h1 style="color:#0066cc">Juntify</h1>
        <p>Hola ${name},</p>
        <p>\u00a1Bienvenido a <strong>Juntify</strong>! Nos alegra tenerte con nosotros.</p>
        <p>Comienza a gestionar tus reuniones de manera eficiente.</p>
      </div>
    `
    await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: "Juntify",
      html,
    })
  } catch (err) {
    console.error("Error sending welcome email:", err)
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  try {
    const transport = getTransporter()
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/reset-password?token=${token}`
    const html = `
      <div style="font-family:sans-serif;color:#003d7a">
        <h1 style="color:#0066cc">Juntify</h1>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Para cambiarla haz clic en el siguiente enlace:</p>
        <p><a href="${resetLink}" style="color:#0066cc">Restablecer contraseña</a></p>
        <p>Este enlace expira en 15 minutos.</p>
      </div>
    `
    await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: 'Restablecer contraseña',
      html,
    })
  } catch (err) {
    console.error('Error sending password reset email:', err)
  }
}
