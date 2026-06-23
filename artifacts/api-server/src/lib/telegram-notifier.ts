import { logger } from "./logger";
import { handlePremiumApproval } from "./premium-service";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || "+54 3417195165";
const TELEGRAM_API_URL = "https://api.telegram.org/bot";

interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: string;
  reply_markup?: object;
}

async function sendTelegramMessage(
  message: TelegramMessage,
  retryCount = 0,
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.warn("TELEGRAM_BOT_TOKEN not configured, skipping notification");
    return false;
  }

  try {
    const url = `${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${response.status} - ${error}`);
    }

    logger.info("Telegram message sent successfully");
    return true;
  } catch (error) {
    const err = error as Error;
    logger.error(
      { error: err.message, retryCount },
      "Failed to send Telegram message",
    );

    // Retry logic: exponential backoff
    if (retryCount < 3) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      logger.info({ delay }, `Retrying Telegram notification in ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendTelegramMessage(message, retryCount + 1);
    }

    logger.error(
      "Failed to send Telegram notification after 3 retries, giving up",
    );
    return false;
  }
}

export async function notifyPremiumRequest(
  requestId: string,
  nombre: string,
  usuario: string,
  metodo_pago: string,
): Promise<void> {
  const timestamp = new Date().toLocaleString("es-AR");
  const adminPanelLink = `${process.env.ADMIN_PANEL_URL || "http://localhost:3000/admin"}/premium`;

  const message: TelegramMessage = {
    chat_id: TELEGRAM_ADMIN_CHAT_ID,
    text: `🎬 *Nueva Solicitud PREMIUM - ENYGMA CINE*

👤 Nombre: ${nombre}
👨‍💻 Usuario: ${usuario}
💳 Método de Pago: ${metodo_pago === "transferencia" ? "Transferencia Bancaria" : "Criptomonedas"}
⏰ Timestamp: ${timestamp}

🔗 Ver en Admin Panel: ${adminPanelLink}

*Acción:* Aprueba esta solicitud si el cliente ya ha realizado el pago`,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅ Aprobar",
            callback_data: `approve_${requestId}`,
          },
          {
            text: "❌ Rechazar",
            callback_data: `reject_${requestId}`,
          },
        ],
      ],
    },
  };

  await sendTelegramMessage(message);
}

export async function notifyApprovalSuccess(usuario: string): Promise<void> {
  const message: TelegramMessage = {
    chat_id: TELEGRAM_ADMIN_CHAT_ID,
    text: `✅ *Premium Aprobado*

Usuario: ${usuario}
Estado: Activado sin publicidades`,
    parse_mode: "Markdown",
  };

  await sendTelegramMessage(message);
}

export async function handleTelegramCallback(
  callbackId: string,
  data: string,
): Promise<void> {
  logger.info({ data }, "Handling Telegram callback");

  if (data.startsWith("approve_")) {
    const requestId = data.replace("approve_", "");
    logger.info({ requestId }, "Processing approval from Telegram");

    // Note: This is a simplified version
    // In production, you would look up the request ID to get the usuario
    // For now, we're logging it as an action the admin needs to confirm in the panel
    notifyApprovalSuccess("")
      .catch((err) => logger.error({ err }, "Failed to send approval confirmation"));
  } else if (data.startsWith("reject_")) {
    const requestId = data.replace("reject_", "");
    logger.info({ requestId }, "Processing rejection from Telegram");

    // Similarly, this would look up the request and delete it
  }
}

export async function notifyAdminError(error: string): Promise<void> {
  const message: TelegramMessage = {
    chat_id: TELEGRAM_ADMIN_CHAT_ID,
    text: `⚠️ *Error en Sistema Premium*

Detalles: ${error}

Por favor revisa los logs del servidor.`,
    parse_mode: "Markdown",
  };

  await sendTelegramMessage(message);
}
