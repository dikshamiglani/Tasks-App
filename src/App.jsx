
import React, { useState, useEffect } from 'react'
import './App.css'
import AuthModal from './AuthModal'
import authService from './authService'
import notificationService from './notificationService'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [newReminder, setNewReminder] = useState('')
  const [newReminderType, setNewReminderType] = useState('once')
  const [editingTask, setEditingTask] = useState(null)
  const [activeTab, setActiveTab] = useState('schedule')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [isTasksPanelOpen, setIsTasksPanelOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  // Check authentication status on component mount
  useEffect(() => {
    const user = authService.getCurrentUser()
    setCurrentUser(user)
    
    if (user) {
      // Load user-specific tasks
      const userTasks = localStorage.getItem(`todoTasks_${user.id}`)
      if (userTasks) {
        setTasks(JSON.parse(userTasks))
      }
    }
  }, [])

  // Save tasks to user-specific localStorage whenever tasks change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`todoTasks_${currentUser.id}`, JSON.stringify(tasks))
    }
  }, [tasks, currentUser])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileDropdown])

  // Enhanced reminder checking with notifications
  useEffect(() => {
    if (!currentUser) return

    const checkReminders = () => {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const currentDateString = now.toDateString()

      tasks.forEach(task => {
        if (task.reminder) {
          const reminderTime = new Date(task.reminder)
          const reminderMinutes = reminderTime.getHours() * 60 + reminderTime.getMinutes()

          if (task.reminderType === 'daily') {
            const lastShownDate = task.lastReminderShown ? new Date(task.lastReminderShown).toDateString() : null

            if (currentTime >= reminderMinutes && lastShownDate !== currentDateString) {
              notificationService.showTaskReminder(task.text)
              setTasks(prev => prev.map(t => 
                t.id === task.id ? { ...t, lastReminderShown: now.toISOString() } : t
              ))
            }
          } else {
            if (now >= reminderTime && !task.reminderShown) {
              notificationService.showTaskReminder(task.text)
              setTasks(prev => prev.map(t => 
                t.id === task.id ? { ...t, reminderShown: true } : t
              ))
            }
          }
        }
      })
    }

    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [tasks, currentUser])

  const handleAuthSuccess = (user) => {
    setCurrentUser(user)
    // Load user-specific tasks
    const userTasks = localStorage.getItem(`todoTasks_${user.id}`)
    if (userTasks) {
      setTasks(JSON.parse(userTasks))
    } else {
      setTasks([])
    }
  }

  const handleLogout = () => {
    authService.logout()
    setCurrentUser(null)
    setTasks([])
  }

  const addTask = () => {
    if (newTask.trim()) {
      // Simple category assignment based on keywords
      let category = 'Personal'
      const taskLower = newTask.toLowerCase()
      if (taskLower.includes('work') || taskLower.includes('meeting') || taskLower.includes('office') || taskLower.includes('project')) {
        category = 'Work'
      } else if (taskLower.includes('exercise') || taskLower.includes('doctor') || taskLower.includes('health') || taskLower.includes('gym')) {
        category = 'Health'
      }

      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        reminder: newReminder || null,
        reminderType: newReminderType,
        reminderShown: false,
        lastReminderShown: null,
        createdAt: new Date().toISOString(),
        category: category,
        userId: currentUser.id
      }
      setTasks([...tasks, task])
      setNewTask('')
      setNewReminder('')
      setNewReminderType('once')
      setIsAddTaskModalOpen(false)
    }
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const startEditing = (task) => {
    setEditingTask({ ...task })
  }

  const saveEdit = () => {
    setTasks(tasks.map(task =>
      task.id === editingTask.id ? editingTask : task
    ))
    setEditingTask(null)
  }

  const cancelEdit = () => {
    setEditingTask(null)
  }

  const getTasksForDate = (date) => {
    return tasks.filter(task => {
      if (!task.reminder) return false
      const taskDate = new Date(task.reminder).toDateString()
      const selectedDateObj = new Date(date).toDateString()
      return taskDate === selectedDateObj
    })
  }

  const formatTime = (dateTimeString) => {
    if (!dateTimeString) return ''
    const date = new Date(dateTimeString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return ''
    const date = new Date(dateTimeString)
    return date.toLocaleString()
  }

  // Show auth modal if not authenticated
  if (!currentUser) {
    return (
      <div className="app">
        <div className="auth-landing">
          <div className="auth-landing-content">
            <h1 className="title">✨ My To-Do List ✨</h1>
            <p className="subtitle">Organize your tasks with smart reminders</p>
            <button 
              className="auth-landing-btn" 
              onClick={() => setIsAuthModalOpen(true)}
            >
              Get Started
            </button>
          </div>
        </div>
        
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="title">✨ My To-Do List ✨</h1>
        <div className="header-actions">
          <span className="user-greeting">Hello, {currentUser.name}!</span>
          <button 
            className="add-task-btn" 
            onClick={() => setIsAddTaskModalOpen(true)}
          >
            + Add New Task
          </button>
          <div className="profile-dropdown">
            <button 
              className="profile-icon"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              👤
            </button>
            {showProfileDropdown && (
              <div className="dropdown-menu">
                <button 
                  className="dropdown-item"
                  onClick={() => {
                    setShowProfileDropdown(false)
                    handleLogout()
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Main Schedule Interface */}
        <div className="schedule-panel">
          <div className="panel-header">
            <div className="tab-container">
              <button 
                className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
                onClick={() => setActiveTab('schedule')}
              >
                📅 Today's Schedule
              </button>
              <button 
                className={`tab ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => setActiveTab('calendar')}
              >
                🗓️ Calendar View
              </button>
            </div>
            <button 
              className="tasks-icon-btn"
              onClick={() => setIsTasksPanelOpen(true)}
              title="View All Tasks"
            >
              📋
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'schedule' && (
              <div className="schedule-view">
                <div className="date-selector">
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                  />
                </div>
                <div className="schedule-tasks">
                  {getTasksForDate(selectedDate).length === 0 ? (
                    <div className="no-tasks">
                      <p>No tasks scheduled for this date</p>
                      <p>Add a task with a reminder to see it here!</p>
                    </div>
                  ) : (
                    getTasksForDate(selectedDate)
                      .sort((a, b) => new Date(a.reminder) - new Date(b.reminder))
                      .map(task => (
                      <div key={task.id} className={`schedule-task ${task.completed ? 'completed' : ''}`}>
                        <div className="task-time">{formatTime(task.reminder)}</div>
                        <div className="task-info">
                          <span className="task-name">{task.text}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="task-checkbox"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="calendar-view">
                <div className="calendar-header">
                  <h3>Task Calendar</h3>
                </div>
                <div className="calendar-grid">
                  <div className="calendar-placeholder">
                    <p>Calendar view coming soon...</p>
                    <p>For now, use the date selector in Schedule tab</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tasks Panel */}
        {isTasksPanelOpen && (
          <div className="tasks-panel-overlay" onClick={() => setIsTasksPanelOpen(false)}>
            <div className="tasks-panel" onClick={(e) => e.stopPropagation()}>
              <div className="tasks-panel-header">
                <h3>All Tasks</h3>
                <button 
                  className="close-panel-btn"
                  onClick={() => setIsTasksPanelOpen(false)}
                >
                  ×
                </button>
              </div>
              <div className="tasks-panel-content">
                {tasks.length === 0 ? (
                  <div className="no-tasks-panel">
                    <p>No tasks created yet</p>
                    <p>Add your first task to get started!</p>
                  </div>
                ) : (
                  <div className="tasks-list">
                    {['Personal', 'Work', 'Health'].map(category => {
                      const categoryTasks = tasks.filter(task => task.category === category)
                      if (categoryTasks.length === 0) return null
                      
                      return (
                        <div key={category} className="category-section">
                          <h4 className={`category-header ${category.toLowerCase()}`}>{category}</h4>
                          {categoryTasks.map(task => (
                            <div key={task.id} className={`panel-task ${task.completed ? 'completed' : ''}`}>
                              <div className="panel-task-info">
                                <span className="panel-task-text">{task.text}</span>
                                {task.reminder && (
                                  <span className="panel-task-reminder">
                                    📅 {formatDateTime(task.reminder)}
                                  </span>
                                )}
                              </div>
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTask(task.id)}
                                className="panel-task-checkbox"
                              />
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Add Task Modal */}
      {isAddTaskModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddTaskModalOpen(false)}>
          <div className="add-task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Task</h3>
              <button 
                className="close-btn"
                onClick={() => setIsAddTaskModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                placeholder="Enter task description..."
                className="task-input"
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
              />

              <input
                type="datetime-local"
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                className="reminder-input"
                placeholder="Set reminder"
              />

              <select
                value={newReminderType}
                onChange={(e) => setNewReminderType(e.target.value)}
                className="reminder-type-select"
              >
                <option value="once">Once</option>
                <option value="daily">Daily</option>
              </select>

              <div className="modal-actions">
                <button onClick={addTask} className="add-btn">Add Task</button>
                <button onClick={() => setIsAddTaskModalOpen(false)} className="cancel-btn">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}
