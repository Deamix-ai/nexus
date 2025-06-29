import * as React from "react"

// Simple toast implementation for our SMS dashboard
type ToastType = "default" | "success" | "error" | "warning"

interface Toast {
    id: string
    title?: string
    description?: string
    variant?: "default" | "destructive"
}

let toastId = 0

export function useToast() {
    const [toasts, setToasts] = React.useState<Toast[]>([])

    const toast = React.useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
        const id = (++toastId).toString()
        const newToast: Toast = { id, title, description, variant }

        setToasts(prev => [...prev, newToast])

        // Auto remove after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 5000)

        return { id }
    }, [])

    const dismiss = React.useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    return {
        toast,
        dismiss,
        toasts
    }
}
