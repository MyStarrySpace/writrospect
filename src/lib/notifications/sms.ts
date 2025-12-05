import Twilio from "twilio";

// Initialize Twilio client
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

export interface SMSPayload {
  to: string; // E.164 format (+1234567890)
  message: string;
}

export async function sendSMS(payload: SMSPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!twilioClient || !TWILIO_PHONE_NUMBER) {
    console.error("Twilio not configured");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const message = await twilioClient.messages.create({
      body: payload.message,
      from: TWILIO_PHONE_NUMBER,
      to: payload.to,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error("SMS send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send SMS",
    };
  }
}

// Send verification code for phone number verification
export async function sendVerificationCode(
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const message = `Your Writrospect verification code is: ${code}. This code expires in 10 minutes.`;

  const result = await sendSMS({
    to: phoneNumber,
    message,
  });

  return result;
}

// Format task reminder for SMS
export function formatTaskReminderSMS(task: {
  what: string;
  dueTime?: string | null;
  context?: string | null;
}): string {
  let message = `Reminder: ${task.what}`;
  if (task.dueTime) {
    message += ` (${task.dueTime})`;
  }
  if (task.context) {
    message += `\n\n${task.context.slice(0, 100)}`;
  }
  message += "\n\nReply DONE to mark complete, SNOOZE for 15min reminder";
  return message;
}

// Validate E.164 phone number format
export function isValidPhoneNumber(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

// Format phone number to E.164
export function formatPhoneNumber(phone: string, countryCode: string = "+1"): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If already has country code, return as-is
  if (phone.startsWith("+")) {
    return "+" + digits;
  }

  // Add country code
  return countryCode + digits;
}
