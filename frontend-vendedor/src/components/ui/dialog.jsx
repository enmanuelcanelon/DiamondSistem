import * as React from "react"
import { X } from "lucide-react"

const DialogContext = React.createContext(undefined)

const Dialog = ({ open, onOpenChange, children, ...props }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange?.(false)}
        />
        <div className="relative z-50" {...props}>
          {children}
        </div>
      </div>
    </DialogContext.Provider>
  )
}

const DialogContent = React.forwardRef(({ className = "", children, ...props }, ref) => {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogContent must be used within Dialog")

  return (
    <div
      ref={ref}
      className={`bg-background text-foreground shadow-lg border p-6 w-full fixed inset-0 sm:static sm:inset-auto sm:rounded-lg sm:max-w-lg sm:mx-4 overflow-y-auto ${className}`}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className = "", ...props }) => (
  <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogTitle = React.forwardRef(({ className = "", ...props }, ref) => (
  <h2
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className = "", ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-muted-foreground ${className}`}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

const DialogFooter = ({ className = "", ...props }) => (
  <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className}`} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogClose = React.forwardRef(({ className = "", ...props }, ref) => {
  const context = React.useContext(DialogContext)
  if (!context) throw new Error("DialogClose must be used within Dialog")

  return (
    <button
      ref={ref}
      onClick={() => context.onOpenChange?.(false)}
      className={`absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-50 ${className}`}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
})
DialogClose.displayName = "DialogClose"

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
}


