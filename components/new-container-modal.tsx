"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface NewContainerModalProps {
  onCancel: () => void;
  onCreate: (name: string) => void;
}

export function NewContainerModal({
  onCancel,
  onCreate,
}: NewContainerModalProps) {
  const [name, setName] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-blue-800/95 border border-blue-700/30 rounded-lg p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Nuevo Contenedor</h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-200 hover:text-white"
            onClick={onCancel}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nombre del contenedor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2.5"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel} type="button">
              Cancelar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" type="submit">
              Crear
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
