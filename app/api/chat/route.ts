import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

// GET - Buscar todas as mensagens do chat único
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const mensagens = await query(
      "SELECT id, remetente, mensagem, data, lida FROM mensagens_chat WHERE feedback_id = 1 ORDER BY data ASC"
    )

    return NextResponse.json({ mensagens }, { status: 200 })
  } catch (error: any) {
    console.error("❌ Erro ao buscar mensagens:", error)
    return NextResponse.json(
      { error: "Erro ao buscar mensagens", details: error.message },
      { status: 500 }
    )
  }
}

// POST - Enviar nova mensagem
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { mensagem } = body

    if (!mensagem || mensagem.trim() === "") {
      return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 })
    }

    const remetente = user.role === "admin" ? "admin" : "usuario"

    const result: any = await query(
      "INSERT INTO mensagens_chat (feedback_id, remetente, mensagem, data, lida) VALUES (1, ?, ?, NOW(), FALSE)",
      [remetente, mensagem.trim()]
    )

    const novaMensagem = await query(
      "SELECT id, remetente, mensagem, data, lida FROM mensagens_chat WHERE id = ?",
      [result.insertId]
    )

    // Emitir mensagem via Socket.IO se disponível
    if (global.io) {
      global.io.emit("nova_mensagem", novaMensagem[0])
      console.log(`📡 Nova mensagem emitida por ${remetente}`)
    }

    return NextResponse.json(
      { success: true, mensagem: novaMensagem[0] },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("❌ Erro ao enviar mensagem:", error)
    return NextResponse.json(
      { error: "Erro ao enviar mensagem", details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Marcar mensagens como lidas
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await req.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 })
    }

    const placeholders = ids.map(() => "?").join(",")
    await query(
      `UPDATE mensagens_chat SET lida = TRUE WHERE id IN (${placeholders})`,
      ids
    )

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error("❌ Erro ao marcar mensagens como lidas:", error)
    return NextResponse.json(
      { error: "Erro ao marcar mensagens como lidas", details: error.message },
      { status: 500 }
    )
  }
}
