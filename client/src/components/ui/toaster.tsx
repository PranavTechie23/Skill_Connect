import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const { variant, isLoading, ...toastProps } = props as any;
        
        return (
          <Toast key={id} variant={variant} {...toastProps}>
            <div className="flex items-start gap-3 w-full">
              {isLoading && (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              )}
              {!isLoading && variant === "success" && (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              )}
              {!isLoading && variant === "destructive" && (
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
