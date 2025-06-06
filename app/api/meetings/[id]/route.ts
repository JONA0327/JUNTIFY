import { type NextRequest, NextResponse } from "next/server"
import { meetingService } from "@/services/meetingService"
import { google } from "googleapis"
import { query } from "@/utils/mysql"
import { getUsernameFromRequest } from "@/utils/user-helpers";
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Obtener el ID de la reunión de los parámetros
    const meetingId = Number.parseInt(params.id)
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "ID de reunión inválido" }, { status: 400 })
    }

    // Obtener el nombre de usuario de la solicitud
    const username = request.headers.get("X-Username")

    if (!username) {
      console.error("No se encontró el nombre de usuario en la solicitud")
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    console.log(`API: Obteniendo detalles de la reunión ${meetingId} para el usuario ${username}`)

    // Obtener los detalles completos de la reunión
    const meeting = await meetingService.getMeetingById(meetingId, username)
    if (!meeting) {
      return NextResponse.json({ error: "Reunión no encontrada" }, { status: 404 })
    }

    // Contar participantes únicos basados en los hablantes de la transcripción
    const participantsResult = await query(
      "SELECT COUNT(DISTINCT speaker) as count FROM transcriptions WHERE meeting_id = ? AND speaker IS NOT NULL AND speaker != ''",
      [meetingId],
    )

    const participantCount = participantsResult[0]?.count || 0

    // Actualizar el campo de participantes si hay hablantes
    if (participantCount > 0) {
      meeting.participants = participantCount
    }

    // Asegurarse de que los arrays estén inicializados correctamente
    const formattedMeeting = {
      ...meeting,
      transcription: meeting.transcription || [],
      keyPoints: meeting.keyPoints || [],
      tasks: meeting.tasks || [],
      keywords: meeting.keywords || [],
    }

    // Devolver los detalles de la reunión
    return NextResponse.json(formattedMeeting)
  } catch (error) {
    console.error("Error al obtener detalles de la reunión:", error)
    return NextResponse.json({ error: "Error al obtener detalles de la reunión" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Obtener el ID de la reunión de los parámetros
    const meetingId = Number.parseInt(params.id)
    if (isNaN(meetingId)) {
      return NextResponse.json({ error: "ID de reunión inválido" }, { status: 400 })
    }

    // Obtener el nombre de usuario de la solicitud
    const username = request.headers.get("X-Username")

    if (!username) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Obtener los datos de actualización del cuerpo de la solicitud
    const updateData = await request.json()

    // Actualizar la reunión
    const updatedMeeting = await meetingService.updateMeeting(meetingId, username, updateData)
    if (!updatedMeeting) {
      return NextResponse.json({ error: "No se pudo actualizar la reunión" }, { status: 400 })
    }

    // Devolver la reunión actualizada
    return NextResponse.json(updatedMeeting)
  } catch (error) {
    console.error("Error al actualizar la reunión:", error)
    return NextResponse.json({ error: "Error al actualizar la reunión" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  const { id } = await params;
  const meetingId = id;
  try {
    // 1. Obtén el username del request
    const username = await getUsernameFromRequest(request);
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Obtén la info actual de la reunión
    const [meeting] = await query("SELECT * FROM meetings WHERE id = ?", [meetingId]);
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    const oldTitle = meeting.title;

    // 3. Obtén el folderId de la carpeta de Drive del usuario
    const folderResult = await query(
      "SELECT recordings_folder_id FROM google_tokens WHERE username = ? AND recordings_folder_id IS NOT NULL",
      [username]
    );
    if (!folderResult || folderResult.length === 0) {
      return NextResponse.json({ error: "No recordings folder found for user" }, { status: 404 });
    }
    const userFolderId = folderResult[0].recordings_folder_id;

    // 4. Funciones de limpieza de nombre
    function cleanTitleNoAccents(title: string): string {
      return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
    }
    function cleanTitleWithUnderscores(title: string): string {
      return title
        .replace(/[áÁàÀäÄâÂãÃåÅ]/g, "_")
        .replace(/[éÉèÈëËêÊ]/g, "_")
        .replace(/[íÍìÌïÏîÎ]/g, "_")
        .replace(/[óÓòÒöÖôÔõÕøØ]/g, "_")
        .replace(/[úÚùÙüÜûÛ]/g, "_")
        .replace(/[ñÑ]/g, "_")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
    }

    const oldFileNameNoAccents = `${meetingId}_${cleanTitleNoAccents(oldTitle)}.aac`;
    const oldFileNameWithUnderscores = `${meetingId}_${cleanTitleWithUnderscores(oldTitle)}.aac`;

    // 5. Autenticación Google Drive
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 6. Buscar el archivo en Drive (primero sin acentos)
    let response = await drive.files.list({
      q: `name = '${oldFileNameNoAccents}' and '${userFolderId}' in parents and trashed = false`,
      fields: "files(id, name)",
    });

    if (!response.data.files || response.data.files.length !== 1) {
      // Si no lo encuentra, busca con guiones bajos
      response = await drive.files.list({
        q: `name = '${oldFileNameWithUnderscores}' and '${userFolderId}' in parents and trashed = false`,
        fields: "files(id, name)",
      });
    }

    // 7. Si lo encuentra, elimina el archivo de Drive
    if (response.data.files && response.data.files.length === 1) {
      const fileId = response.data.files[0].id;
      await drive.files.delete({ fileId });
      console.log("Archivo de Drive eliminado:", response.data.files[0].name);
    } else {
      console.warn("No se encontró archivo de Drive para eliminar.");
    }

    // 8. Elimina la conversación de la base de datos
    await query("DELETE FROM meetings WHERE id = ?", [meetingId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/meetings/[id]:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}




export async function PATCH(request: Request, { params }: { params: any }) {
  const { id } = await params;
  const meetingId = id;
  try {
    const { newTitle } = await request.json();

    // 1. Obtén el username del request
    const username = await getUsernameFromRequest(request);
    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Obtén la info actual de la reunión (antes de actualizar el título)
    const [meeting] = await query("SELECT * FROM meetings WHERE id = ?", [meetingId]);
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    const oldTitle = meeting.title;

    // 3. Obtén el folderId de la carpeta de Drive del usuario
    const folderResult = await query(
      "SELECT recordings_folder_id FROM google_tokens WHERE username = ? AND recordings_folder_id IS NOT NULL",
      [username]
    );
    if (!folderResult || folderResult.length === 0) {
      return NextResponse.json({ error: "No recordings folder found for user" }, { status: 404 });
    }
    const userFolderId = folderResult[0].recordings_folder_id;

    // 4. Funciones de limpieza
    function cleanTitleNoAccents(title: string): string {
      return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
    }
    function cleanTitleWithUnderscores(title: string): string {
      return title
        .replace(/[áÁàÀäÄâÂãÃåÅ]/g, "_")
        .replace(/[éÉèÈëËêÊ]/g, "_")
        .replace(/[íÍìÌïÏîÎ]/g, "_")
        .replace(/[óÓòÒöÖôÔõÕøØ]/g, "_")
        .replace(/[úÚùÙüÜûÛ]/g, "_")
        .replace(/[ñÑ]/g, "_")
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "");
    }

    // 5. Aplica limpieza a ambos títulos
    const cleanOldTitleNoAccents = cleanTitleNoAccents(oldTitle);
    const cleanOldTitleWithUnderscores = cleanTitleWithUnderscores(oldTitle);
    const cleanNewTitleWithUnderscores = cleanTitleWithUnderscores(newTitle);

    const oldFileNameNoAccents = `${meetingId}_${cleanOldTitleNoAccents}.aac`;
    const oldFileNameWithUnderscores = `${meetingId}_${cleanOldTitleWithUnderscores}.aac`;
    const newFileName = `${meetingId}_${cleanNewTitleWithUnderscores}.aac`;

    // 6. Autenticación Google Drive
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const drive = google.drive({ version: "v3", auth });

    // 7. Buscar el archivo por el nombre VIEJO y carpeta (primero sin acentos)
    console.log("Buscando archivo (sin acentos):", oldFileNameNoAccents, "en carpeta:", userFolderId);
    let response = await drive.files.list({
      q: `name = '${oldFileNameNoAccents}' and '${userFolderId}' in parents and trashed = false`,
      fields: "files(id, name)",
    });
    console.log("Archivos encontrados (sin acentos):", response.data.files);

    if (!response.data.files || response.data.files.length !== 1) {
      // Si no lo encuentra, busca con guiones bajos
      console.log("No encontrado, buscando archivo (con guiones bajos):", oldFileNameWithUnderscores, "en carpeta:", userFolderId);
      response = await drive.files.list({
        q: `name = '${oldFileNameWithUnderscores}' and '${userFolderId}' in parents and trashed = false`,
        fields: "files(id, name)",
      });
      console.log("Archivos encontrados (con guiones bajos):", response.data.files);
    }

    if (response.data.files && response.data.files.length === 1) {
      const fileId = response.data.files[0].id;
      // 8. Renombrar el archivo
      await drive.files.update({
        fileId,
        requestBody: { name: newFileName },
      });
      console.log("Archivo renombrado:", newFileName);
    } else {
      // Si no se encuentra el archivo, puedes decidir si lanzar error o solo actualizar la BD
      console.warn("No se encontró un archivo único para renombrar en Drive.");
    }

    // 9. Ahora sí, actualiza el título en la BD
    await query(
      "UPDATE meetings SET title = ? WHERE id = ?",
      [newTitle, meetingId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/meetings/[id]:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
