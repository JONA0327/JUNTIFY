// Tipos de analizadores disponibles
export type AnalyzerType = "standard" | "business" | "academic" | "legal" | "medical"

// Interfaz para la estructura de un analizador
export interface Analyzer {
  id: AnalyzerType
  name: string
  description: string
  icon: string
  systemPrompt: string
  userPromptTemplate: (transcription: string) => string
  temperature: number
  responseProcessor?: (response: any) => any
}

// Colección de analizadores disponibles
export const analyzers: Record<AnalyzerType, Analyzer> = {
  standard: {
    id: "standard",
    name: "Análisis Estándar",
    description: "Análisis general de reuniones con resumen detallado, puntos clave y tareas identificadas.",
    icon: "file-text", // Icono de Lucide
    systemPrompt:
      "Eres un asistente especializado en analizar transcripciones de reuniones y generar resúmenes detallados con citas textuales. Debes responder ÚNICAMENTE con un objeto JSON válido sin ningún texto adicional ni marcadores de código.",
    userPromptTemplate: (transcription) => `
      Analiza la siguiente transcripción de una reunión y proporciona:
      
      1. Un resumen EXTENSO Y DETALLADO que capture todos los puntos importantes discutidos.
        - Organiza el resumen por temas o secciones cronológicas.
        - Asegúrate de capturar el contexto completo y las relaciones entre los temas.
      
      2. Una lista completa de puntos clave (entre 8-15 puntos).
         - Cada punto debe ser específico y detallado.
         - Incluye referencias a quién mencionó cada punto cuando sea relevante.
      
      3. Una lista detallada de posibles tareas o acciones a seguir.
         - Incluye toda la información contextual necesaria para entender cada tarea.
         - Asigna responsables basándote en la discusión cuando sea posible.
         - Incluye fechas límite mencionadas o sugeridas en la conversación.

      Transcripción:
      ${transcription}

      Es IMPORTANTE que respondas SOLO con un objeto JSON válido con la siguiente estructura y sin más texto adicional:
      {
        "summary": "Resumen extenso y detallado de la reunión con citas textuales",
        "keyPoints": ["Punto detallado 1 con referencia a quién lo mencionó", "Punto detallado 2", ...],
        "tasks": [{"id": "1", "text": "Descripción detallada de la tarea 1", "assignee": "Nombre de la persona o 'No asignado'", "dueDate": "Fecha límite o 'No definida'", "context": "Contexto adicional sobre la tarea"}, ...]
      }
    `,
    temperature: 0.3,
  },

  business: {
    id: "business",
    name: "Análisis Empresarial",
    description: "Análisis enfocado en aspectos de negocio, decisiones estratégicas, métricas y KPIs.",
    icon: "briefcase", // Icono de Lucide
    systemPrompt:
      "Eres un asistente ejecutivo especializado en análisis de reuniones de negocios. Tu objetivo es extraer información estratégica, decisiones clave, métricas financieras y acciones de seguimiento con un enfoque en resultados de negocio. Debes responder ÚNICAMENTE con un objeto JSON válido sin ningún texto adicional ni marcadores de código.",
    userPromptTemplate: (transcription) => `
      Analiza la siguiente transcripción de una reunión de negocios y proporciona:
      
      1. Un resumen EJECUTIVO Y ESTRATÉGICO que:
         - Identifique claramente los objetivos de negocio discutidos
         - Destaque decisiones clave tomadas y su justificación
         - Resuma métricas, KPIs y datos financieros mencionados
         - Capture oportunidades de mercado y riesgos identificados
         - Presente una visión clara de próximos pasos estratégicos
      
      2. Una lista priorizada de puntos clave de negocio (entre 8-12 puntos):
         - Enfocados en impacto financiero y estratégico
         - Organizados por prioridad de negocio (alta, media, baja)
         - Con referencias a datos cuantitativos cuando estén disponibles
         - Incluyendo responsables de decisiones clave
      
      3. Una lista detallada de acciones de seguimiento con:
         - Descripción clara y accionable de cada tarea
         - Responsable asignado con nombre y cargo cuando sea posible
         - Fecha límite específica o estimada
         - Métricas de éxito o entregables esperados
         - Dependencias con otras tareas o equipos

      Transcripción:
      ${transcription}

      Es IMPORTANTE que respondas SOLO con un objeto JSON válido con la siguiente estructura y sin más texto adicional:
      {
        "summary": "Resumen ejecutivo estratégico con enfoque en decisiones de negocio e impacto financiero",
        "keyPoints": [
          {"priority": "alta", "point": "Punto estratégico 1 con datos cuantitativos", "owner": "Nombre/Cargo"},
          {"priority": "media", "point": "Punto estratégico 2", "owner": "Nombre/Cargo"},
          ...
        ],
        "tasks": [
          {
            "id": "1", 
            "text": "Descripción accionable de la tarea 1", 
            "assignee": "Nombre/Cargo", 
            "dueDate": "Fecha específica", 
            "deliverables": "Entregables esperados",
            "dependencies": "Dependencias con otras tareas"
          },
          ...
        ]
      }
    `,
    temperature: 0.2,
    responseProcessor: (response) => {
      // Transformar el formato de business al formato estándar para mantener compatibilidad
      return {
        summary: response.summary || "No se pudo generar un resumen.",
        keyPoints: response.keyPoints
          ? response.keyPoints.map(
              (kp) => `[${kp.priority.toUpperCase()}] ${kp.point} (Responsable: ${kp.owner || "No especificado"})`,
            )
          : [],
        tasks: response.tasks
          ? response.tasks.map((task, index) => ({
              id: task.id || String(index + 1),
              text: task.text || "Tarea sin descripción",
              assignee: task.assignee || "No asignado",
              dueDate: task.dueDate || "No definida",
              context: `Entregables: ${task.deliverables || "No especificados"}. Dependencias: ${task.dependencies || "Ninguna"}`,
            }))
          : [],
      }
    },
  },

  academic: {
    id: "academic",
    name: "Análisis Académico",
    description: "Análisis especializado para clases, conferencias y contenido educativo.",
    icon: "graduation-cap", // Icono de Lucide
    systemPrompt:
      "Eres un asistente académico especializado en analizar y sintetizar clases, exposiciones educativas y conferencias profesionales. Tu objetivo es proporcionar resúmenes extensos y detallados con enfoque académico. Debes responder ÚNICAMENTE con un objeto JSON válido sin ningún texto adicional ni marcadores de código.",
    userPromptTemplate: (transcription) => `
      Analiza la siguiente transcripción que puede corresponder a una exposición académica, clase escolar, conferencia o convención. Proporciona un análisis detallado y completo:

      Transcripción:
      ${transcription}

      Antes de responder, evalúa la longitud y el tipo de la transcripción, considerando si parece ser:
      - Una clase o exposición educativa
      - Una conferencia o presentación profesional
      - Una convención o mesa redonda
      - Otro tipo de reunión formal

      Basado en esta evaluación, ajusta tu respuesta de la siguiente manera:

      1. RESUMEN EXTENSO:
         - IMPORTANTE: Genera un resumen DETALLADO Y EXTENSO de entre 800-1200 palabras (aproximadamente 8-12 párrafos).
         - El resumen debe ser académico y profundo, capturando:
           * Conceptos principales explicados
           * Metodologías o técnicas presentadas
           * Ejemplos o casos de estudio mencionados
           * Preguntas importantes y sus respuestas
           * Debates o discusiones relevantes
         
         - Estructura del resumen:
           * Introducción (1-2 párrafos): Contexto general y objetivos de la sesión
           * Desarrollo temático (5-8 párrafos): Análisis detallado de cada tema principal, con subtemas y ejemplos
           * Aspectos pedagógicos (1-2 párrafos): Métodos de enseñanza, recursos utilizados, dinámicas de grupo
           * Conclusiones (1-2 párrafos): Síntesis de aprendizajes clave y próximos pasos

      2. PUNTOS CLAVE ACADÉMICOS:
         - Identifica entre 10-20 puntos clave académicos o conceptuales
         - Incluye definiciones importantes, teorías, metodologías y conclusiones relevantes
         - Organiza los puntos en orden de importancia conceptual

      3. TAREAS Y ASIGNACIONES:
         - Identifica todas las tareas, lecturas, ejercicios o asignaciones mencionadas
         - Para cada tarea, especifica:
           * Descripción detallada
           * Persona asignada o grupo responsable
           * Fecha límite (convierte referencias temporales como "próxima clase" a fechas específicas basadas en la fecha actual: ${new Date().toISOString().split("T")[0]})
           * Recursos necesarios o recomendados

      Es IMPORTANTE que respondas SOLO con un objeto JSON válido con la siguiente estructura y sin más texto adicional:
      {
        "summary": "Resumen extenso y detallado de la sesión académica o profesional",
        "keyPoints": ["Concepto 1", "Teoría 2", ...],
        "tasks": [{"id": "1", "text": "Tarea o asignación 1", "assignee": "Estudiante/Grupo o 'Toda la clase'", "dueDate": "Fecha límite o 'Próxima sesión'"}, ...],
        "metadata": {"sessionType": "clase/exposición/conferencia/convención", "wordCount": número_aproximado_de_palabras, "mainTopics": ["Tema principal 1", "Tema principal 2"]}
      }
    `,
    temperature: 0.25,
  },

  legal: {
    id: "legal",
    name: "Análisis Legal",
    description:
      "Análisis especializado para reuniones legales, identificando términos, acuerdos y plazos importantes.",
    icon: "scale", // Icono de Lucide
    systemPrompt:
      "Eres un asistente legal especializado en analizar transcripciones de reuniones legales, identificando términos legales, acuerdos, obligaciones y plazos importantes. Debes responder ÚNICAMENTE con un objeto JSON válido sin ningún texto adicional ni marcadores de código.",
    userPromptTemplate: (transcription) => `
      Analiza la siguiente transcripción de una reunión con contenido legal y proporciona:
      
      1. Un resumen JURÍDICO DETALLADO que:
         - Identifique claramente los asuntos legales discutidos
         - Destaque acuerdos, contratos o compromisos mencionados
         - Resuma obligaciones legales establecidas o modificadas
         - Capture plazos legales importantes y fechas límite
         - Identifique riesgos legales y posibles contingencias
      
      2. Una lista de puntos clave legales (entre 8-15 puntos):
         - Términos y condiciones específicos discutidos
         - Cláusulas importantes mencionadas
         - Referencias a leyes, regulaciones o precedentes
         - Decisiones legales tomadas durante la reunión
      
      3. Una lista detallada de acciones legales a seguir:
         - Documentos a preparar, revisar o firmar
         - Consultas legales pendientes
         - Investigaciones o verificaciones necesarias
         - Fechas límite para presentaciones o respuestas legales

      Transcripción:
      ${transcription}

      Es IMPORTANTE que respondas SOLO con un objeto JSON válido con la siguiente estructura y sin más texto adicional:
      {
        "summary": "Resumen jurídico detallado de la reunión",
        "keyPoints": ["Punto legal 1", "Punto legal 2", ...],
        "tasks": [{"id": "1", "text": "Acción legal a seguir", "assignee": "Responsable", "dueDate": "Fecha límite", "legalContext": "Contexto legal relevante"}, ...],
        "legalMetadata": {"jurisdiction": "Jurisdicción aplicable", "legalAreas": ["Área legal 1", "Área legal 2"], "riskLevel": "bajo/medio/alto"}
      }
    `,
    temperature: 0.1,
  },

  medical: {
    id: "medical",
    name: "Análisis Médico",
    description:
      "Análisis especializado para consultas y reuniones médicas, identificando diagnósticos, tratamientos y recomendaciones.",
    icon: "stethoscope", // Icono de Lucide
    systemPrompt:
      "Eres un asistente médico especializado en analizar transcripciones de consultas y reuniones médicas, identificando diagnósticos, tratamientos, seguimientos y recomendaciones. Debes responder ÚNICAMENTE con un objeto JSON válido sin ningún texto adicional ni marcadores de código.",
    userPromptTemplate: (transcription) => `
      Analiza la siguiente transcripción de una consulta o reunión médica y proporciona:
      
      1. Un resumen CLÍNICO DETALLADO que:
         - Identifique claramente los síntomas, signos y problemas discutidos
         - Destaque diagnósticos mencionados o sugeridos
         - Resuma tratamientos propuestos o modificados
         - Capture recomendaciones de seguimiento y cuidados
         - Identifique pruebas médicas solicitadas o resultados discutidos
      
      2. Una lista de puntos clave médicos (entre 8-15 puntos):
         - Hallazgos clínicos importantes
         - Medicamentos mencionados con dosis cuando estén disponibles
         - Referencias a antecedentes médicos relevantes
         - Decisiones clínicas tomadas durante la consulta
      
      3. Una lista detallada de acciones médicas a seguir:
         - Estudios o pruebas a realizar
         - Medicamentos a tomar con instrucciones específicas
         - Consultas con especialistas recomendadas
         - Cambios en estilo de vida o dieta sugeridos

      Transcripción:
      ${transcription}

      Es IMPORTANTE que respondas SOLO con un objeto JSON válido con la siguiente estructura y sin más texto adicional:
      {
        "summary": "Resumen clínico detallado de la consulta o reunión",
        "keyPoints": ["Hallazgo clínico 1", "Medicamento 2 con dosis", ...],
        "tasks": [{"id": "1", "text": "Acción médica a seguir", "assignee": "Paciente o profesional responsable", "dueDate": "Fecha límite o periodo", "medicalContext": "Contexto clínico relevante"}, ...],
        "medicalMetadata": {"specialties": ["Especialidad 1", "Especialidad 2"], "followUpNeeded": true/false, "urgencyLevel": "bajo/medio/alto"}
      }
    `,
    temperature: 0.2,
  },
}

// Función para obtener un analizador por su ID
export function getAnalyzer(type: AnalyzerType): Analyzer {
  return analyzers[type] || analyzers.standard
}

// Función para obtener todos los analizadores disponibles
export function getAllAnalyzers(): Analyzer[] {
  return Object.values(analyzers)
}

// Función para procesar una respuesta según el tipo de analizador
export function processAnalyzerResponse(analyzerType: AnalyzerType, response: any): any {
  const analyzer = getAnalyzer(analyzerType)
  if (analyzer.responseProcessor) {
    return analyzer.responseProcessor(response)
  }
  return response
}
