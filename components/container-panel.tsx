"use client";


import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { addUsernameToHeaders } from "@/utils/user-helpers";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { AddToContainerModal } from "./add-to-container-modal";
import { DeleteContainerModal } from "./delete-container-modal";
interface Container {
  id: number;
  name: string;
}

interface Meeting {
  id: number;
  title: string;
}

interface ContainerPanelProps {

  onMeetingSelect?: (meetingId: number) => void;
}

export function ContainerPanel({ onMeetingSelect }: ContainerPanelProps) {
  const [containers, setContainers] = useState<Container[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState<Container | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Container | null>(null);

  const fetchContainers = async () => {
    try {
      const res = await fetch("/api/containers", {
        headers: addUsernameToHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setContainers(data);
      }
    } catch (err) {
      console.error("Error loading containers", err);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  const [meetings, setMeetings] = useState<Record<number, Meeting[]>>({});

  const toggleExpand = async (id: number) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!meetings[id]) {
      try {
        const res = await fetch(`/api/containers/${id}/meetings`, {
          headers: addUsernameToHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setMeetings((prev) => ({ ...prev, [id]: data }));
        }
      } catch (err) {
        console.error("Error loading meetings", err);
      }
    }
  };


  const confirmDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/containers/${id}`, {
        method: "DELETE",
        headers: addUsernameToHeaders(),

      })
      if (res.ok) {
        setContainers((prev) => prev.filter((c) => c.id !== id))
        setExpanded((prev) => (prev === id ? null : prev))
        setDeleteTarget(null)
      }
    } catch (err) {
      console.error("Error deleting container", err)
    }
  }


  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30"
        >
          Mis contenedores
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-blue-900 border-blue-700/30 text-white w-80 p-0"
      >
        <SheetHeader className="p-4 border-b border-blue-700/30">
          <SheetTitle>Contenedores</SheetTitle>
        </SheetHeader>
        <div className="p-4 border-b border-blue-700/30">
          <input
            type="text"
            placeholder="Buscar contenedor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-2.5"
          />
        </div>
        <div className="p-4 space-y-2 overflow-y-auto h-full">
          {containers
            .filter((c) =>
              c.name.toLowerCase().includes(searchTerm.toLowerCase()),
            )
            .map((c) => (
            <div key={c.id} className="border border-blue-700/50 rounded-lg">
              <div className="flex items-center justify-between p-3 bg-blue-800/50">
                <button
                  onClick={() => toggleExpand(c.id)}
                  className="flex-1 text-left flex items-center justify-between"
                >
                  <span>{c.name}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${expanded === c.id ? "rotate-180" : ""}`}
                  />
                </button>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => setShowAddModal(c)}
                    className="text-blue-200 hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}

                    className="text-red-300 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {expanded === c.id && meetings[c.id] && (
                <div className="bg-blue-800/40 p-2 space-y-1">
                  {meetings[c.id].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onMeetingSelect?.(m.id)}
                      className="block w-full text-left px-2 py-1 rounded hover:bg-blue-700/50"
                    >
                      {m.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {containers.length === 0 && (
            <p className="text-blue-300">No hay contenedores</p>
          )}
        </div>
      </SheetContent>
      {showAddModal && (
        <AddToContainerModal
          containerId={showAddModal.id}
          onClose={() => setShowAddModal(null)}
          onAdded={() => fetchContainers()}
        />
      )}

      {deleteTarget && (
        <DeleteContainerModal
          container={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={(id) => confirmDelete(id)}
        />
      )}

    </Sheet>
  );
}
