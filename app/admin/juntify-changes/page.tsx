"use client";

import { useEffect, useState, FormEvent } from "react";
import { NewNavbar } from "@/components/new-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDescription(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const bullets: string[] = [];
  const notes: string[] = [];
  for (const line of lines) {
    const match = line.match(/^Notas?:\s*(.*)/i);
    if (match) {
      notes.push(match[1]);
    } else {
      bullets.push(line);
    }
  }
  return (
    <>
      {bullets.length > 0 && (
        <ul className="list-disc pl-5 space-y-1">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
      {notes.map((n, i) => (
        <p key={`note-${i}`} className="text-yellow-300 mt-2">
          Notas: {n}
        </p>
      ))}
    </>
  );
  id: number;
  version: string;
  description: string;

  const [changes, setChanges] = useState<Change[]>([]);
  const [version, setVersion] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
    const res = await fetch("/api/juntify-changes");
      const data = await res.json();
      setChanges(data);
  };
    fetchChanges();
  }, []);
    e.preventDefault();
      setError("Versión y descripción son requeridas");
      return;
      body: JSON.stringify({ version: version.trim(), description }),
    });
      setVersion("");
      setDescription("");
      setError("");
      fetchChanges();
      const data = await res.json();
      setError(data.error || "Error al guardar");
  };
    e.preventDefault();
    if (editingId === null) return;
      setError("Versión y descripción son requeridas");
      return;
      body: JSON.stringify({ version: version.trim(), description }),
    });
      setVersion("");
      setDescription("");
      setEditingId(null);
      setError("");
      fetchChanges();
      const data = await res.json();
      setError(data.error || "Error al actualizar");
  };
    setDeleteId(id);
    setShowDeleteModal(true);
  };
    if (deleteId === null) return;
    });
      fetchChanges();
    setShowDeleteModal(false);
    setDeleteId(null);
  };

    setEditingId(change.id);
    setVersion(change.version);
    setDescription(change.description);
  };
    setEditingId(null);
    setVersion("");
    setDescription("");
    setError("");
  };
          <h1 className="text-3xl font-bold text-white mb-4 glow-text">
            Cambios de Juntify
          </h1>
              <CardTitle>
                {editingId ? "Editar Cambio" : "Nuevo Cambio"}
              </CardTitle>
                <Alert
                  variant="destructive"
                  className="mb-4 bg-red-900/40 border-red-800 text-white"
                >
              <form
                onSubmit={editingId ? handleUpdate : handleCreate}
                className="space-y-4"
              >
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <td className="py-2 px-4 align-top whitespace-nowrap">
                      {chg.version}
                    </td>
                    <td className="py-2 px-4 align-top whitespace-pre-wrap">
                      {formatDescription(chg.description)}
                    </td>
  );
      fetchChanges()
    } else {
      const data = await res.json()
      setError(data.error || "Error al actualizar")
    }
  }

  const confirmDelete = (id: number) => {
    setDeleteId(id)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (deleteId === null) return
    const res = await fetch(`/api/juntify-changes/${deleteId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      fetchChanges()
    }
    setShowDeleteModal(false)
    setDeleteId(null)
  }

  const startEdit = (change: Change) => {
    setEditingId(change.id)
    setVersion(change.version)
    setDescription(change.description)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setVersion("")
    setDescription("")
    setError("")
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-white mb-4 glow-text">Cambios de Juntify</h1>
          <Card className="bg-blue-800/30 border-blue-700/30 text-white">
            <CardHeader>
              <CardTitle>{editingId ? "Editar Cambio" : "Nuevo Cambio"}</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4 bg-red-900/40 border-red-800 text-white">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
                <Input
                  placeholder="Versión"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="bg-blue-900/40 border-blue-700/30 text-white"
                />
                <Textarea
                  placeholder="Descripción"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-blue-900/40 border-blue-700/30 text-white"
                />
                <div className="flex gap-2">
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingId ? "Actualizar" : "Guardar"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="ghost" onClick={cancelEdit}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm text-blue-200 table-auto">
              <thead>
                <tr className="text-blue-300">
                  <th className="pb-2 px-4">Versión</th>
                  <th className="pb-2 px-4">Cambios</th>
                  <th className="pb-2 px-4">Acciones</th>

                </tr>
              </thead>
              <tbody>
                {changes.map((chg) => (
                  <tr key={chg.id} className="border-t border-blue-700/30">

                    <td className="py-2 px-4 align-top whitespace-nowrap">{chg.version}</td>
                    <td className="py-2 px-4 align-top whitespace-pre-wrap">{highlightNotes(chg.description)}</td>
                    <td className="py-2 px-4">

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(chg)}
                          aria-label="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(chg.id)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-blue-800/90 border border-blue-700/50">
          <DialogHeader>
            <DialogTitle>Eliminar Cambio</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este cambio?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <NewNavbar />
    </div>
  )
}
