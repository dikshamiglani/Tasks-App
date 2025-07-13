
class NotificationService {
  constructor() {
    this.audioContext = null
    this.notificationPermission = 'default'
    this.init()
  }

  async init() {
    // Request notification permission
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission()
    }

    // Initialize audio context
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (e) {
      console.warn('Audio context not supported')
    }
  }

  // Create a pleasant notification sound
  playNotificationSound() {
    if (!this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Create a pleasant chord progression
      const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5
      
      frequencies.forEach((freq, index) => {
        const osc = this.audioContext.createOscillator()
        const gain = this.audioContext.createGain()
        
        osc.connect(gain)
        gain.connect(this.audioContext.destination)
        
        osc.frequency.setValueAtTime(freq, this.audioContext.currentTime)
        osc.type = 'sine'
        
        // Gentle attack and decay
        gain.gain.setValueAtTime(0, this.audioContext.currentTime)
        gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.5)
        
        osc.start(this.audioContext.currentTime + index * 0.2)
        osc.stop(this.audioContext.currentTime + 1.5 + index * 0.2)
      })
    } catch (e) {
      console.warn('Could not play notification sound:', e)
    }
  }

  showDesktopNotification(title, body, icon = '🔔') {
    if (this.notificationPermission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`,
        badge: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${icon}</text></svg>`,
        tag: 'task-reminder',
        requireInteraction: true
      })

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000)
      
      return notification
    }
  }

  showTaskReminder(taskText) {
    // Play sound
    this.playNotificationSound()
    
    // Show desktop notification
    this.showDesktopNotification(
      '📅 Task Reminder',
      taskText,
      '⏰'
    )
    
    // Also show browser alert as fallback
    alert(`🔔 Task Reminder: ${taskText}`)
  }
}

export default new NotificationService()
