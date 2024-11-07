import { toast as sonnerToast } from "sonner";

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function toast({ title, description, variant = "default" }: ToastProps) {
  sonnerToast[variant === "destructive" ? "error" : "success"](title, {
    description,
  });
}

export function useToast() {
  return { toast };
}

export type { ToastProps };