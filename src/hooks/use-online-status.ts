"use client";

import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  // Start with true to match SSR and avoid hydration mismatch.
  // navigator.onLine evaluated during render can be transiently false while
  // the browser hasn't yet confirmed connectivity, which would permanently
  // stick the state at false (online event never fires if already connected).
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
