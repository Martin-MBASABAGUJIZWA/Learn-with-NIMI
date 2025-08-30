import { useState, useCallback } from "react";
import { UserMessage } from "@/components/community/types";

export const useNimiChat = (currentUser: { id: string; name: string }) => {
  const [messages, setMessages] = useState<UserMessage[]>([
    { sender: 'nimi', text: "Hello friend! I'm Nimi!\n\nWhat's on your mind today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (message: string) => {
    setIsTyping(true);
    setMessages(prev => [...prev, { sender: 'user', text: message }]);
    
    try {
      // Add a temporary typing indicator
      setMessages(prev => [...prev, { sender: 'nimi', text: '...' }]);
      
      const response = await fetch('/api/nimi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: message }],
          childName: currentUser.name,
          language: "en"
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiMessage = '';
      
      if (reader) {
        // Remove the typing indicator
        setMessages(prev => prev.slice(0, -1));
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const data = JSON.parse(line.substring(5));
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.content) {
                  aiMessage += data.content;
                  // Update the last message with new content
                  setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.sender === 'nimi') {
                      return [...prev.slice(0, -1), { sender: 'nimi', text: aiMessage }];
                    }
                    return [...prev, { sender: 'nimi', text: aiMessage }];
                  });
                }
              } catch (err) {
                console.error("Error parsing chunk:", err);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      // Remove typing indicator and show error message
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.text === '...') {
          return [...prev.slice(0, -1), { 
            sender: 'nimi', 
            text: "Sorry, I'm having trouble thinking right now. Could you try again?" 
          }];
        }
        return [...prev, { 
          sender: 'nimi', 
          text: "Sorry, I'm having trouble thinking right now. Could you try again?" 
        }];
      });
    } finally {
      setIsTyping(false);
    }
  }, [currentUser.name]);

  return { messages, isTyping, sendMessage };
};