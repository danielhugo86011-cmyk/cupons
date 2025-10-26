"use client"

import { useEffect, useState, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Mensagem {
  id: number
  remetente: "usuario" | "admin"
  mensagem: string
  data: string
  lida: boolean
}

export default function Chat() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [mensagem, setMensagem] = useState("")
  const [chatAberto, setChatAberto] = useState(false)
  const [temNovaMsg, setTemNovaMsg] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [papel, setPapel] = useState<"usuario" | "admin">("usuario")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Inicializar Socket.IO e buscar mensagens
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    })

    setSocket(socketInstance)

    // Buscar usuário atual para determinar o papel
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setPapel(data.user.role === "admin" ? "admin" : "usuario")
        }
      })
      .catch(console.error)

    // Buscar mensagens existentes
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => {
        if (data.mensagens) {
          setMensagens(data.mensagens)
        }
      })
      .catch(console.error)

    // Escutar novas mensagens
    socketInstance.on("nova_mensagem", (msg: Mensagem) => {
      setMensagens((prev) => [...prev, msg])

      // Mostrar notificação se chat está fechado e mensagem é de outro remetente
      if (!chatAberto && msg.remetente !== papel) {
        setTemNovaMsg(true)
      }
    })

    socketInstance.on("connect", () => {
      console.log("✅ Socket.IO conectado")
      socketInstance.emit("join_chat")
    })

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Erro de conexão Socket.IO:", error)
    })

    return () => {
      socketInstance.emit("leave_chat")
      socketInstance.disconnect()
    }
  }, [chatAberto, papel])

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [mensagens])

  const enviarMensagem = async () => {
    if (!mensagem.trim() || carregando) return

    setCarregando(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: mensagem.trim() }),
      })

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem")
      }

      setMensagem("")
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error)
      alert("Erro ao enviar mensagem. Tente novamente.")
    } finally {
      setCarregando(false)
    }
  }

  const toggleChat = () => {
    setChatAberto(!chatAberto)
    setTemNovaMsg(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviarMensagem()
    }
  }

  const formatarHora = (data: string) => {
    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <>
      {/* Botão flutuante */}
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        {temNovaMsg && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </Button>

      {/* Janela do chat */}
      {chatAberto && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] bg-background border rounded-xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Suporte ao Vivo</h3>
            </div>
            <Button
              onClick={toggleChat}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Mensagens */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {mensagens.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-xs">Envie uma mensagem para começar</p>
                </div>
              ) : (
                mensagens.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.remetente === papel ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        msg.remetente === papel
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-xs font-semibold mb-1 opacity-80">
                        {msg.remetente === "admin" ? "Suporte" : "Você"}
                      </p>
                      <p className="text-sm break-words">{msg.mensagem}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {formatarHora(msg.data)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input de mensagem */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={carregando}
                className="flex-1"
              />
              <Button
                onClick={enviarMensagem}
                disabled={!mensagem.trim() || carregando}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Respondemos em instantes
            </p>
          </div>
        </div>
      )}
    </>
  )
}
