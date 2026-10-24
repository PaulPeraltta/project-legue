/**
 * Vercel Serverless Function: Envío de formulario de contacto con Resend
 * Endpoint: POST /api/contact
 *
 * Variables de entorno requeridas:
 * - RESEND_API_KEY: Clave de API de Resend (https://resend.com/api-keys)
 * - CONTACT_TO_EMAIL: Casilla de destino donde se recibirán las consultas
 * - CONTACT_FROM_EMAIL: Remitente verificado en Resend (por defecto: 'LeGué Estudio Jurídico <contacto@legueabogados.com.ar>')
 */

// Memoria volátil para limitación básica de abuso por IP (en el contexto de la función)
const ipRequestHistory = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const MAX_REQUESTS_PER_WINDOW = 5;

// Saneamiento de caracteres especiales para prevenir inyección HTML en el cuerpo del correo
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Extracción de IP del cliente
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket ? req.socket.remoteAddress : 'unknown';
}

// Limpieza periódica de entradas vencidas de rate limiting
function cleanRateLimitHistory(now) {
  for (const [ip, timestamps] of ipRequestHistory.entries()) {
    const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) {
      ipRequestHistory.delete(ip);
    } else {
      ipRequestHistory.set(ip, valid);
    }
  }
}

module.exports = async function handler(req, res) {
  // 1. Control de método HTTP (únicamente POST)
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      ok: false,
      message: 'Método no permitido. Solo se aceptan solicitudes POST.'
    });
  }

  // 2. Control básico de abuso por IP
  const clientIp = getClientIp(req);
  const now = Date.now();
  cleanRateLimitHistory(now);

  const ipHistory = ipRequestHistory.get(clientIp) || [];
  const recentRequests = ipHistory.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      ok: false,
      message: 'Demasiadas consultas enviadas recientemente. Por favor, aguardá unos minutos antes de intentar de nuevo o comunicate directamente por WhatsApp.'
    });
  }

  recentRequests.push(now);
  ipRequestHistory.set(clientIp, recentRequests);

  try {
    // 3. Procesamiento y parseo del cuerpo de la solicitud
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    // 4. Honeypot anti-spam: si el campo trampa tiene contenido, fingimos éxito
    if (body._gotcha && String(body._gotcha).trim().length > 0) {
      return res.status(200).json({
        ok: true,
        message: '¡Muchas gracias! Tu consulta fue recibida correctamente.'
      });
    }

    // 5. Validación y sanitización de campos requeridos
    const fullname = typeof body.fullname === 'string' ? body.fullname.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const telefono = typeof body.telefono === 'string' ? body.telefono.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!fullname || !email || !telefono || !message) {
      return res.status(400).json({
        ok: false,
        message: 'Por favor, completá todos los campos obligatorios del formulario.'
      });
    }

    if (fullname.length < 2 || fullname.length > 120) {
      return res.status(400).json({
        ok: false,
        message: 'Por favor, ingresá un nombre y apellido válido (entre 2 y 120 caracteres).'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (email.length > 120 || !emailRegex.test(email)) {
      return res.status(400).json({
        ok: false,
        message: 'Por favor, ingresá una dirección de correo electrónico válida.'
      });
    }

    if (telefono.length < 6 || telefono.length > 40) {
      return res.status(400).json({
        ok: false,
        message: 'Por favor, ingresá un número de teléfono válido (entre 6 y 40 caracteres).'
      });
    }

    if (message.length < 10 || message.length > 3000) {
      return res.status(400).json({
        ok: false,
        message: 'El mensaje debe tener entre 10 y 3000 caracteres.'
      });
    }

    // 6. Comprobación de variables de entorno de Resend
    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL || 'legueabogados@gmail.com';
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'LeGué Estudio Jurídico <contacto@legueabogados.com.ar>';

    if (!apiKey) {
      console.warn(
        '[API /contact] Configuración incompleta en el servidor: falta RESEND_API_KEY en variables de entorno.'
      );
      return res.status(500).json({
        ok: false,
        message: 'El servicio de contacto por email está en proceso de configuración. Por favor, realizá tu consulta directamente a través de nuestro botón de WhatsApp.'
      });
    }

    // 7. Preparación de contenido seguro del correo
    const safeName = escapeHtml(fullname);
    const safeEmail = escapeHtml(email);
    const safeTelefono = escapeHtml(telefono);
    const safeMessage = escapeHtml(message);
    const dateFormatted = new Date().toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const emailSubject = `Nueva consulta web: ${fullname} – LeGué Estudio Jurídico`;

    const emailText = `NUEVA CONSULTA DESDE EL SITIO WEB
----------------------------------------
Fecha: ${dateFormatted}
Nombre y apellido: ${fullname}
Email: ${email}
Teléfono: ${telefono}

Mensaje:
${message}
----------------------------------------
Respondé directamente a este correo para escribirle a ${email}.
Sitio web: https://legueabogados.com.ar/`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Nueva consulta web</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f4f3; color: #222222; margin: 0; padding: 24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e8e2de;">
    <!-- Encabezado con color de marca -->
    <tr>
      <td style="background-color: #701b31; padding: 28px 32px; text-align: left;">
        <h1 style="color: #ffffff; font-size: 20px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">LeGué | Estudio Jurídico</h1>
        <p style="color: rgba(255, 255, 255, 0.85); font-size: 13px; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 1.5px;">Nueva consulta recibida desde la web</p>
      </td>
    </tr>

    <!-- Datos del remitente -->
    <tr>
      <td style="padding: 28px 32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px; line-height: 1.6;">
          <tr>
            <td style="padding: 6px 0; color: #777777; width: 140px; font-weight: 500;">Fecha y hora:</td>
            <td style="padding: 6px 0; color: #222222; font-weight: 600;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #777777; font-weight: 500;">Remitente:</td>
            <td style="padding: 6px 0; color: #222222; font-weight: 600;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #777777; font-weight: 500;">Email:</td>
            <td style="padding: 6px 0;"><a href="mailto:${safeEmail}" style="color: #701b31; text-decoration: underline; font-weight: 600;">${safeEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #777777; font-weight: 500;">Teléfono:</td>
            <td style="padding: 6px 0;"><a href="tel:${safeTelefono}" style="color: #701b31; text-decoration: underline; font-weight: 600;">${safeTelefono}</a></td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Cuerpo del mensaje -->
    <tr>
      <td style="padding: 0 32px 28px;">
        <div style="background-color: #faf8f7; border-left: 4px solid #701b31; padding: 18px 20px; border-radius: 4px; margin-top: 8px;">
          <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #701b31;">Motivo de consulta:</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #333333; white-space: pre-wrap;">${safeMessage}</p>
        </div>
      </td>
    </tr>

    <!-- Pie del email -->
    <tr>
      <td style="background-color: #f2eeeb; padding: 16px 32px; font-size: 12px; color: #666666; text-align: center; border-top: 1px solid #e8e2de;">
        <p style="margin: 0;">Podés responder directamente a este correo para comunicarte con <strong>${safeName}</strong>.</p>
        <p style="margin: 6px 0 0; color: #888888;">Generado automáticamente desde <a href="https://legueabogados.com.ar/" style="color: #701b31; text-decoration: underline;">legueabogados.com.ar</a></p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

    // 8. Solicitud a la API de Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml
      })
    });

    const resendData = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      console.warn(
        `[API /contact] Resend respondió con error ${resendResponse.status}: ${resendData.message || 'Error desconocido'}`
      );
      return res.status(502).json({
        ok: false,
        message: 'No pudimos despachar tu consulta en este momento. Por favor, intentá nuevamente o comunicate por WhatsApp.'
      });
    }

    // 9. Respuesta exitosa
    return res.status(200).json({
      ok: true,
      message: '¡Muchas gracias! Tu consulta fue enviada con éxito. Te responderemos a la brevedad.'
    });
  } catch (error) {
    console.error('[API /contact] Error inesperado en el procesamiento:', error.message || error);
    return res.status(500).json({
      ok: false,
      message: 'Ocurrió un error al procesar tu consulta. Por favor, intentá nuevamente o contactanos por WhatsApp.'
    });
  }
};
