"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteContainerModalProps {
  container: { id: number; name: string }
  onConfirm: (id: number) => void
  onCancel: () => void
}

export function DeleteContainerModal({ container, onConfirm, onCancel }: DeleteContainerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-blue-800/95 border border-blue-700/30 rounded-lg p-6 w-full max-w-sm">
        <div className="flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <Trash2 className="h-6 w-6 text-red-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white text-center mb-2">Eliminar Contenedor</h2>
        <p className="text-blue-200 text-center mb-6">
          ¿Estás seguro de que deseas eliminar "{container.name}"? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => onConfirm(container.id)}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}
