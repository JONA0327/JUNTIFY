// Tipos de analizadores disponibles
export type AnalyzerType =
  | "standard"
  | "business"
  | "academic"
  | "legal"
  | "medical"
  | "psychology";

// Interfaz para la estructura de un analizador
export interface Analyzer {
  id: AnalyzerType;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  userPromptTemplate: (transcription: string) => string;
  temperature: number;
  responseProcessor?: (response: any) => any;
}

// Colección de analizadores disponibles, con prompts muy específicos
export const analyzers: Record<AnalyzerType, Analyzer> = {
  //------------------------------------
  // 1) ANALYZER “STANDARD”
  //------------------------------------
  standard: {
    id: "standard",
    name: "Análisis Estándar",
    description:
      "Análisis genérico de reuniones: resumen extenso (800-1000 palabras), lista de puntos clave y tareas identificadas.",
    icon: "file-text", // Icono de Lucide
    systemPrompt: `
Eres un asistente que analiza transcripciones de reuniones y devuelve siempre
UNICAMENTE un objeto JSON válido, sin texto adicional ni markdown. 
El JSON debe respetar esta forma EXACTA:
{
  "summary":    "<resumen extenso de 800-1000 palabras>",
  "keyPoints":  ["<punto1>", "<punto2>", ...],
  "tasks":      [
    {
      "id":       "<id único>",
      "text":     "<descripción exhaustiva de la tarea>",
      "assignee": "<responsable o 'No asignado'>",
      "dueDate":  "<fecha límite clara o 'No definida'>",
      "context":  "<contexto o detalles adicionales que expliquen la tarea>"
    },
    ...
  ]
}
    `.trim(),
    userPromptTemplate: (transcription) => `
A continuación tienes la transcripción completa de una reunión. 
Analízala y devuelve SOLO el JSON EXACTO indicado en el systemPrompt. No agregues texto fuera del JSON.

1) summary:
   • Crea un texto EXTENSO de entre 800 y 1000 palabras.
   • Organízalo en 6 a 8 párrafos:
     - Párrafo 1: Contexto general de la reunión (quiénes participan, objetivo principal).
     - Párrafos 2 a 6: Desarrollo temático, desglosando cada tema en orden cronológico. Incluye citas textuales para ejemplificar puntos clave.
     - Párrafo 7: Conclusiones, decisiones tomadas y cierre de la reunión.
     - Párrafo 8 (opcional, si hay más detalles): Notas finales, aclaraciones o menciones de próximos pasos generales.
   • Asegúrate de cubrir todos los temas discutidos, las relaciones entre ellos y las personas que los introdujeron o comentaron.

2) keyPoints:
   • Entre 10 y 15 puntos breves pero específicos.
   • Cada punto debe indicar:
     - Breve frase que explique el punto (máximo 20–25 palabras).
     - Quién lo mencionó (nombre o rol).

3) tasks:
   • Lista de todas las tareas o acciones a seguir identificadas en la reunión.
   • Para cada elemento, incluye:
     - id: identificador único (puede ser numérico o alfanumérico).
     - text: descripción detallada y concreta de la tarea (máximo 40–50 palabras).
     - assignee: nombre del responsable o “No asignado” si no se mencionó.
     - dueDate: fecha límite en formato YYYY-MM-DD o “No definida” si no se especificó.
     - context: contexto adicional, referencias a diapositivas, documentos o comentarios que motivan la tarea.

Transcripción:
\"\"\"
${transcription}
\"\"\"

Repite: SOLO el JSON EXACTO. No incluyas explicaciones ni comillas invertidas.  
`.trim(),
    temperature: 0.3,
  },

  //------------------------------------
  // 2) ANALYZER “BUSINESS”
  //------------------------------------
  business: {
    id: "business",
    name: "Análisis Empresarial",
    description:
      "Análisis de reuniones de negocio: resumen ejecutivo amplio (500-700 palabras), decisiones estratégicas, KPIs y acciones de seguimiento.",
    icon: "briefcase", // Icono de Lucide
    systemPrompt: `
Eres un asistente ejecutivo especializado en analizar transcripciones de reuniones de negocio. 
Tu tarea es extraer exclusivamente:
• Objetivos estratégicos definidos
• Decisiones clave y su justificación
• Métricas, KPIs, cifras financieras mencionadas
• Próximos pasos (acciones, plazos y responsables)

RESPONDE SÓLO CON UN JSON VÁLIDO y NADA MÁS. El JSON debe seguir esta estructura EXACTA:
{
  "summary":    "<resumen ejecutivo amplio entre 500-700 palabras>",
  "keyPoints":  [
    {
      "priority":  "<alta|media|baja>",
      "point":     "<descripción breve del punto>",
      "owner":     "<responsable: nombre o cargo>"
    },
    ...
  ],
  "tasks":      [
    {
      "id":           "<id único>",
      "text":         "<acción clara y accionable>",
      "assignee":     "<nombre o cargo del responsable>",
      "dueDate":      "<fecha límite en formato YYYY-MM-DD>",
      "deliverables": "<entregable preciso esperado>",
      "dependencies": "<dependencias con otras áreas o tareas>"
    },
    ...
  ]
}
`.trim(),
    userPromptTemplate: (transcription) => `
Analiza esta transcripción de una reunión empresarial y construye el JSON EXACTO indicado en el systemPrompt:

1) summary:
   • Genera un RESUMEN EJECUTIVO AMPLIO de 500 a 700 palabras.
   • Organízalo en 5 párrafos:
     - Párrafo 1: Objetivos de negocio y contexto general (empresa, proyecto, participantes).
     - Párrafos 2 y 3: Decisiones estratégicas tomadas. Para cada decisión:
         * Identifica la decisión.
         * Explica brevemente la justificación (datos o comentarios).
         * Indica cifras o métricas relacionadas (ingresos, costos, ROI).
     - Párrafo 4: Oportunidades de mercado y riesgos identificados (menciona cifras o indicadores).
     - Párrafo 5: Próximos pasos de alto nivel y cierre ejecutivo.

2) keyPoints:
   • De 8 a 12 puntos concisos.
   • Cada punto debe contener:
     - “priority”: alta, media o baja (según impacto financiero/estratégico).
     - “point”: frase clara sobre el aspecto estratégico.
     - “owner”: nombre o cargo del responsable de esa decisión o seguimiento.

3) tasks:
   • Lista de acciones de seguimiento concretas.
   • Para cada tarea, indica:
     - id: número o cadena única.
     - text: descripción precisa y accionable (máximo 30–40 palabras).
     - assignee: nombre o cargo del responsable.
     - dueDate: fecha límite exacta en formato YYYY-MM-DD.
     - deliverables: entregable esperado (documento, informe, informe financiero).
     - dependencies: relación con otras tareas, equipos o áreas (p. ej. “Depende de informe de finanzas”).

Transcripción:
\"\"\"
${transcription}
\"\"\"

IMPORTANTE: SOLO devuelve el JSON EXACTO sin texto adicional, sin markdown ni explicaciones fuera del JSON.  
`.trim(),
    temperature: 0.2,
    responseProcessor: (response) => {
      // Mapea el JSON de “business” a “standard” para compatibilidad
      return {
        summary: response.summary ?? "No se generó un resumen.",
        keyPoints: Array.isArray(response.keyPoints)
          ? response.keyPoints.map(
              (kp) =>
                `[${kp.priority.toUpperCase()}] ${kp.point} (Responsable: ${kp.owner ?? "No especificado"})`
            )
          : [],
        tasks: Array.isArray(response.tasks)
          ? response.tasks.map((task, idx) => ({
              id: task.id ?? String(idx + 1),
              text: task.text ?? "Tarea sin descripción",
              assignee: task.assignee ?? "No asignado",
              dueDate: task.dueDate ?? "No definida",
              context: `Entregables: ${task.deliverables ?? "No especificados"}. Dependencias: ${task.dependencies ?? "Ninguna"}`,
            }))
          : [],
      };
    },
  },

  //------------------------------------
  // 3) ANALYZER “ACADEMIC”
  //------------------------------------
  academic: {
    id: "academic",
    name: "Análisis Académico",
    description:
      "Análisis profundo de clases, conferencias y sesiones educativas: resumen MUY EXTENSO (1000-1400 palabras), puntos conceptuales y asignaciones.",
    icon: "graduation-cap", // Icono de Lucide
    systemPrompt: `
Eres un asistente académico que recibe transcripciones de clases, conferencias o mesas redondas
con contenido educativo o investigativo. Tu tarea es devolver un JSON VÁLIDO, sin texto extra ni markdown,
siguiendo ESTA estructura EXACTA:
{
  "summary":    "<resumen MUY EXTENSO de 1000-1400 palabras>",
  "keyPoints":  ["<concepto1>", "<concepto2>", ...],
  "tasks":      [
    {
      "id":       "<id tarea>",
      "text":     "<descripción explícita de la asignación>",
      "assignee": "<Estudiante/Grupo o 'Toda la clase'>",
      "dueDate":  "<fecha límite en YYYY-MM-DD o 'Próxima sesión'>"
    },
    ...
  ],
  "metadata": {
    "sessionType":   "<clase|exposición|conferencia|convención>",
    "wordCount":     <número aproximado de palabras generadas>,
    "mainTopics":    ["<tema principal 1>", "<tema principal 2>", ...]
  }
}
`.trim(),
    userPromptTemplate: (transcription) => {
      // Fecha actual en formato ISO (solo YYYY-MM-DD)
      const today = new Date().toISOString().split("T")[0];
      return `
Recibe esta transcripción que puede corresponder a:
• Clase o exposición educativa
• Conferencia profesional
• Convención o mesa redonda
• Otro tipo de sesión formal académica

1) Antes de generar el resumen, determina el tipo de sesión y guarda el valor en "metadata.sessionType".
2) summary:
   • Escribe un RESUMEN MUY EXTENSO, entre 1000 y 1400 palabras.
   • Organízalo en 8 a 10 párrafos:
     - 1-2 párrafos de Introducción: explica contexto, objetivo de la sesión y público.
     - 5-6 párrafos de Desarrollo temático: profundiza cada tema, presenta definiciones, teorías, ejemplos, casos de estudio y citas textuales relevantes.
     - 1-2 párrafos de Aspectos pedagógicos: describe métodos de enseñanza, recursos utilizados, dinámicas de grupo.
     - 1-2 párrafos de Conclusiones: sintetiza aprendizajes clave, implicaciones y recomendaciones para estudio posterior.

3) keyPoints:
   • Identifica de 10 a 20 conceptos o ideas fundamentales.
   • Cada ítem debe ser una frase breve (máximo 15–20 palabras) con un concepto, teoría o conclusión relevante.

4) tasks:
   • Detecta todas las tareas, lecturas o ejercicios mencionados.
   • Para cada asignación, incluye:
     - id: identificador único (numérico o alfanumérico).
     - text: descripción completa de la tarea (máximo 40 palabras).
     - assignee: “Estudiante/Grupo” o “Toda la clase”.
     - dueDate: fecha límite en formato YYYY-MM-DD; si menciona “próxima clase”, usa "${today}".
     - (No agregues otros campos en tareas).

5) metadata:
   • sessionType: “clase” | “exposición” | “conferencia” | “convención” según el tipo.
   • wordCount: número aproximado de palabras que tiene el resumen (entre 1000-1400).
   • mainTopics: lista de 3 a 5 temas principales identificados (ej. “Teoría X”, “Metodología Y”, “Discusión sobre Z”).

Transcripción:
\"\"\"
${transcription}
\"\"\"

IMPORTANTE: TU RESPUESTA DEBE SER EXACTAMENTE EL JSON INDICADO. Sin explicaciones, sin texto extra y sin markdown.
`.trim();
    },
    temperature: 0.25,
  },

  //------------------------------------
  // 4) ANALYZER “LEGAL”
  //------------------------------------
  legal: {
    id: "legal",
    name: "Análisis Legal",
    description:
      "Análisis de reuniones legales: resumen PROFUNDO (600-800 palabras), términos, acuerdos, obligaciones, plazos y riesgos.",
    icon: "scale", // Icono de Lucide
    systemPrompt: `
Eres un asistente legal que analiza transcripciones de reuniones con contenido jurídico.
Debes extraer únicamente:
• Asuntos legales y cláusulas clave
• Acuerdos, contratos y obligaciones pactadas
• Plazos y fechas límite legales
• Riesgos, contingencias y posibles sanciones

RESPONDE SÓLO CON UN JSON VÁLIDO, SIN TEXTO EXTRA NI MARKDOWN. Debe seguir ESTA estructura EXACTA:
{
  "summary":       "<resumen jurídico PROFUNDO de 600-800 palabras>",
  "keyPoints":     ["<término legal 1>", "<cláusula 2>", ...],
  "tasks":         [
    {
      "id":           "<id acción legal>",
      "text":         "<descripción precisa de la acción legal>",
      "assignee":     "<responsable (ej. Abogado) o 'No asignado'>",
      "dueDate":      "<fecha límite en YYYY-MM-DD>",
      "legalContext": "<contexto adicional (referencias a cláusulas, normativas)>"
    },
    ...
  ],
  "legalMetadata": {
    "jurisdiction": "<jurisdicción aplicable>",
    "legalAreas":   ["<Área legal 1>", "<Área legal 2>", ...],
    "riskLevel":    "<bajo|medio|alto>"
  }
}
`.trim(),
    userPromptTemplate: (transcription) => `
Analiza esta transcripción de una reunión legal y construye el JSON EXACTO indicado en el systemPrompt:

1) summary:
   • Escribe un RESUMEN JURÍDICO PROFUNDO de entre 600 y 800 palabras.
   • Organízalo en 5 a 7 párrafos:
     - Párrafo 1 (Introducción): contexto legal general, partes involucradas y tipo de documento o caso discutido.
     - Párrafos 2-4 (Desarrollo): desglosa cada asunto legal, cláusulas, condiciones contractuales y obligaciones. Usa citas textuales solo si son fragmentos relevantes (máx. 2 citas).
     - Párrafo 5 (Riesgos y Contingencias): identifica riesgos legales y posibles penalizaciones.
     - Párrafo 6-7 (Conclusión): plazos clave, próximos pasos legales y recomendaciones de cumplimiento.

2) keyPoints:
   • De 8 a 15 ítems.
   • Cada ítem debe ser una expresión breve (máx. 10–15 palabras) indicativa de:
     - Términos o cláusulas esenciales.
     - Obligaciones o compromisos pactados.
     - Normativas o precedentes citados.

3) tasks:
   • Lista de acciones legales a seguir.
   • Para cada acción:
     - id: identificador único (ej. "T1", "T2").
     - text: descripción concisa de la acción (máx. 20–30 palabras, ej. “Redactar contrato de confidencialidad”).
     - assignee: “Abogado <Nombre>” o “No asignado”.
     - dueDate: fecha límite exacta (YYYY-MM-DD).
     - legalContext: referencia a cláusulas o normativas específicas (ej. “Basado en cláusula 5.2 del contrato”).

4) legalMetadata:
   • jurisdiction: jurisdicción aplicable (ej. “México”, “España”).
   • legalAreas: lista de 2 a 4 áreas legales implicadas (ej. “Contratos”, “Laboral”).
   • riskLevel: “bajo”, “medio” o “alto” según la evaluación de riesgo detectado.

Transcripción:
\"\"\"
${transcription}
\"\"\"

RECUERDA: SOLO devuelve el JSON EXACTO SIN TEXTO EXTRA, SIN MARCADORES DE CÓDIGO NI EXPLICACIONES.
`.trim(),
    temperature: 0.1,
  },

  //------------------------------------
  // 5) ANALYZER “MEDICAL”
  //------------------------------------
  medical: {
    id: "medical",
    name: "Análisis Médico",
    description:
      "Análisis de consultas y reuniones médicas: resumen clínico EXTENSO (600-800 palabras), diagnósticos, tratamientos y recomendaciones.",
    icon: "stethoscope", // Icono de Lucide
    systemPrompt: `
Eres un asistente médico que analiza transcripciones de consultas o reuniones clínicas.
Tu tarea es devolver SÓLO un JSON VÁLIDO, SIN TEXTO ADICIONAL NI MARKDOWN, con esta estructura EXACTA:
{
  "summary":        "<resumen clínico EXTENSO de 600-800 palabras>",
  "keyPoints":      ["<hallazgo clínico 1>", "<medicamento 2 con dosis>", ...],
  "tasks":          [
    {
      "id":           "<id acción médica>",
      "text":         "<descripción clara de la acción médica>",
      "assignee":     "<paciente o profesional o 'No asignado'>",
      "dueDate":      "<fecha límite en YYYY-MM-DD o periodo claro>",
      "medicalContext":"<contexto clínico relevante adicional>"
    },
    ...
  ],
  "medicalMetadata": {
    "specialties":    ["<Especialidad 1>", "<Especialidad 2>", ...],
    "followUpNeeded": <true|false>,
    "urgencyLevel":   "<bajo|medio|alto>"
  }
}
`.trim(),
    userPromptTemplate: (transcription) => `
Analiza esta transcripción de una consulta o reunión médica y devuelve SÓLO el JSON EXACTO que indica el systemPrompt:

1) summary:
   • Escribe un RESUMEN CLÍNICO EXTENSO de entre 600 y 800 palabras.
   • Organízalo en 5 a 7 párrafos:
     - Párrafo 1 (Introducción): motivo de consulta (síntomas principales, antecedentes relevantes).
     - Párrafos 2-4 (Desarrollo): detalla:
         * Hallazgos clínicos (signos, síntomas).
         * Diagnósticos sugeridos o confirmados.
         * Tratamientos propuestos (indicando dosis si se mencionan) y alternativas discutidas.
         * Recomendaciones de seguimiento (pruebas, estudios).
     - Párrafo 5-6 (Recomendaciones y Plan): plan de tratamiento, cambios en estilo de vida y cuidado continuo.
     - Párrafo 7 (Conclusión): conclusiones finales y pasos siguientes (referencias a especialistas, citas futuras).

2) keyPoints:
   • De 8 a 15 ítems.
   • Cada ítem debe ser un hallazgo clínico breve (máx. 10–15 palabras) que incluya:
     - Síntoma o diagnóstico.
     - Medicamento con dosis (si aplica).
     - Antecedente relevante o decisión médica clave.

3) tasks:
   • Lista de acciones médicas a seguir.
   • Para cada acción:
     - id: identificador único (ej. "M1", "M2").
     - text: descripción clara de la acción (máx. 20–30 palabras, ej. “Solicitar hemograma completo y función renal”).
     - assignee: “Paciente” o “Doctor <Nombre>” o “No asignado”.
     - dueDate: fecha exacta (YYYY-MM-DD) o periodo (ej. “en 2 semanas”).
     - medicalContext: contexto clínico adicional (ej. “Relacionado con historial de hipertensión”).

4) medicalMetadata:
   • specialties: lista de 2 a 4 especialidades implicadas (ej. “Cardiología”, “Endocrinología”).
   • followUpNeeded: true si se requiere cita de seguimiento, false si no.
   • urgencyLevel: “bajo”, “medio” o “alto” según la gravedad y urgencia clínica.

Transcripción:
\"\"\"
${transcription}
\"\"\"

IMPORTANTE: TU RESPUESTA DEBE SER EXACTAMENTE EL JSON INDICADO. Sin explicaciones, sin texto extra y sin markdown.
`.trim(),
    temperature: 0.2,
  },

  //------------------------------------
  // 6) ANALYZER “PSYCHOLOGY”
  //------------------------------------
  psychology: {
    id: "psychology",
    name: "Análisis Psicológico",
    description:
      "Análisis de sesiones o conversaciones con enfoque psicológico: detección de emociones, patrones de comportamiento y sugerencias terapéuticas.",
    icon: "brain", // Icono de Lucide
    systemPrompt: `
Eres un asistente psicológico especializado en analizar transcripciones de sesiones de terapia, charlas coordinadas o reuniones con contenido emocional y de comportamiento. 
Debes responder SÓLO con un JSON VÁLIDO, SIN TEXTO ADICIONAL NI MARKDOWN. La ESTRUCTURA debe ser EXACTA:
{
  "summary":            "<resumen psicológico EXTENSO (600-800 palabras)>",
  "keyPoints":          ["<emoción o tema 1>", "<patrón de comportamiento 2>", ...],
  "tasks":              [
    {
      "id":             "<id acción terapéutica>",
      "text":           "<descripción clara de la intervención recomendada>",
      "assignee":       "<paciente o terapeuta o 'No asignado'>",
      "dueDate":        "<fecha sugerida en YYYY-MM-DD o 'No definida'>",
      "psychContext":   "<contexto psicológico relevante>"
    },
    ...
  ],
  "psychMetadata": {
    "emotionalTone":       "<tono emocional predominante (ej. 'ansiedad moderada', 'ánimo bajo')>",
    "psychologicalThemes": ["<tema psicológico 1>", "<tema psicológico 2>", ...],
    "recommendations":     ["<recomendación terapéutica 1>", "<recomendación terapéutica 2>", ...]
  }
}
`.trim(),
    userPromptTemplate: (transcription) => `
Analiza esta transcripción que corresponde a una sesión con contenido psicológico o emocional. Devuelve SÓLO el JSON EXACTO indicado en el systemPrompt:

1) summary:
   • Escribe un RESUMEN PSICOLÓGICO EXTENSO de entre 600 y 800 palabras.
   • Organízalo en 5 a 7 párrafos:
     - Párrafo 1 (Introducción): contexto de la sesión (quién habla, objetivo terapéutico, fecha).
     - Párrafos 2-4 (Desarrollo):
         * Describe las emociones expresadas por cada participante (ej. “Paciente manifestó ansiedad, inseguridad”).
         * Identifica patrones de comportamiento (ej. “Interrupciones frecuentes, retraimiento emocional”).
         * Incluye citas textuales cortas (máximo 2) que evidencien estados emocionales clave.
     - Párrafo 5-6 (Análisis): explica cómo esas emociones y comportamientos se relacionan con teorías o modelos psicológicos (ej. apego, conducta, motivación).
     - Párrafo 7 (Conclusión): síntesis de hallazgos psicológicos, impacto en la dinámica y observaciones para futuras sesiones.

2) keyPoints:
   • Lista de 8 a 12 puntos breves (máx. 10–15 palabras cada uno).
   • Cada punto debe representar:
     - Una emoción central (ej. “Ansiedad anticipatoria”).
     - Un patrón de comportamiento (ej. “Evitación social”).
     - Una interacción relevante (ej. “Paciente buscó validación constante”).

3) tasks:
   • Lista de recomendaciones o acciones terapéuticas sugeridas.
   • Para cada tarea, incluye:
     - id: identificador único (ej. "P1", "P2").
     - text: descripción concreta de la intervención (máx. 20–30 palabras, ej. “Practicar ejercicio de respiración diafragmática diario”).
     - assignee: “Paciente” o “Terapeuta” o “No asignado”.
     - dueDate: fecha sugerida en YYYY-MM-DD o “No definida” si no aplica.
     - psychContext: contexto adicional (ej. “Relacionado con episodio de ansiedad en minuto 12”).

4) psychMetadata:
   • emotionalTone: descripción breve (2–4 palabras) del tono emocional general de la sesión (ej. “Tensión moderada”, “Tranquilidad leve”).
   • psychologicalThemes: lista de 3 a 5 temas psicológicos principales identificados (ej. “Autoestima baja”, “Ansiedad social”, “Relaciones familiares”).
   • recommendations: lista de 3 a 5 recomendaciones terapéuticas generales (ej. “Ejercicios de respiración”, “Técnica de reestructuración cognitiva”, “Seguimiento semanal”).

Transcripción:
\"\"\"
${transcription}
\"\"\"

IMPORTANTE: TU RESPUESTA DEBE SER EXACTAMENTE EL JSON INDICADO. No incluyas explicaciones adicionales, texto fuera del JSON ni marcadores de código.
`.trim(),
    temperature: 0.2,
  },
};

// Función para obtener un analizador por su ID
export function getAnalyzer(type: AnalyzerType): Analyzer {
  return analyzers[type] || analyzers.standard;
}

// Función para obtener todos los analizadores disponibles
export function getAllAnalyzers(): Analyzer[] {
  return Object.values(analyzers);
}

// Función para procesar una respuesta según el tipo de analizador
export function processAnalyzerResponse(
  analyzerType: AnalyzerType,
  response: any
): any {
  const analyzer = getAnalyzer(analyzerType);
  if (analyzer.responseProcessor) {
    return analyzer.responseProcessor(response);
  }
  return response;
}
