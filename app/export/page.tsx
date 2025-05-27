"use client"

import { useState, useEffect } from "react"
import { NewNavbar } from "@/components/new-navbar"
import {
  Search,
  Calendar,
  Clock,
  Users,
  X,
  Filter,
  ChevronDown,
  Download,
  Eye,
  FileArchiveIcon as FileZip,
  FileIcon as FilePdf,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/date-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { getUsername, addUsernameToHeaders } from "@/utils/user-helpers"
import JSZip from "jszip"
import { saveAs } from "file-saver"

// Tipos para los datos de reuniones
interface Meeting {
  id: number
  title: string
  date: string
  time?: string
  duration?: string
  participants?: number
  keywords?: string[]
  summary?: string
  audio_url?: string
  keyPoints?: {
    id: number
    point_text: string
    order_num: number
  }[]
  transcription?: {
    id: number
    time?: string
    speaker?: string
    text: string
  }[]
  tasks?: {
    id: number
    text: string
    assignee?: string
    due_date?: string
    completed: boolean
  }[]
}

// Componente para la tarjeta de reunión
const MeetingCard = ({ meeting, onClick, isSelected }) => (
  <motion.div
    className={`border ${isSelected ? "border-blue-500" : "border-blue-700/30"} rounded-lg p-4 cursor-pointer transition-all ${
      isSelected ? "bg-blue-700/40" : "bg-blue-800/30 hover:bg-blue-700/30"
    }`}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    onClick={onClick}
  >
    <h3 className="text-lg font-medium text-white mb-2">{meeting.title}</h3>
    <div className="flex items-center text-blue-200/70 text-sm mb-2">
      <Calendar className="h-4 w-4 mr-1" />
      <span className="mr-3">{meeting.date}</span>
      {meeting.time && (
        <>
          <Clock className="h-4 w-4 mr-1" />
          <span>
            {meeting.time} {meeting.duration && `(${meeting.duration})`}
          </span>
        </>
      )}
    </div>
    {meeting.participants && (
      <div className="flex items-center text-blue-200/70 text-sm mb-3">
        <Users className="h-4 w-4 mr-1" />
        <span>{meeting.participants} participantes</span>
      </div>
    )}
    {meeting.keywords && meeting.keywords.length > 0 && (
      <div className="flex flex-wrap gap-1">
        {meeting.keywords.map((keyword, idx) => (
          <span key={idx} className="px-2 py-0.5 bg-blue-600/30 text-blue-200 text-xs rounded-full">
            {keyword}
          </span>
        ))}
      </div>
    )}
  </motion.div>
)

// Componente para previsualizar el contenido del PDF
const PDFPreview = ({ meeting, selectedOptions }) => {
  if (!meeting) return null

  return (
    <div className="bg-white text-black p-6 rounded-lg shadow-lg max-h-[70vh] overflow-y-auto">
      {selectedOptions.title && <h1 className="text-2xl font-bold mb-4">{meeting.title}</h1>}

      {selectedOptions.dateTime && (
        <div className="mb-4">
          <p className="text-gray-600">
            <strong>Fecha:</strong> {meeting.date}
            {meeting.time && (
              <>
                {" "}
                | <strong>Hora:</strong> {meeting.time}
              </>
            )}
            {meeting.duration && (
              <>
                {" "}
                | <strong>Duración:</strong> {meeting.duration}
              </>
            )}
          </p>
          {meeting.participants && (
            <p className="text-gray-600">
              <strong>Participantes:</strong> {meeting.participants}
            </p>
          )}
        </div>
      )}

      {selectedOptions.summary && meeting.summary && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Resumen</h2>
          <p className="text-gray-800">{meeting.summary}</p>
        </div>
      )}

      {selectedOptions.keyPoints && meeting.keyPoints && meeting.keyPoints.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Puntos Clave</h2>
          <ul className="list-disc pl-5 space-y-1">
            {meeting.keyPoints.map((point) => (
              <li key={point.id} className="text-gray-800">
                {point.point_text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedOptions.taskList && meeting.tasks && meeting.tasks.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Tareas</h2>
          <ul className="list-disc pl-5 space-y-1">
            {meeting.tasks.map((task) => (
              <li key={task.id} className={`${task.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
                {task.text}
                {task.assignee && <span className="text-gray-600"> - Asignado a: {task.assignee}</span>}
                {task.due_date && <span className="text-gray-600"> - Fecha límite: {task.due_date}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedOptions.speakerTranscript && meeting.transcription && meeting.transcription.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Transcripción</h2>
          <div className="space-y-3">
            {meeting.transcription.map((item) => (
              <div key={item.id} className="border-b border-gray-200 pb-2">
                <div className="flex items-start">
                  {item.speaker && <div className="font-semibold text-blue-600 min-w-[100px]">{item.speaker}:</div>}
                  <div className="flex-1">
                    <p className="text-gray-800">{item.text}</p>
                    {item.time && <span className="text-xs text-gray-500">{item.time}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para el modal de exportación
const ExportModal = ({ meeting, onClose, onExport }) => {
  const [selectedOptions, setSelectedOptions] = useState({
    title: true,
    dateTime: true,
    summary: true,
    keyPoints: false,
    taskList: false,
    speakerTranscript: false,
    includeAudio: false,
  })
  const [showPreview, setShowPreview] = useState(false)
  const [exportFormat, setExportFormat] = useState("pdf")

  const handleOptionChange = (option) => {
    if (option === "includeAudio") {
      setSelectedOptions((prev) => {
        const newState = {
          ...prev,
          [option]: !prev[option],
        }
        // Si se activa includeAudio, automáticamente cambiamos el formato a ZIP
        if (!prev.includeAudio) {
          setExportFormat("zip")
        } else {
          setExportFormat("pdf")
        }
        return newState
      })
    } else {
      setSelectedOptions((prev) => ({
        ...prev,
        [option]: !prev[option],
      }))
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-blue-900/90 border border-blue-700/50 rounded-xl w-full max-w-md mx-auto my-8 overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-blue-700/30 flex justify-between items-center sticky top-0 bg-blue-900/95 backdrop-blur-sm z-10">
          <h2 className="text-xl font-bold text-white">Exportar Reunión</h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-blue-300 hover:text-white hover:bg-blue-800/50"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto">
          <p className="text-blue-100 mb-6 text-sm sm:text-base">
            Selecciona las columnas que deseas incluir en la exportación para la reunión:{" "}
            <span className="font-semibold">{meeting.title}</span>
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="title"
                  checked={selectedOptions.title}
                  onCheckedChange={() => handleOptionChange("title")}
                  className="border-blue-500 data-[state=checked]:bg-blue-600"
                />
                <label htmlFor="title" className="text-white cursor-pointer text-sm sm:text-base">
                  Título
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="dateTime"
                  checked={selectedOptions.dateTime}
                  onCheckedChange={() => handleOptionChange("dateTime")}
                  className="border-blue-500 data-[state=checked]:bg-blue-600"
                />
                <label htmlFor="dateTime" className="text-white cursor-pointer text-sm sm:text-base">
                  Fecha y Hora
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="summary"
                  checked={selectedOptions.summary}
                  onCheckedChange={() => handleOptionChange("summary")}
                  className="border-blue-500 data-[state=checked]:bg-blue-600"
                />
                <label htmlFor="summary" className="text-white cursor-pointer text-sm sm:text-base">
                  Resumen
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="keyPoints"
                  checked={selectedOptions.keyPoints}
                  onCheckedChange={() => handleOptionChange("keyPoints")}
                  className="border-blue-500 data-[state=checked]:bg-blue-600"
                />
                <label htmlFor="keyPoints" className="text-white cursor-pointer text-sm sm:text-base">
                  Puntos Clave
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="taskList"
                  checked={selectedOptions.taskList}
                  onCheckedChange={() => handleOptionChange("taskList")}
                  className="border-blue-500 data-[state=checked]:bg-blue-600"
                />
                <label htmlFor="taskList" className="text-white cursor-pointer text-sm sm:text-base">
                  Lista de Tareas
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="speakerTranscript"
                  checked={selectedOptions.speakerTranscript}
                  onCheckedChange={() => handleOptionChange("speakerTranscript")}
                  className="border-blue-500 data-[state=checked]:bg-blue-600"
                />
                <label htmlFor="speakerTranscript" className="text-white cursor-pointer text-sm sm:text-base">
                  Transcripción
                </label>
              </div>

              {meeting.audio_url && (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="includeAudio"
                    checked={selectedOptions.includeAudio}
                    onCheckedChange={() => handleOptionChange("includeAudio")}
                    className="border-blue-500 data-[state=checked]:bg-blue-600"
                  />
                  <label htmlFor="includeAudio" className="text-white cursor-pointer text-sm sm:text-base">
                    Incluir archivo de audio
                  </label>
                </div>
              )}
            </div>

            {/* Formato de exportación */}
            <div className="mt-6 border-t border-blue-700/30 pt-4">
              <h3 className="text-white font-medium mb-3">Formato de exportación:</h3>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="pdf-format"
                    name="export-format"
                    value="pdf"
                    checked={exportFormat === "pdf" && !selectedOptions.includeAudio}
                    onChange={() => setExportFormat("pdf")}
                    disabled={selectedOptions.includeAudio}
                    className="text-blue-600"
                  />
                  <label
                    htmlFor="pdf-format"
                    className={`flex items-center ${selectedOptions.includeAudio ? "text-blue-400/50" : "text-white"}`}
                  >
                    <FilePdf className="h-4 w-4 mr-1" />
                    PDF
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="zip-format"
                    name="export-format"
                    value="zip"
                    checked={exportFormat === "zip" || selectedOptions.includeAudio}
                    onChange={() => setExportFormat("zip")}
                    className="text-blue-600"
                  />
                  <label htmlFor="zip-format" className="flex items-center text-white">
                    <FileZip className="h-4 w-4 mr-1" />
                    ZIP {selectedOptions.includeAudio && "(Requerido para audio)"}
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="p-4 sm:p-6 border-t border-blue-700/30 sticky bottom-0 bg-blue-900/95 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-blue-600/50 text-blue-300 hover:bg-blue-800/30 order-3 sm:order-1 py-5 sm:py-2"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-blue-600/50 text-blue-300 hover:bg-blue-800/30 order-2 py-5 sm:py-2"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? "Ocultar vista previa" : "Vista previa"}
            </Button>
            <Button
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-3 py-5 sm:py-2"
              onClick={() => onExport(selectedOptions, exportFormat)}
            >
              <Download className="h-4 w-4 mr-2" />
              {exportFormat === "zip" ? "Generar ZIP" : "Generar PDF"}
            </Button>
          </div>
        </div>

        {/* Vista previa */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                className="w-full max-w-4xl mx-auto my-8"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Vista previa del contenido</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-300 hover:text-white hover:bg-blue-800/50"
                    onClick={() => setShowPreview(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <PDFPreview meeting={meeting} selectedOptions={selectedOptions} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// Componente para el filtro de fecha
const DateFilter = ({ selectedDate, onDateChange }) => {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm text-blue-200">Fecha</label>
      <DatePicker
        date={selectedDate}
        setDate={onDateChange}
        className="bg-blue-800/30 border border-blue-700/30 text-white"
      />
    </div>
  )
}

// Componente principal de la página
export default function ExportPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [meetings, setMeetings] = useState([])
  const [availableKeywords, setAvailableKeywords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [exportStatus, setExportStatus] = useState("")

  // Cargar reuniones al iniciar
  useEffect(() => {
    async function loadUserAndMeetings() {
      try {
        const username = getUsername()
        setUsername(username)

        if (username) {
          await fetchMeetings()
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }

    loadUserAndMeetings()
  }, [])

  // Función para cargar reuniones
  const fetchMeetings = async () => {
    setIsLoading(true)
    try {
      const headers = addUsernameToHeaders()
      const response = await fetch(`/api/meetings`, { headers })

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Error de autenticación al cargar reuniones")
        }
        throw new Error(`Error fetching meetings: ${response.status}`)
      }

      const data = await response.json()

      // Formatear las fechas para mostrar
      const formattedMeetings = data.map((meeting) => ({
        ...meeting,
        date: new Date(meeting.date).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        time: meeting.date
          ? new Date(meeting.date).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
      }))

      setMeetings(formattedMeetings)

      // Extraer todas las palabras clave únicas
      const allKeywords = formattedMeetings.flatMap((m) => m.keywords || [])
      const uniqueKeywords = [...new Set(allKeywords)]
      setAvailableKeywords(uniqueKeywords)
    } catch (error) {
      console.error("Error fetching meetings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar detalles completos de una reunión
  const fetchMeetingDetails = async (meetingId) => {
    try {
      const headers = addUsernameToHeaders()
      const response = await fetch(`/api/meetings/${meetingId}`, { headers })

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Error de autenticación al cargar detalles de la reunión")
        }
        throw new Error(`Error fetching meeting details: ${response.status}`)
      }

      const meetingData = await response.json()
      return meetingData
    } catch (error) {
      console.error("Error fetching meeting details:", error)
      return null
    }
  }

  // Descargar archivo de audio
  const downloadAudio = async (audioUrl) => {
    try {
      setExportStatus("Descargando archivo de audio...")
      const response = await fetch(audioUrl)
      if (!response.ok) throw new Error("Error downloading audio file")

      const audioBlob = await response.blob()
      return audioBlob
    } catch (error) {
      console.error("Error downloading audio:", error)
      throw error
    }
  }

  // Filtrar reuniones según los criterios de búsqueda
  const filteredMeetings = meetings.filter((meeting) => {
    // Filtrar por término de búsqueda
    const matchesSearchTerm =
      searchTerm === "" ||
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (meeting.summary && meeting.summary.toLowerCase().includes(searchTerm.toLowerCase()))

    // Filtrar por palabras clave seleccionadas
    const matchesKeywords =
      selectedKeywords.length === 0 ||
      selectedKeywords.some((keyword) => meeting.keywords && meeting.keywords.includes(keyword))

    // Filtrar por fecha
    const matchesDate = !selectedDate || meeting.date.includes(format(selectedDate, "dd MMM", { locale: es }))

    return matchesSearchTerm && matchesKeywords && matchesDate
  })

  // Manejar la selección de una reunión
  const handleSelectMeeting = async (meeting) => {
    const fullMeetingData = await fetchMeetingDetails(meeting.id)
    if (fullMeetingData) {
      setSelectedMeeting({
        ...fullMeetingData,
        date: new Date(fullMeetingData.date).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        time: fullMeetingData.date
          ? new Date(fullMeetingData.date).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : undefined,
      })
      setShowExportModal(true)
    }
  }

  // Generar PDF con jsPDF
  const generatePDF = (meeting, options) => {
    // Crear un nuevo documento PDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Colores para el documento
    const colors = {
      primary: [41, 98, 255], // Azul principal (#2962FF)
      secondary: [25, 118, 210], // Azul secundario (#1976D2)
      accent: [3, 169, 244], // Azul acento (#03A9F4)
      text: [33, 33, 33], // Texto principal (#212121)
      textLight: [97, 97, 97], // Texto secundario (#616161)
      background: [250, 250, 250], // Fondo (#FAFAFA)
      divider: [224, 224, 224], // Divisor (#E0E0E0)
    }

    // Configuración de página
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20,
    }
    const contentWidth = pageWidth - margin.left - margin.right
    let yPos = margin.top

    // Función para añadir encabezado a cada página
    const addHeader = () => {
      // Rectángulo de color en la parte superior
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
      doc.rect(0, 0, pageWidth, 15, "F")

      // Logo o texto de la aplicación
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("JUNTIFY", margin.left, 10)

      // Fecha de generación
      const today = new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(`Generado el: ${today}`, pageWidth - margin.right, 10, { align: "right" })

      // Línea divisoria
      doc.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2])
      doc.setLineWidth(0.1)
      doc.line(margin.left, 15, pageWidth - margin.right, 15)

      return 20 // Retorna la posición Y después del encabezado
    }

    // Función para añadir pie de página a cada página
    const addFooter = (pageNumber) => {
      const totalPages = (doc as any).internal.getNumberOfPages()

      // Línea divisoria
      doc.setDrawColor(colors.divider[0], colors.divider[1], colors.divider[2])
      doc.setLineWidth(0.1)
      doc.line(margin.left, pageHeight - 15, pageWidth - margin.right, pageHeight - 15)

      // Información de página
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" })

      // Información de la aplicación
      doc.text("Juntify - Gestión de Reuniones", margin.left, pageHeight - 10)

      // Información de confidencialidad
      doc.text("Documento confidencial", pageWidth - margin.right, pageHeight - 10, { align: "right" })
    }

    // Función para añadir texto con saltos de línea automáticos
    const addWrappedText = (text, y, fontSize = 12, fontStyle = "normal", color = colors.text) => {
      doc.setFontSize(fontSize)
      doc.setFont("helvetica", fontStyle)
      doc.setTextColor(color[0], color[1], color[2])

      const lines = doc.splitTextToSize(text, contentWidth)
      doc.text(lines, margin.left, y)
      return y + lines.length * (fontSize * 0.352) // Aproximadamente la altura de la línea
    }

    // Función para añadir un título de sección
    const addSectionTitle = (text, y, fontSize = 14) => {
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
      doc.rect(margin.left, y - 6, contentWidth, 8, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(fontSize)
      doc.setFont("helvetica", "bold")
      doc.text(text, margin.left + 5, y)

      return y + 10
    }

    // Función para añadir una lista con viñetas
    const addBulletList = (items, y, fontSize = 10) => {
      doc.setFontSize(fontSize)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2])

      let currentY = y

      items.forEach((item) => {
        doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2])
        doc.circle(margin.left + 2, currentY - 2, 1, "F")

        const lines = doc.splitTextToSize(item, contentWidth - 10)
        doc.text(lines, margin.left + 7, currentY)
        currentY += lines.length * (fontSize * 0.352) + 3
      })

      return currentY + 5
    }

    // Función para verificar si se necesita una nueva página
    const checkForNewPage = (y, requiredSpace) => {
      if (y + requiredSpace > pageHeight - margin.bottom) {
        doc.addPage()
        const pageNum = (doc as any).internal.getNumberOfPages()
        addHeader()
        addFooter(pageNum)
        return margin.top + 10
      }
      return y
    }

    // Iniciar la primera página
    yPos = addHeader()

    // Portada si hay título
    if (options.title) {
      // Línea superior decorativa
      doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2])
      doc.setLineWidth(1)
      doc.line(margin.left, yPos, pageWidth - margin.right, yPos)
      yPos += 10

      // Título de la reunión con estilo más elegante
      doc.setFontSize(20)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])

      const titleLines = doc.splitTextToSize(meeting.title, contentWidth - 10)
      doc.text(titleLines, margin.left, yPos)

      yPos += titleLines.length * 7 + 5

      // Línea decorativa debajo del título
      doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2])
      doc.setLineWidth(0.5)
      doc.line(margin.left, yPos, margin.left + 60, yPos)
      yPos += 10

      // Información de fecha con mejor formato
      if (options.dateTime) {
        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])

        const dateTimeText = `Fecha: ${meeting.date}`
        doc.text(dateTimeText, margin.left, yPos)
        yPos += 5

        if (meeting.time) {
          doc.text(`Hora: ${meeting.time}`, margin.left, yPos)
          yPos += 5
        }

        if (meeting.duration) {
          doc.text(`Duración: ${meeting.duration}`, margin.left, yPos)
          yPos += 5
        }

        if (meeting.participants) {
          doc.text(`Participantes: ${meeting.participants}`, margin.left, yPos)
          yPos += 5
        }
      }

      yPos += 10
    } else if (options.dateTime) {
      // Si no hay título pero sí fecha/hora, mostrar la información de fecha
      let dateTimeText = `Fecha: ${meeting.date}`
      if (meeting.time) dateTimeText += ` | Hora: ${meeting.time}`
      if (meeting.duration) dateTimeText += ` | Duración: ${meeting.duration}`

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2])
      doc.text(dateTimeText, margin.left, yPos)

      if (meeting.participants) {
        doc.text(`Participantes: ${meeting.participants}`, margin.left, yPos + 5)
      }

      yPos += 15
    }

    // Resumen
    if (options.summary && meeting.summary) {
      yPos = checkForNewPage(yPos, 40)
      yPos = addSectionTitle("Resumen", yPos)

      doc.setFillColor(colors.background[0], colors.background[1], colors.background[2])
      doc.rect(margin.left, yPos, contentWidth, 5, "F")

      yPos += 5
      yPos = addWrappedText(meeting.summary, yPos, 10, "normal", colors.text)
      yPos += 10
    }

    // Puntos clave
    if (options.keyPoints && meeting.keyPoints && meeting.keyPoints.length > 0) {
      yPos = checkForNewPage(yPos, 30 + meeting.keyPoints.length * 10)
      yPos = addSectionTitle("Puntos Clave", yPos)

      const keyPointsText = meeting.keyPoints.map((point) => point.point_text)
      yPos = addBulletList(keyPointsText, yPos)
    }

    // Tareas
    if (options.taskList && meeting.tasks && meeting.tasks.length > 0) {
      yPos = checkForNewPage(yPos, 30 + meeting.tasks.length * 15)
      yPos = addSectionTitle("Tareas", yPos)

      // Tabla de tareas
      const taskTableData = meeting.tasks.map((task) => {
        const status = task.completed ? "✓ Completada" : "○ Pendiente"
        const assignee = task.assignee ? task.assignee : "-"
        const dueDate = task.due_date ? task.due_date : "-"
        return [task.text, status, assignee, dueDate]
      })

      autoTable(doc, {
        startY: yPos,
        head: [["Tarea", "Estado", "Asignado a", "Fecha límite"]],
        body: taskTableData,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [colors.secondary[0], colors.secondary[1], colors.secondary[2]],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: 25, halign: "center" },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: margin.left, right: margin.right },
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Transcripción
    if (options.speakerTranscript && meeting.transcription && meeting.transcription.length > 0) {
      yPos = checkForNewPage(yPos, 30)
      yPos = addSectionTitle("Transcripción", yPos)

      // Tabla de transcripción
      const transcriptTableData = meeting.transcription.map((item) => [item.speaker || "", item.time || "", item.text])

      autoTable(doc, {
        startY: yPos,
        head: [["Interlocutor", "Tiempo", "Texto"]],
        body: transcriptTableData,
        theme: "striped",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [colors.secondary[0], colors.secondary[1], colors.secondary[2]],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: "bold" },
          1: { cellWidth: 20, halign: "center" },
          2: { cellWidth: "auto" },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: margin.left, right: margin.right },
      })

      yPos = (doc as any).lastAutoTable.finalY + 10
    }

    // Añadir pie de página a la primera página
    addFooter(1)

    return doc
  }

  // Generar contenido para el archivo de texto
  const generateTextContent = (meeting, options) => {
    let content = ""

    // Título
    if (options.title) {
      content += `${meeting.title}\n`
      content += "=".repeat(meeting.title.length) + "\n\n"
    }

    // Fecha y hora
    if (options.dateTime) {
      content += `Fecha: ${meeting.date}\n`
      if (meeting.time) content += `Hora: ${meeting.time}\n`
      if (meeting.duration) content += `Duración: ${meeting.duration}\n`
      if (meeting.participants) content += `Participantes: ${meeting.participants}\n`
      content += "\n"
    }

    // Resumen
    if (options.summary && meeting.summary) {
      content += "RESUMEN\n"
      content += "=======\n"
      content += `${meeting.summary}\n\n`
    }

    // Puntos clave
    if (options.keyPoints && meeting.keyPoints && meeting.keyPoints.length > 0) {
      content += "PUNTOS CLAVE\n"
      content += "============\n"
      meeting.keyPoints.forEach((point, index) => {
        content += `${index + 1}. ${point.point_text}\n`
      })
      content += "\n"
    }

    // Tareas
    if (options.taskList && meeting.tasks && meeting.tasks.length > 0) {
      content += "TAREAS\n"
      content += "======\n"
      meeting.tasks.forEach((task, index) => {
        let taskText = `${index + 1}. ${task.text}`
        if (task.assignee) taskText += ` - Asignado a: ${task.assignee}`
        if (task.due_date) taskText += ` - Fecha límite: ${task.due_date}`
        content += `${taskText}\n`
      })
      content += "\n"
    }

    // Transcripción
    if (options.speakerTranscript && meeting.transcription && meeting.transcription.length > 0) {
      content += "TRANSCRIPCIÓN\n"
      content += "=============\n"
      meeting.transcription.forEach((item) => {
        let line = ""
        if (item.speaker) line += `${item.speaker}: `
        line += item.text
        if (item.time) line += ` (${item.time})`
        content += `${line}\n`
      })
      content += "\n"
    }

    return content
  }

  // Manejar la exportación
  const handleExport = async (options, format) => {
    setIsExporting(true)
    setExportStatus("Preparando exportación...")

    try {
      const fileName = selectedMeeting.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()

      if (format === "zip" || options.includeAudio) {
        // Crear un nuevo objeto ZIP
        const zip = new JSZip()

        // Añadir el PDF al ZIP
        setExportStatus("Generando PDF...")
        const doc = generatePDF(selectedMeeting, options)
        const pdfBlob = doc.output("blob")
        zip.file(`${fileName}.pdf`, pdfBlob)

        // Añadir archivo de texto plano
        setExportStatus("Generando archivo de texto...")
        const textContent = generateTextContent(selectedMeeting, options)
        zip.file(`${fileName}.txt`, textContent)

        // Si se seleccionó incluir audio, descargarlo y añadirlo al ZIP
        if (options.includeAudio && selectedMeeting.audio_url) {
          try {
            const audioBlob = await downloadAudio(selectedMeeting.audio_url)
            // Extraer la extensión del archivo de audio de la URL
            const audioExtension = selectedMeeting.audio_url.split(".").pop() || "mp3"
            zip.file(`${fileName}.${audioExtension}`, audioBlob)
          } catch (error) {
            console.error("Error al descargar el audio:", error)
            alert("No se pudo descargar el archivo de audio. El ZIP se generará sin el audio.")
          }
        }

        // Generar el archivo ZIP
        setExportStatus("Generando archivo ZIP...")
        const zipBlob = await zip.generateAsync({ type: "blob" })
        saveAs(zipBlob, `${fileName}.zip`)
      } else {
        // Generar solo el PDF
        setExportStatus("Generando PDF...")
        const doc = generatePDF(selectedMeeting, options)
        doc.save(`${fileName}.pdf`)
      }

      setShowExportModal(false)
    } catch (error) {
      console.error("Error generating export:", error)
      alert("Error al generar la exportación. Por favor, inténtalo de nuevo.")
    } finally {
      setIsExporting(false)
      setExportStatus("")
    }
  }

  return (
    <div className="min-h-screen bg-blue-900">
      <main className="container mx-auto px-4 pb-24 pt-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 glow-text">Exportar Reuniones</h1>

          {/* Barra de búsqueda y filtros */}
          <div className="mb-8 bg-blue-800/30 border border-blue-700/30 rounded-lg p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Búsqueda por término */}
              <div className="col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
                  <input
                    type="text"
                    placeholder="Buscar por título o contenido..."
                    className="pl-10 w-full bg-blue-700/40 border border-blue-600/50 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3">
                {/* Filtro por palabras clave */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30 flex-1 sm:flex-none"
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Palabras clave
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-blue-800/90 border border-blue-700/50 p-4 w-56">
                    <div className="space-y-3">
                      <h3 className="text-white font-medium">Filtrar por palabras clave</h3>
                      {availableKeywords.length > 0 ? (
                        availableKeywords.map((keyword) => (
                          <div key={keyword} className="flex items-center space-x-3">
                            <Checkbox
                              id={`keyword-${keyword}`}
                              checked={selectedKeywords.includes(keyword)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedKeywords([...selectedKeywords, keyword])
                                } else {
                                  setSelectedKeywords(selectedKeywords.filter((k) => k !== keyword))
                                }
                              }}
                              className="border-blue-500 data-[state=checked]:bg-blue-600"
                            />
                            <label htmlFor={`keyword-${keyword}`} className="text-white cursor-pointer">
                              {keyword}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-blue-200 text-sm">No hay palabras clave disponibles</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Filtro por fecha */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-blue-600/50 text-blue-300 hover:bg-blue-800/30 flex-1 sm:flex-none"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Fecha
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-blue-800/90 border border-blue-700/50 p-4">
                    <DateFilter selectedDate={selectedDate} onDateChange={setSelectedDate} />
                    {selectedDate && (
                      <Button
                        variant="ghost"
                        className="mt-2 text-blue-300 hover:text-blue-100 p-0 h-auto"
                        onClick={() => setSelectedDate(null)}
                      >
                        Limpiar filtro
                      </Button>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Grid de reuniones */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                <p className="mt-4 text-blue-200">Cargando reuniones...</p>
              </div>
            ) : filteredMeetings.length > 0 ? (
              filteredMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onClick={() => handleSelectMeeting(meeting)}
                  isSelected={selectedMeeting?.id === meeting.id}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-blue-200 text-lg">No se encontraron reuniones con los criterios de búsqueda.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de exportación */}
      <AnimatePresence>
        {showExportModal && selectedMeeting && (
          <ExportModal meeting={selectedMeeting} onClose={() => setShowExportModal(false)} onExport={handleExport} />
        )}
      </AnimatePresence>

      {/* Modal de carga durante exportación */}
      <AnimatePresence>
        {isExporting && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-400 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-4 text-xl text-white">{exportStatus || "Generando exportación..."}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <NewNavbar />
    </div>
  )
}
