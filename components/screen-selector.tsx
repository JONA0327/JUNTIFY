"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface ScreenSelectorProps {
  onSelect: (stream: MediaStream) => void
  onCancel: () => void
  isOpen: boolean
}

export function ScreenSelector({ onSelect, onCancel, isOpen }: ScreenSelectorProps) {
  const handleStartCapture = async () => {
    try {
      // Usar directamente getDisplayMedia sin opciones complejas para usar el selector nativo
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // Intentar capturar audio del sistema si está disponible
      })

      onSelect(stream)
    } catch (err) {
      console.error("Error al seleccionar pantalla:", err)
      onCancel()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Seleccionar fuente para grabar</DialogTitle>
          <DialogDescription>
            Se abrirá el selector nativo del navegador para elegir la ventana o pestaña que deseas grabar.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <div className="p-3 bg-blue-100/10 border border-blue-400/30 rounded-md text-blue-300 text-sm">
            <p>
              Selecciona la ventana o pestaña que deseas grabar. Para capturar el audio de la reunión, asegúrate de
              marcar la opción "Compartir audio" si el navegador lo permite.
            </p>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleStartCapture}>Abrir selector</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
