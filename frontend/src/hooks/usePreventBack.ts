import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function usePreventBack(showLogoutConfirm: () => void) {
  const navigate = useNavigate();

  useEffect(() => {
    // Push a dummy state so Back doesn't leave immediately
    window.history.pushState(null, "", window.location.href);

    const onPopState = () => {
      // User pressed Back → show logout confirm
      showLogoutConfirm();

      // Re-push to prevent leaving
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [showLogoutConfirm, navigate]);
}

