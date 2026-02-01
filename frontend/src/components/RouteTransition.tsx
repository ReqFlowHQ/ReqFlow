// FILE: components/RouteTransition.tsx
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppLoader from "./AppLoader";

export default function RouteTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <AppLoader key={location.pathname} />
      {children}
    </AnimatePresence>
  );
}

