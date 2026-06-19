"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000;
const WARNING_DURATION_MS = 30 * 1000;

const STORAGE_KEY = "reliefbridge:last-activity";
const CHANNEL_NAME = "reliefbridge:session-activity";

type SessionMessage =
  | {
      type: "activity";
      timestamp: number;
    }
  | {
      type: "logout";
    };

export function SessionInactivityGuard() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] =
    useState(30);

  const signOutFormRef =
    useRef<HTMLFormElement | null>(null);

  const channelRef =
    useRef<BroadcastChannel | null>(null);

  const lastActivityRef = useRef(Date.now());
  const lastPublishedActivityRef = useRef(0);
  const signingOutRef = useRef(false);

  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current !== null) {
      window.clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }

    if (logoutTimerRef.current !== null) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const performSignOut = useCallback(
    (broadcastToOtherTabs = true) => {
      if (signingOutRef.current) {
        return;
      }

      signingOutRef.current = true;
      clearTimers();
      setShowWarning(false);

      if (broadcastToOtherTabs) {
        channelRef.current?.postMessage({
          type: "logout",
        } satisfies SessionMessage);
      }

      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Local storage may be unavailable in a restricted browser.
      }

      if (signOutFormRef.current) {
        signOutFormRef.current.submit();
        return;
      }

      window.location.assign("/auth/signout");
    },
    [clearTimers],
  );

  const startWarningCountdown = useCallback(
    (expiresAt: number) => {
      setShowWarning(true);

      const updateCountdown = () => {
        const remainingMilliseconds =
          expiresAt - Date.now();

        const remainingSeconds = Math.max(
          0,
          Math.ceil(remainingMilliseconds / 1000),
        );

        setSecondsRemaining(remainingSeconds);

        if (remainingSeconds <= 0) {
          performSignOut();
        }
      };

      updateCountdown();

      if (countdownTimerRef.current !== null) {
        window.clearInterval(
          countdownTimerRef.current,
        );
      }

      countdownTimerRef.current =
        window.setInterval(updateCountdown, 250);
    },
    [performSignOut],
  );

  const scheduleSessionTimers = useCallback(
    (activityTimestamp: number) => {
      clearTimers();

      lastActivityRef.current = activityTimestamp;

      const now = Date.now();

      const expiresAt =
        activityTimestamp + INACTIVITY_LIMIT_MS;

      const warningStartsAt =
        expiresAt - WARNING_DURATION_MS;

      const millisecondsUntilWarning =
        warningStartsAt - now;

      const millisecondsUntilLogout =
        expiresAt - now;

      if (millisecondsUntilLogout <= 0) {
        performSignOut();
        return;
      }

      if (millisecondsUntilWarning <= 0) {
        startWarningCountdown(expiresAt);
      } else {
        warningTimerRef.current =
          window.setTimeout(() => {
            startWarningCountdown(expiresAt);
          }, millisecondsUntilWarning);
      }

      logoutTimerRef.current =
        window.setTimeout(() => {
          performSignOut();
        }, millisecondsUntilLogout);
    },
    [
      clearTimers,
      performSignOut,
      startWarningCountdown,
    ],
  );

  const publishActivity = useCallback(
    (force = false) => {
      const now = Date.now();

      if (
        !force &&
        now - lastPublishedActivityRef.current < 1000
      ) {
        return;
      }

      lastPublishedActivityRef.current = now;
      setShowWarning(false);

      try {
        window.localStorage.setItem(
          STORAGE_KEY,
          String(now),
        );
      } catch {
        // Local storage may be unavailable in a restricted browser.
      }

      channelRef.current?.postMessage({
        type: "activity",
        timestamp: now,
      } satisfies SessionMessage);

      scheduleSessionTimers(now);
    },
    [scheduleSessionTimers],
  );

  useEffect(() => {
    if ("BroadcastChannel" in window) {
      const channel =
        new BroadcastChannel(CHANNEL_NAME);

      channelRef.current = channel;

      channel.onmessage = (
        event: MessageEvent<SessionMessage>,
      ) => {
        const message = event.data;

        if (message.type === "logout") {
          performSignOut(false);
          return;
        }

        if (
          message.type === "activity" &&
          message.timestamp >
            lastActivityRef.current
        ) {
          setShowWarning(false);
          scheduleSessionTimers(
            message.timestamp,
          );
        }
      };
    }

    const handleActivity = (event: Event) => {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest(
          "[data-session-timeout-dialog]",
        )
      ) {
        return;
      }

      publishActivity();
    };

    const handleStorage = (
      event: StorageEvent,
    ) => {
      if (
        event.key !== STORAGE_KEY ||
        !event.newValue
      ) {
        return;
      }

      const timestamp = Number(event.newValue);

      if (
        Number.isFinite(timestamp) &&
        timestamp > lastActivityRef.current
      ) {
        setShowWarning(false);
        scheduleSessionTimers(timestamp);
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState !== "visible"
      ) {
        return;
      }

      const elapsed =
        Date.now() - lastActivityRef.current;

      if (elapsed >= INACTIVITY_LIMIT_MS) {
        performSignOut();
        return;
      }

      publishActivity(true);
    };

    window.addEventListener(
      "pointerdown",
      handleActivity,
      { passive: true },
    );

    window.addEventListener(
      "keydown",
      handleActivity,
    );

    window.addEventListener(
      "scroll",
      handleActivity,
      { passive: true },
    );

    window.addEventListener(
      "touchstart",
      handleActivity,
      { passive: true },
    );

    window.addEventListener(
      "focus",
      handleActivity,
    );

    window.addEventListener(
      "storage",
      handleStorage,
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    const initialTimestamp = Date.now();

    lastPublishedActivityRef.current =
      initialTimestamp;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        String(initialTimestamp),
      );
    } catch {
      // Local storage may be unavailable in a restricted browser.
    }

    channelRef.current?.postMessage({
      type: "activity",
      timestamp: initialTimestamp,
    } satisfies SessionMessage);

    scheduleSessionTimers(initialTimestamp);

    const timeoutSafetyCheck =
      window.setInterval(() => {
        const inactiveFor =
          Date.now() -
          lastActivityRef.current;

        if (
          inactiveFor >= INACTIVITY_LIMIT_MS
        ) {
          performSignOut();
        }
      }, 5000);

    return () => {
      clearTimers();

      window.clearInterval(
        timeoutSafetyCheck,
      );

      window.removeEventListener(
        "pointerdown",
        handleActivity,
      );

      window.removeEventListener(
        "keydown",
        handleActivity,
      );

      window.removeEventListener(
        "scroll",
        handleActivity,
      );

      window.removeEventListener(
        "touchstart",
        handleActivity,
      );

      window.removeEventListener(
        "focus",
        handleActivity,
      );

      window.removeEventListener(
        "storage",
        handleStorage,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [
    clearTimers,
    performSignOut,
    publishActivity,
    scheduleSessionTimers,
  ]);

  return (
    <>
      <form
        ref={signOutFormRef}
        action="/auth/signout"
        method="post"
        className="hidden"
        aria-hidden="true"
      />

      {showWarning ? (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-navy-dark/70 px-4 backdrop-blur-[2px]">
          <div
            data-session-timeout-dialog
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-timeout-title"
            aria-describedby="session-timeout-description"
            className="w-full max-w-[460px] overflow-hidden rounded-md border border-line bg-surface shadow-lift"
          >
            <div className="border-b border-line bg-navy px-6 py-5 text-white">
              <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-gold">
                Session security
              </div>

              <h2
                id="session-timeout-title"
                className="mt-2 text-[24px] font-bold tracking-tight"
              >
                Are you still working?
              </h2>
            </div>

            <div className="px-6 py-6">
              <p
                id="session-timeout-description"
                className="text-[15px] leading-6 text-ink-2"
              >
                For your security, ReliefBridge
                will sign you out in{" "}
                <span className="font-bold text-navy">
                  {secondsRemaining}{" "}
                  {secondsRemaining === 1
                    ? "second"
                    : "seconds"}
                </span>{" "}
                because no activity was detected.
              </p>

              <p className="mt-3 text-[13px] leading-5 text-ink-3">
                Unsaved information on the
                current page may be lost when
                the session ends.
              </p>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    performSignOut()
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-sm border border-line bg-surface px-4 text-[14px] font-semibold text-ink-2 transition hover:border-red hover:text-red"
                >
                  Sign out now
                </button>

                <button
                  type="button"
                  onClick={() =>
                    publishActivity(true)
                  }
                  className="inline-flex min-h-11 items-center justify-center rounded-sm bg-gold px-5 text-[14px] font-bold text-navy shadow-sm transition hover:bg-gold-light"
                >
                  Stay signed in
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}