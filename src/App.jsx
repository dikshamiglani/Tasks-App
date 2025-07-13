
import React, { useState, useEffect } from 'react'
import './App.css'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [newCategory, setNewCategory] = useState('Personal')
  const [newReminder, setNewReminder] = useState('')
  const [newReminderType, setNewReminderType] = useState('once')
  const [editingTask, setEditingTask] = useState(null)
  const [activeTab, setActiveTab] = useState('schedule')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('Personal')

  const categories = ['Personal', 'Work', 'Health', 'Other']

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('todoTasks')
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
  }, [])

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('todoTasks', JSON.stringify(tasks))
  }, [tasks])

  // Check for reminders
  useEffect(() => {
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
              alert(`Daily Reminder: ${task.text}`)
              setTasks(prev => prev.map(t => 
                t.id === task.id ? { ...t, lastReminderShown: now.toISOString() } : t
              ))
            }
          } else {
            if (now >= reminderTime && !task.reminderShown) {
              alert(`Reminder: ${task.text}`)
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
  }, [tasks])

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        category: newCategory,
        reminder: newReminder || null,
        reminderType: newReminderType,
        reminderShown: false,
        lastReminderShown: null,
        createdAt: new Date().toISOString()
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

  const getTasksByCategory = (category) => {
    return tasks.filter(task => task.category === category)
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

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="title">✨ My To-Do List ✨</h1>
        <button 
          className="add-task-btn" 
          onClick={() => setIsAddTaskModalOpen(true)}
        >
          + Add New Task
        </button>
      </div>

      <div className="main-content">
        {/* Main Schedule Interface */}
        <div className="schedule-panel">
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
                          <span className={`task-category ${task.category.toLowerCase()}`}>
                            {task.category}
                          </span>
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

        {/* Right Side - Category Buttons */}
        <div className="category-sidebar">
          <div className="category-buttons">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${category.toLowerCase()}`}
                onClick={() => {
                  setSelectedCategory(category)
                  setIsCategoryPanelOpen(true)
                }}
              >
                <span className="category-icon">
                  {category === 'Personal' && '👤'}
                  {category === 'Work' && '💼'}
                  {category === 'Health' && '💪'}
                  {category === 'Other' && '📋'}
                </span>
                <span className="category-name">{category}</span>
                <span className="task-count">{getTasksByCategory(category).length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Tasks Panel */}
        {isCategoryPanelOpen && (
          <div className="category-panel-overlay" onClick={() => setIsCategoryPanelOpen(false)}>
            <div className="category-panel" onClick={(e) => e.stopPropagation()}>
              <div className="panel-header">
                <h3>{selectedCategory} Tasks</h3>
                <button 
                  className="close-btn"
                  onClick={() => setIsCategoryPanelOpen(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="panel-content">
                <div className="task-list">
                  {getTasksByCategory(selectedCategory).length === 0 ? (
                    <div className="no-tasks">
                      <p>No {selectedCategory.toLowerCase()} tasks yet</p>
                    </div>
                  ) : (
                    getTasksByCategory(selectedCategory).map(task => (
                      <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                        {editingTask && editingTask.id === task.id ? (
                          <div className="edit-form">
                            <input
                              type="text"
                              value={editingTask.text}
                              onChange={(e) => setEditingTask({...editingTask, text: e.target.value})}
                              className="edit-input"
                            />
                            <select
                              value={editingTask.category}
                              onChange={(e) => setEditingTask({...editingTask, category: e.target.value})}
                              className="edit-category"
                            >
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <input
                              type="datetime-local"
                              value={editingTask.reminder || ''}
                              onChange={(e) => setEditingTask({...editingTask, reminder: e.target.value})}
                              className="edit-reminder"
                            />
                            <div className="edit-actions">
                              <button onClick={saveEdit} className="save-btn">Save</button>
                              <button onClick={cancelEdit} className="cancel-btn">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="task-content">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTask(task.id)}
                              className="task-checkbox"
                            />
                            <div className="task-details">
                              <span className="task-text">{task.text}</span>
                              <div className="task-meta">
                                {task.reminder && (
                                  <span className="reminder-info">
                                    🔔 {formatDateTime(task.reminder)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="task-actions">
                              <button onClick={() => startEditing(task)} className="edit-btn">Edit</button>
                              <button onClick={() => deleteTask(task.id)} className="delete-btn">Delete</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
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
              
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="category-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
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
    </div>
  )
}
