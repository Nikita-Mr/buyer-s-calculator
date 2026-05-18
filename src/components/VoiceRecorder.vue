<script setup>
import { ref } from 'vue';
import { VoiceRecorder } from '@capacitor/voice-recorder';

const isListening = ref(false);
const transcript = ref('');

const startRecording = async () => {
  try {
    await VoiceRecorder.startRecording();
    isListening.value = true;
  } catch (error) {
    console.error('Ошибка при начале записи:', error);
  }
};

const stopRecording = async () => {
  try {
    const result = await VoiceRecorder.stopRecording();
    isListening.value = false;
    // Получаем аудиофайл, отправляем на сервер для распознавания
    // Или используем Web Speech API для распознавания
    console.log('Запись завершена', result);
  } catch (error) {
    console.error('Ошибка при остановке записи:', error);
  }
};

// Для веб-версии используем Web Speech API
const startWebSpeech = () => {
  if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      isListening.value = true;
    };
    
    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      transcript.value = result;
      isListening.value = false;
      // Обработать результат
      console.log('Распознано:', result);
    };
    
    recognition.onerror = (event) => {
      console.error('Ошибка распознавания:', event);
      isListening.value = false;
    };
    
    recognition.start();
  }
};
</script>

<template>
  <div class="voice-recorder">
    <button 
      @click="isListening ? stopRecording() : startWebSpeech()"
      :class="{ listening: isListening }"
    >
      <span v-if="isListening">🔴 Запись...</span>
      <span v-else>🎤 Голосовой ввод</span>
    </button>
    <div v-if="transcript" class="transcript">
      {{ transcript }}
    </div>
  </div>
</template>

<style scoped>
.voice-recorder {
  padding: 10px;
}
button {
  background: var(--color2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
}
button.listening {
  background: red;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
.transcript {
  margin-top: 10px;
  padding: 10px;
  background: var(--color3);
  border-radius: 8px;
}
</style>