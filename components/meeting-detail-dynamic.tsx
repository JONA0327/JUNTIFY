"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { X, FileText, List, MessageSquare, Headphones } from "lucide-react"
import DynamicAudioPlayer from "./dynamic-audio-player"
import { Button } from "./ui/button"
import { useRouter } from "next/router"

interface Meeting {
  id: number
  title: string
  date: string
  duration: string
  participants: number
  summary?: string
  key_points?: string[]
  transcription?: string
  audio_url?: string
  google_drive_id?: string
  google_drive_link?: string
  username?: string
}

interface MeetingDetailProps {
  meeting: Meeting
  onClose: () => void
}

export default function MeetingDetailDynamic({ meeting, onClose }: MeetingDetailProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [username, setUsername] = useState<string>("")
 
  useEffect(() => {
    // Obtener el nombre de usuario del localStorage o de la sesión
    const storedUsername = localStorage.getItem("username") || ""
    setUsername(storedUsername)
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true, locale: es })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{meeting.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Cerrar">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b border-gray-700 flex space-x-4 text-sm text-gray-400">
          <div>{formatDate(meeting.date)}</div>
          <div>•</div>
          <div>{meeting.duration}</div>
          <div>•</div>
          <div>
            {meeting.participants} participante{meeting.participants !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="flex border-b border-gray-700">
          <button
            className={`px-4 py-3 flex items-center space-x-2 ${
              activeTab === "summary" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("summary")}
          >
            <FileText size={18} />
            <span>Resumen</span>
          </button>
          <button
            className={`px-4 py-3 flex items-center space-x-2 ${
              activeTab === "key_points" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("key_points")}
          >
            <List size={18} />
            <span>Puntos Clave</span>
          </button>
          <button
            className={`px-4 py-3 flex items-center space-x-2 ${
              activeTab === "transcript" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("transcript")}
          >
            <MessageSquare size={18} />
            <span>Transcripción</span>
          </button>
          <button
            className={`px-4 py-3 flex items-center space-x-2 ${
              activeTab === "audio" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("audio")}
          >
            <Headphones size={18} />
            <span>Audio</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "summary" && (
            <div className="text-gray-300">
              {meeting.summary ? (
                <p className="whitespace-pre-line">{meeting.summary}</p>
              ) : (
                <p className="text-gray-500 italic">No hay resumen disponible para esta reunión.</p>
              )}
            </div>
          )}

          {activeTab === "key_points" && (
            <div className="text-gray-300">
              {meeting.key_points && meeting.key_points.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2">
                  {meeting.key_points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No hay puntos clave disponibles para esta reunión.</p>
              )}
            </div>
          )}

          {activeTab === "transcript" && (
            <div className="text-gray-300">
              {meeting.transcription ? (
                <p className="whitespace-pre-line">{meeting.transcription}</p>
              ) : (
                <p className="text-gray-500 italic">No hay transcripción disponible para esta reunión.</p>
              )}
            </div>
          )}

          {activeTab === "audio" && (
            <div className="p-4 bg-gray-800 rounded-lg">
              <DynamicAudioPlayer meetingId={meeting.id} username={username} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
