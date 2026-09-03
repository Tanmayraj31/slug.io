import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padded?: boolean;
}

export function Card({
  children,
  hover = false,
  padded = true,
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`${hover ? "glass-card-hover" : "glass-card"} rounded-2xl ${padded ? "p-6" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
