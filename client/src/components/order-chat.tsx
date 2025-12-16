"use client"

import { useState, useEffect, useRef } from "react"
import { ClipLoader } from "react-spinners"

// --- ĐỊNH NGHĨA TYPES ---
interface ChatMessageWithNames {
  chat_message_id: string
  order_id: string
  sender_id: string
  sender_name: string
  message_text: string
  sent_at: number
}

// Icon Send
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="m22 2-7 20-4-9-9-4 20-7z" />
    <path d="M22 2 11 13" />
  </svg>
)

// --- FETCH DATA FROM BACKEND ---
async function fetchInitialChatData(
  orderId: string,
  cur_id: string,
  cur_name: string,
  partner_name: string
) {
  try {
    const res = await fetch(`/api/chat/${orderId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) throw new Error("Lỗi khi gọi backend")
    const result = await res.json();

    const data: {
      chat_message_id: string;
      message_text: string;
      sent_at: number;
      sender_id: string;
    }[] = Array.isArray(result.data) ? result.data : [];

    const chatMessages: ChatMessageWithNames[] = data.map((msg) => ({
      chat_message_id: msg.chat_message_id,
      order_id: orderId,
      sender_id: msg.sender_id,
      sender_name: msg.sender_id === cur_id ? cur_name : partner_name,
      message_text: msg.message_text,
      sent_at: msg.sent_at,
    }))

    return {
      chatMessages
    }
  } catch (error) {
    console.error("Error fetchInitialChatData:", error)
    return {
      chatMessages: []
    }
  }
}

// --- COMPONENT ORDERCHAT ---
export function OrderChat({
  orderId,
  cur_id,
  partner_id,
  cur_name,
  partner_name,
}: {
  orderId: string
  cur_id: string
  partner_id: string
  cur_name: string
  partner_name: string
}) {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessageWithNames[]>([])
  const [newMessage, setNewMessage] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const initialLoadDoneRef = useRef(false)

  const [loadingSendMess, setLoadingSendMess] = useState(false)

  // Load initial messages
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const data = await fetchInitialChatData(orderId, cur_id, cur_name, partner_name)
        setMessages(data.chatMessages)
        initialLoadDoneRef.current = true
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [orderId, cur_id, partner_id, cur_name, partner_name])

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return

    const message: ChatMessageWithNames = {
      chat_message_id: "0",
      order_id: orderId,
      sender_id: cur_id,
      sender_name: cur_name,
      message_text: newMessage.trim(),
      sent_at: Date.now(),
    }
    
    try {
      setLoadingSendMess(false)
      const res = await fetch(`/api/chat/${orderId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (!res.ok) {
        return
      }

      const result = await res.json();
      setLoadingSendMess(true)

      if (!result.isSuccess) {
        alert(result.message)
        return
      }

      setMessages(prev => [...prev, message])
      setNewMessage("")

    } catch(e) {
      alert(String(e))
    }
   
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    if (initialLoadDoneRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [])


  useEffect(() => {
    if (initialLoadDoneRef.current && messagesContainerRef.current) {
      if (messages.length === 0) return
      const container = messagesContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [messages])


  return (
    <div className="rounded-xl border bg-white shadow-lg w-full mx-auto">
      <div className="flex flex-col space-y-1.5 p-6 border-b">
        <h2 className="text-xl font-semibold leading-none tracking-tight">
          Chat with {partner_name}
        </h2>
      </div>

      <div className="p-6">
        <div ref={messagesContainerRef} className="h-96 overflow-y-auto space-y-3 p-4 bg-gray-100 rounded-lg">
          {loading && <div className="w-full h-full flex flex-col justify-center items-center"> <ClipLoader size={50} color="#8D0000" loading={loading}/> </div>}
          {!messages && (
            <div className="text-center py-2 text-sm text-gray-500">--- Start the conversation ---</div>
          )}

          {messages.map(msg => {
            const isCurrentUser = msg.sender_id === cur_id
            return (
              <div key={msg.chat_message_id} className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                <div className={`mb-1 px-1 ${isCurrentUser ? "text-right" : "text-left"}`}>
                  <span className={`text-xs font-medium ${isCurrentUser ? "text-black-700" : "text-gray-600"}`}>
                    {msg.sender_name}
                  </span>
                </div>
                <div className={`max-w-[75%] rounded-lg px-4 py-2 text-sm ${isCurrentUser ? "bg-black text-white" : "bg-white border-gray text-black"}`}>
                  <p>{msg.message_text}</p>
                  <p className="text-xs opacity-80 mt-1">
                    {new Date(msg.sent_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 mt-4">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[#8D0000] focus:border-[#8D0000] outline-none"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading || loadingSendMess}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 w-10 bg-[#8D0000] text-white transition-colors hover:cursor-pointer"
            title="Send"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
