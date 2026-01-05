import { useState, useRef, useEffect } from 'react';
import { ChatMessage, Note } from '../types';
import * as GeminiService from '../services/geminiService';

export const useChat = (selectedNote: Note | null, updateNoteContent: (id: string, content: any) => void) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedNote) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');

    try {
      const apiHistory = chatHistory.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));

      const context = JSON.stringify(selectedNote.content);
      const response = await GeminiService.sendChatMessage(apiHistory, userMsg.text, context);
      
      if (response.updatedNote) {
        updateNoteContent(selectedNote.id, response.updatedNote);
      }

      if (response.text) {
        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: response.text };
        setChatHistory(prev => [...prev, aiMsg]);
      } else if (response.updatedNote) {
        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: "I've updated the note as requested." };
        setChatHistory(prev => [...prev, aiMsg]);
      }

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = { id: Date.now().toString(), role: 'model', text: "Sorry, I encountered an error processing that request." };
      setChatHistory(prev => [...prev, errorMsg]);
    }
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return {
      chatHistory,
      chatInput,
      setChatInput,
      handleSendMessage,
      chatScrollRef
  };
};