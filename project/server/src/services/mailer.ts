import nodemailer, { type Transporter } from 'nodemailer';
import { config, smtpConfigured } from '../config';

let transport: Transporter | null = null;

const getTransport = (): Transporter => {
  if (transport) return transport;

  transport = smtpConfigured
    ? nodemailer.createTransport({
        host: config.mail.host,
        port: config.mail.port,
        secure: config.mail.secure,
        auth: { user: config.mail.user, pass: config.mail.pass },
      })
    : nodemailer.createTransport({ jsonTransport: true });

  return transport;
};

type Purpose = 'register' | 'reset';

const subjectFor = (purpose: Purpose) =>
  purpose === 'register' ? 'Код подтверждения регистрации' : 'Код восстановления пароля';

const htmlFor = (code: string, purpose: Purpose, name?: string) => `
  <div style="background:#f7f2e8;padding:32px;font-family:Georgia,serif;color:#17130f">
    <div style="max-width:520px;margin:0 auto;background:#fffdf8;border:1px solid #dbd1bf;padding:32px">
      <div style="font-size:12px;letter-spacing:.14em;color:#8c6836;text-transform:uppercase">Maison Lumière</div>
      <h1 style="font-size:22px;font-weight:500;margin:12px 0 8px">
        ${purpose === 'register' ? 'Подтвердите регистрацию' : 'Восстановление пароля'}
      </h1>
      <p style="font-size:14px;line-height:1.6;color:#4e463a;margin:0 0 20px">
        ${name ? `${name}, ` : ''}введите этот код в приложении. Он действует ${config.codeTtlMinutes} минут.
      </p>
      <div style="font-size:34px;letter-spacing:.28em;font-weight:600;padding:18px 0;border-top:1px solid #e9dfce;border-bottom:1px solid #e9dfce;text-align:center">
        ${code}
      </div>
      <p style="font-size:12px;color:#6b6152;margin:20px 0 0">
        Если вы не запрашивали код, просто проигнорируйте письмо.
      </p>
    </div>
  </div>`;

export async function sendCodeEmail(email: string, code: string, purpose: Purpose, name?: string) {
  const info = await getTransport().sendMail({
    from: config.mail.from,
    to: email,
    subject: `${subjectFor(purpose)} — Maison Lumière`,
    text: `Код ${purpose === 'register' ? 'подтверждения регистрации' : 'восстановления пароля'}: ${code}. Действует ${config.codeTtlMinutes} минут.`,
    html: htmlFor(code, purpose, name),
  });

  if (!smtpConfigured) {
    console.info(`[mail:dev] ${email} · ${purpose} · код ${code}`);
  }

  return info;
}
