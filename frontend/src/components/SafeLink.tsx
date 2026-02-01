// FILE: frontend/src/components/SafeLink.tsx
import { Link, LinkProps, useNavigate } from "react-router-dom";
import { startTransition } from "react";

export default function SafeLink({ to, onClick, ...rest }: LinkProps) {
  const navigate = useNavigate();

  return (
    <a
      href={typeof to === "string" ? to : undefined}
      onClick={(e) => {
        e.preventDefault();
        startTransition(() => {
          navigate(to as string);
        });
        onClick?.(e);
      }}
      {...rest}
    />
  );
}

