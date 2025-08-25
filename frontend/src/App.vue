<template>
  <div id="app">
    <div class="chat-container">
      <h1>Chat App</h1>
      
      <div v-if="!isConnected" class="username-section">
        <input 
          v-model="username" 
          placeholder="Enter your username"
          @keyup.enter="joinChat"
          class="username-input"
        />
        <button @click="joinChat" class="join-btn">Join Chat</button>
      </div>

      <div v-else class="chat-section">
        <div class="user-info">
          <span>Welcome, {{ username }}!</span>
          <button @click="leaveChat" class="leave-btn">Leave</button>
        </div>

        <div class="messages" ref="messagesContainer">
          <div 
            v-for="(msg, index) in messages" 
            :key="index" 
            class="message"
            :class="{ 'own-message': msg.username === username }"
          >
            <div class="message-header">
              <span class="username">{{ msg.username }}</span>
              <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
            </div>
            <div class="message-content">{{ msg.message }}</div>
          </div>
        </div>

        <div class="message-input-section">
          <input 
            v-model="newMessage" 
            placeholder="Type your message..."
            @keyup.enter="sendMessage"
            class="message-input"
          />
          <button @click="sendMessage" class="send-btn">Send</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { io, Socket } from 'socket.io-client'

interface ChatMessage {
  username: string
  message: string
  timestamp: Date
}

const socket: Socket = io('http://localhost:3000')
const username = ref('')
const newMessage = ref('')
const messages = ref<ChatMessage[]>([])
const isConnected = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const joinChat = () => {
  if (!username.value.trim()) return
  
  socket.emit('joinChat', { username: username.value })
  isConnected.value = true
}

const leaveChat = () => {
  socket.disconnect()
  isConnected.value = false
  messages.value = []
  socket.connect()
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  
  socket.emit('sendMessage', { message: newMessage.value })
  newMessage.value = ''
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const formatTime = (timestamp: Date) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

onMounted(() => {
  socket.on('newMessage', (message: ChatMessage) => {
    messages.value.push(message)
    scrollToBottom()
  })

  socket.on('userJoined', (data: { username: string }) => {
    messages.value.push({
      username: 'System',
      message: `${data.username} joined the chat`,
      timestamp: new Date()
    })
    scrollToBottom()
  })

  socket.on('userLeft', (data: { username: string }) => {
    messages.value.push({
      username: 'System',
      message: `${data.username} left the chat`,
      timestamp: new Date()
    })
    scrollToBottom()
  })
})
</script>

