
import React, { useState, useEffect } from 'react'
import './App.css'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [newCategory, setNewCategory] = useState('Personal')
  const [newReminder, setNewReminder] = useState('')
  const [newReminderType, setNewReminderType] = useState('once')
  const [editingTask, setEditingTask] = useState(null)
  const [filter, setFilter] = useState('All')

  const categories = ['Personal', 'Work', 'Health', 'Shopping', 'Other']

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
            // For daily reminders, check if it's time and hasn't been shown today
            const lastShownDate = task.lastReminderShown ? new Date(task.lastReminderShown).toDateString() : null
            
            if (currentTime >= reminderMinutes && lastShownDate !== currentDateString) {
              alert(`Daily Reminder: ${task.text}`)
              setTasks(prev => prev.map(t => 
                t.id === task.id ? { ...t, lastReminderShown: now.toISOString() } : t
              ))
            }
          } else {
            // For one-time reminders
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

    const interval = setInterval(checkReminders, 60000) // Check every minute
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

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All') return true
    if (filter === 'Completed') return task.completed
    if (filter === 'Pending') return !task.completed
    return task.category === filter
  })

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return ''
    const date = new Date(dateTimeString)
    return date.toLocaleString()
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">✨ My To-Do List ✨</h1>
        
        {/* Add Task Form */}
        <div className="add-task-form">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
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
            title="Set reminder"
          />
          
          <select
            value={newReminderType}
            onChange={(e) => setNewReminderType(e.target.value)}
            className="reminder-type-select"
            title="Reminder frequency"
          >
            <option value="once">Once</option>
            <option value="daily">Daily</option>
          </select>
          
          <button onClick={addTask} className="add-btn">Add Task</button>
        </div>

        {/* Filter Buttons */}
        <div className="filters">
          {['All', 'Pending', 'Completed', ...categories].map(filterOption => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`filter-btn ${filter === filterOption ? 'active' : ''}`}
            >
              {filterOption}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="task-list">
          {filteredTasks.map(task => (
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
                  <select
                    value={editingTask.reminderType || 'once'}
                    onChange={(e) => setEditingTask({...editingTask, reminderType: e.target.value})}
                    className="edit-reminder-type"
                  >
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                  </select>
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
                      <span className={`category-tag ${task.category.toLowerCase()}`}>
                        {task.category}
                      </span>
                      {task.reminder && (
                        <span className="reminder-info">
                          🔔 {formatDateTime(task.reminder)} 
                          {task.reminderType === 'daily' && <span className="daily-badge">Daily</span>}
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
          ))}
          
          {filteredTasks.length === 0 && (
            <div className="empty-state">
              <p>No tasks found. Add some tasks to get started! 🎯</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
