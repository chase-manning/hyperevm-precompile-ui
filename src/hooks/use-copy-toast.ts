import { useCallback, useEffect, useRef, useState } from "react";

export interface CopyToastState {
  visible: boolean;
  message: string;
}

export function useCopyToast(duration = 1500) {
  const [toast, setToast] = useState<CopyToastState>({
    visible: false,
    message: "",
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message = "Copied to clipboard!") => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ visible: true, message });
      timeoutRef.current = setTimeout(() => {
        setToast({ visible: false, message: "" });
      }, duration);
    },
    [duration]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { toast, showToast };
}
