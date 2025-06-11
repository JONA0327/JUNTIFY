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
import { ChevronDown, Plus } from "lucide-react";


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


  useEffect(() => {
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
        <div className="p-4 space-y-2 overflow-y-auto h-full">
          {containers.map((c) => (
            <div key={c.id} className="border border-blue-700/50 rounded-lg">
              <button
                onClick={() => toggleExpand(c.id)}
                className="w-full flex justify-between items-center p-3 bg-blue-800/50 hover:bg-blue-800"
              >
                <span>{c.name}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${expanded === c.id ? "rotate-180" : ""}`}
                />
              </button>
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
    </Sheet>
  );
}
