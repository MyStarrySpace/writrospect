"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Smartphone,
  Calendar,
  Clock,
  Check,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";

interface NotificationPreferences {
  pushEnabled: boolean;
  pushTaskReminders: boolean;
  pushDailyDigest: boolean;
  smsEnabled: boolean;
  smsPhoneNumber: string | null;
  smsVerified: boolean;
  smsTaskReminders: boolean;
  smsUrgentOnly: boolean;
  calendarEnabled: boolean;
  calendarAutoSync: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  reminderLeadTime: number;
}

interface CalendarConnection {
  connected: boolean;
  calendarId?: string;
}

const defaultPrefs: NotificationPreferences = {
  pushEnabled: false,
  pushTaskReminders: true,
  pushDailyDigest: false,
  smsEnabled: false,
  smsPhoneNumber: null,
  smsVerified: false,
  smsTaskReminders: true,
  smsUrgentOnly: true,
  calendarEnabled: false,
  calendarAutoSync: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  reminderLeadTime: 30,
};

const reminderLeadTimeOptions = [
  { value: "5", label: "5 minutes before" },
  { value: "10", label: "10 minutes before" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "120", label: "2 hours before" },
];

const hourOptions = [
  { value: "", label: "Not set" },
  ...Array.from({ length: 24 }, (_, i) => ({
    value: `${i.toString().padStart(2, "0")}:00`,
    label: `${i === 0 ? "12" : i > 12 ? i - 12 : i}:00 ${i < 12 ? "AM" : "PM"}`,
  })),
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPrefs);
  const [calendar, setCalendar] = useState<CalendarConnection>({ connected: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);

  // SMS verification state
  const [smsStep, setSmsStep] = useState<"idle" | "sending" | "verify">("idle");
  const [phoneInput, setPhoneInput] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [smsError, setSmsError] = useState<string | null>(null);

  const { addToast } = useToast();

  // Check if push notifications are supported
  useEffect(() => {
    if ("Notification" in window && "serviceWorker" in navigator) {
      setPushSupported(true);
      // Check existing subscription
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setPushSubscription(sub);
        });
      });
    }
  }, []);

  // Fetch preferences and calendar status
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prefsRes, calRes] = await Promise.all([
          fetch("/api/notifications/preferences"),
          fetch("/api/notifications/calendar/status").catch(() => ({ ok: false })),
        ]);

        if (prefsRes.ok) {
          const data = await prefsRes.json();
          setPrefs(data);
          if (data.smsPhoneNumber) {
            setPhoneInput(data.smsPhoneNumber);
          }
        }

        if (calRes.ok) {
          const calData = await (calRes as Response).json();
          setCalendar(calData);
        }
      } catch (error) {
        console.error("Failed to fetch notification settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Save preferences
  const savePrefs = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      setIsSaving(true);
      try {
        const res = await fetch("/api/notifications/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          throw new Error("Failed to save");
        }

        const updated = await res.json();
        setPrefs(updated);
        addToast("success", "Settings saved");
      } catch {
        addToast("error", "Failed to save settings");
      } finally {
        setIsSaving(false);
      }
    },
    [addToast]
  );

  // Toggle push notifications
  const togglePush = async () => {
    if (!pushSupported) return;

    if (prefs.pushEnabled && pushSubscription) {
      // Unsubscribe
      try {
        await pushSubscription.unsubscribe();
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
        });
        setPushSubscription(null);
        await savePrefs({ pushEnabled: false });
      } catch {
        addToast("error", "Failed to disable push notifications");
      }
    } else {
      // Subscribe
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          addToast("error", "Notification permission denied");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        // Send subscription to server
        const p256dh = sub.getKey("p256dh");
        const auth = sub.getKey("auth");

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: {
              p256dh: p256dh ? btoa(String.fromCharCode(...new Uint8Array(p256dh))) : null,
              auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : null,
            },
          }),
        });

        setPushSubscription(sub);
        await savePrefs({ pushEnabled: true });
      } catch (error) {
        console.error("Push subscription error:", error);
        addToast("error", "Failed to enable push notifications");
      }
    }
  };

  // Send SMS verification code
  const sendVerificationCode = async () => {
    if (!phoneInput.trim()) {
      setSmsError("Please enter a phone number");
      return;
    }

    setSmsStep("sending");
    setSmsError(null);

    try {
      const res = await fetch("/api/notifications/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          phoneNumber: phoneInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send code");
      }

      setSmsStep("verify");
      addToast("success", "Verification code sent");
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Failed to send code");
      setSmsStep("idle");
    }
  };

  // Verify SMS code
  const verifyCode = async () => {
    if (!verificationCode.trim()) {
      setSmsError("Please enter the verification code");
      return;
    }

    setSmsStep("sending");
    setSmsError(null);

    try {
      const res = await fetch("/api/notifications/sms/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          code: verificationCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid code");
      }

      setPrefs((prev) => ({
        ...prev,
        smsPhoneNumber: phoneInput,
        smsVerified: true,
        smsEnabled: true,
      }));
      setSmsStep("idle");
      setVerificationCode("");
      addToast("success", "Phone number verified");
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Verification failed");
      setSmsStep("verify");
    }
  };

  // Connect Google Calendar
  const connectCalendar = () => {
    window.location.href = "/api/auth/google";
  };

  // Disconnect Google Calendar
  const disconnectCalendar = async () => {
    try {
      await fetch("/api/notifications/calendar/disconnect", {
        method: "POST",
      });
      setCalendar({ connected: false });
      await savePrefs({ calendarEnabled: false });
      addToast("success", "Calendar disconnected");
    } catch {
      addToast("error", "Failed to disconnect calendar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2.5"
              style={{ background: "var(--shadow-dark)" }}
            >
              <Bell className="h-5 w-5" style={{ color: "var(--foreground)" }} />
            </div>
            <div>
              <h4 className="font-medium" style={{ color: "var(--foreground)" }}>
                Push Notifications
              </h4>
              <p className="text-sm" style={{ color: "var(--accent)" }}>
                {pushSupported
                  ? "Get notified in your browser"
                  : "Not supported in this browser"}
              </p>
            </div>
          </div>
          <button
            onClick={togglePush}
            disabled={!pushSupported || isSaving}
            className="relative h-7 w-12 rounded-full transition-all"
            style={{
              background: prefs.pushEnabled ? "var(--foreground)" : "var(--shadow-dark)",
              opacity: !pushSupported ? 0.5 : 1,
            }}
          >
            <motion.div
              className="absolute top-1 h-5 w-5 rounded-full"
              style={{ background: "var(--background)" }}
              animate={{ left: prefs.pushEnabled ? "calc(100% - 24px)" : "4px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        <AnimatePresence>
          {prefs.pushEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ml-12 space-y-3 overflow-hidden"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.pushTaskReminders}
                  onChange={(e) => savePrefs({ pushTaskReminders: e.target.checked })}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--foreground)" }}
                />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>
                  Task reminders
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.pushDailyDigest}
                  onChange={(e) => savePrefs({ pushDailyDigest: e.target.checked })}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--foreground)" }}
                />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>
                  Daily digest
                </span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: "var(--shadow-dark)" }} />

      {/* SMS Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2.5"
              style={{ background: "var(--shadow-dark)" }}
            >
              <Smartphone className="h-5 w-5" style={{ color: "var(--foreground)" }} />
            </div>
            <div>
              <h4 className="font-medium" style={{ color: "var(--foreground)" }}>
                SMS Notifications
              </h4>
              <p className="text-sm" style={{ color: "var(--accent)" }}>
                {prefs.smsVerified
                  ? `Verified: ${prefs.smsPhoneNumber}`
                  : "Receive text reminders"}
              </p>
            </div>
          </div>
          {prefs.smsVerified && (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" style={{ color: "var(--success, #22c55e)" }} />
              <button
                onClick={() => savePrefs({ smsEnabled: !prefs.smsEnabled })}
                disabled={isSaving}
                className="relative h-7 w-12 rounded-full transition-all"
                style={{
                  background: prefs.smsEnabled ? "var(--foreground)" : "var(--shadow-dark)",
                }}
              >
                <motion.div
                  className="absolute top-1 h-5 w-5 rounded-full"
                  style={{ background: "var(--background)" }}
                  animate={{ left: prefs.smsEnabled ? "calc(100% - 24px)" : "4px" }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
            </div>
          )}
        </div>

        {/* Phone verification flow */}
        {!prefs.smsVerified && (
          <div className="ml-12 space-y-3">
            {smsStep === "idle" || smsStep === "sending" ? (
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={smsStep === "sending"}
                />
                <Button
                  onClick={sendVerificationCode}
                  disabled={smsStep === "sending"}
                  variant="secondary"
                >
                  {smsStep === "sending" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: "var(--accent)" }}>
                  Enter the 6-digit code sent to your phone
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                  />
                  <Button onClick={verifyCode} variant="secondary">
                    Confirm
                  </Button>
                  <Button
                    onClick={() => {
                      setSmsStep("idle");
                      setVerificationCode("");
                      setSmsError(null);
                    }}
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {smsError && (
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: "#ef4444" }}
              >
                <AlertCircle className="h-4 w-4" />
                {smsError}
              </div>
            )}
          </div>
        )}

        {/* SMS preferences when verified */}
        <AnimatePresence>
          {prefs.smsVerified && prefs.smsEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ml-12 space-y-3 overflow-hidden"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.smsTaskReminders}
                  onChange={(e) => savePrefs({ smsTaskReminders: e.target.checked })}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--foreground)" }}
                />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>
                  Task reminders
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.smsUrgentOnly}
                  onChange={(e) => savePrefs({ smsUrgentOnly: e.target.checked })}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--foreground)" }}
                />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>
                  Urgent tasks only (due within 1 hour)
                </span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: "var(--shadow-dark)" }} />

      {/* Google Calendar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-2.5"
              style={{ background: "var(--shadow-dark)" }}
            >
              <Calendar className="h-5 w-5" style={{ color: "var(--foreground)" }} />
            </div>
            <div>
              <h4 className="font-medium" style={{ color: "var(--foreground)" }}>
                Google Calendar
              </h4>
              <p className="text-sm" style={{ color: "var(--accent)" }}>
                {calendar.connected
                  ? "Sync tasks to your calendar"
                  : "Connect to add tasks as events"}
              </p>
            </div>
          </div>
          {calendar.connected ? (
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" style={{ color: "var(--success, #22c55e)" }} />
              <Button onClick={disconnectCalendar} variant="ghost" size="sm">
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={connectCalendar} variant="secondary" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
        </div>

        <AnimatePresence>
          {calendar.connected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="ml-12 space-y-3 overflow-hidden"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.calendarEnabled}
                  onChange={(e) => savePrefs({ calendarEnabled: e.target.checked })}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--foreground)" }}
                />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>
                  Add tasks to calendar
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.calendarAutoSync}
                  onChange={(e) => savePrefs({ calendarAutoSync: e.target.checked })}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: "var(--foreground)" }}
                />
                <span className="text-sm" style={{ color: "var(--foreground)" }}>
                  Auto-sync when tasks are created
                </span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ background: "var(--shadow-dark)" }} />

      {/* General Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="rounded-xl p-2.5"
            style={{ background: "var(--shadow-dark)" }}
          >
            <Clock className="h-5 w-5" style={{ color: "var(--foreground)" }} />
          </div>
          <div>
            <h4 className="font-medium" style={{ color: "var(--foreground)" }}>
              Timing & Quiet Hours
            </h4>
            <p className="text-sm" style={{ color: "var(--accent)" }}>
              Control when you receive notifications
            </p>
          </div>
        </div>

        <div className="ml-12 space-y-4">
          <Select
            label="Reminder lead time"
            value={prefs.reminderLeadTime.toString()}
            onChange={(e) => savePrefs({ reminderLeadTime: parseInt(e.target.value) })}
            options={reminderLeadTimeOptions}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Quiet hours start"
              value={prefs.quietHoursStart || ""}
              onChange={(e) => savePrefs({ quietHoursStart: e.target.value || null })}
              options={hourOptions}
            />
            <Select
              label="Quiet hours end"
              value={prefs.quietHoursEnd || ""}
              onChange={(e) => savePrefs({ quietHoursEnd: e.target.value || null })}
              options={hourOptions}
            />
          </div>

          {prefs.quietHoursStart && prefs.quietHoursEnd && (
            <p className="text-sm" style={{ color: "var(--accent)" }}>
              No notifications will be sent between {prefs.quietHoursStart} and {prefs.quietHoursEnd}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
