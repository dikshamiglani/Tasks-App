
// Simple client-side authentication service
// In a real app, this would be handled by a secure backend

class AuthService {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('users') || '[]')
    this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
  }

  register(email, password, name) {
    // Check if user already exists
    if (this.users.find(user => user.email === email)) {
      throw new Error('User already exists with this email')
    }

    // Simple password validation
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Create new user
    const newUser = {
      id: Date.now(),
      email,
      password, // In a real app, this would be hashed
      name,
      createdAt: new Date().toISOString()
    }

    this.users.push(newUser)
    localStorage.setItem('users', JSON.stringify(this.users))
    
    return { id: newUser.id, email: newUser.email, name: newUser.name }
  }

  login(email, password) {
    const user = this.users.find(u => u.email === email && u.password === password)
    if (!user) {
      throw new Error('Invalid email or password')
    }

    const userSession = { id: user.id, email: user.email, name: user.name }
    this.currentUser = userSession
    localStorage.setItem('currentUser', JSON.stringify(userSession))
    
    return userSession
  }

  logout() {
    this.currentUser = null
    localStorage.removeItem('currentUser')
  }

  getCurrentUser() {
    return this.currentUser
  }

  isAuthenticated() {
    return this.currentUser !== null
  }
}

export default new AuthService()
