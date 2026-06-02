"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useAuth } from "../auth/auth-context"

export interface ChatMessageItem {
  id: string
  text: string
  content?: string
  sender: "user" | "admin" | "bot" | "client"
  senderId?: string
  senderName?: string
  senderAvatar?: string
  clientId?: string
  clientName?: string
  targetId?: string
  recipientId?: string
  timestamp: string | number | Date
  time?: string
  imageUrl?: string | null
  isRead?: boolean
  isReadByClient?: boolean
  read?: boolean
  isBot?: boolean
  followUps?: string[]
  escalated?: boolean
}

interface UserStatus {
  userId: string
  isOnline: boolean
  lastSeen?: string
}

interface TypingIndicator {
  userId: string
  isTyping: boolean
}

interface ChatContextValue {
  messages: ChatMessageItem[]
  typingIndicators: TypingIndicator[]
  userStatuses: Record<string, UserStatus>
  isConnected: boolean
  isOpen: boolean
  currentClientId: string | null
  isChatLoaded: boolean
  newMessageNotifications: string[]
  sendMessage: (
    text: string,
    senderRole: "admin" | "client" | "user" | "bot",
    clientId?: string,
    clientName?: string,
    isBot?: boolean,
    imageUrl?: string
  ) => void
  markAsRead: (clientId: string) => void
  markAsReadByClient: (clientId: string) => void
  markAdminAsRead: () => void
  toggleChat: () => void
  startTyping: (userId: string) => void
  stopTyping: (userId: string) => void
  getChatHistory: () => ChatMessageItem[]
  getUnreadCount: () => number
  clearNotifications: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [isChatLoaded, setIsChatLoaded] = useState(false)
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([])
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatus>>({})
  const [isOpen, setIsOpen] = useState(false)
  const [newMessageNotifications, setNewMessageNotifications] = useState<string[]>([])

  const currentClientId = user?.id ?? null

  useEffect(() => {
    const savedMessages = localStorage.getItem("mock_chat_messages")
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages) as ChatMessageItem[])
      } catch {
        setMessages([])
      }
    }
    setIsChatLoaded(true)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mock_chat_messages" && e.newValue) {
        try {
          setMessages(JSON.parse(e.newValue) as ChatMessageItem[])
        } catch {
          setMessages([])
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const sendMessage: ChatContextValue["sendMessage"] = useCallback(
    (text, senderRole, clientId, clientName, isBot = false, imageUrl) => {
      if (!text.trim() && !imageUrl) return

      const normalizedRole: ChatMessageItem["sender"] =
        senderRole === "user" ? "user" : senderRole === "bot" ? "bot" : senderRole

      const resolvedClientId = clientId ?? user?.id ?? undefined
      const newMessage: ChatMessageItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        content: text,
        sender: normalizedRole,
        senderId: normalizedRole === "client" || normalizedRole === "user" ? resolvedClientId : "admin",
        senderName:
          normalizedRole === "client" || normalizedRole === "user"
            ? clientName || user?.name || "Guest"
            : "Admin",
        clientId: resolvedClientId,
        clientName: clientName,
        targetId:
          normalizedRole === "client" || normalizedRole === "user" ? "admin" : resolvedClientId,
        recipientId:
          normalizedRole === "client" || normalizedRole === "user" ? "admin" : resolvedClientId,
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        imageUrl: imageUrl || null,
        isRead: normalizedRole === "admin",
        isReadByClient: normalizedRole === "client" || normalizedRole === "user",
        read: false,
        isBot: isBot,
      }

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, newMessage]
        localStorage.setItem("mock_chat_messages", JSON.stringify(updatedMessages))
        if (normalizedRole === "user" || normalizedRole === "client") {
          setNewMessageNotifications((notif) => [...notif, newMessage.id])
        }
        return updatedMessages
      })
    },
    [user]
  )

  const markAsRead = useCallback((clientId: string) => {
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((m) =>
        m.clientId === clientId && m.sender === "client" ? { ...m, isRead: true } : m
      )
      localStorage.setItem("mock_chat_messages", JSON.stringify(updatedMessages))
      return updatedMessages
    })
  }, [])

  const markAsReadByClient = useCallback((clientId: string) => {
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map((m) =>
        m.clientId === clientId && m.sender === "admin" ? { ...m, isReadByClient: true } : m
      )
      localStorage.setItem("mock_chat_messages", JSON.stringify(updatedMessages))
      return updatedMessages
    })
  }, [])

  const markAdminAsRead = useCallback(() => {
    setNewMessageNotifications([])
  }, [])

  const toggleChat = useCallback(() => {
    setIsOpen((v) => !v)
  }, [])

  const startTyping = useCallback((userId: string) => {
    setTypingIndicators((prev) => {
      const next = prev.filter((t) => t.userId !== userId)
      return [...next, { userId, isTyping: true }]
    })
  }, [])

  const stopTyping = useCallback((userId: string) => {
    setTypingIndicators((prev) => prev.filter((t) => t.userId !== userId))
  }, [])

  const getChatHistory = useCallback(() => messages, [messages])

  const getUnreadCount = useCallback(
    () => messages.filter((m) => (m.sender === "user" || m.sender === "client") && !m.isRead).length,
    [messages]
  )

  const clearNotifications = useCallback(() => setNewMessageNotifications([]), [])

  const value = useMemo<ChatContextValue>(
    () => ({
      messages,
      typingIndicators,
      userStatuses,
      isConnected: true,
      isOpen,
      currentClientId,
      isChatLoaded,
      newMessageNotifications,
      sendMessage,
      markAsRead,
      markAsReadByClient,
      markAdminAsRead,
      toggleChat,
      startTyping,
      stopTyping,
      getChatHistory,
      getUnreadCount,
      clearNotifications,
    }),
    [
      messages,
      typingIndicators,
      userStatuses,
      isOpen,
      currentClientId,
      isChatLoaded,
      newMessageNotifications,
      sendMessage,
      markAsRead,
      markAsReadByClient,
      markAdminAsRead,
      toggleChat,
      startTyping,
      stopTyping,
      getChatHistory,
      getUnreadCount,
      clearNotifications,
    ]
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) throw new Error("useChat must be used within a ChatProvider")
  return context
}

