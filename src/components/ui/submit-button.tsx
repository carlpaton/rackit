"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={cn(className, (pending || disabled) && "opacity-70 cursor-not-allowed")}
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <span
            className="inline-block size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
