import { useState } from 'react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import RoleSelector from '../ui/RoleSelector'

const SignupForm = () => {
  // Form state management
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student' // Default role
  })

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Handle role selection
  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role: role
    })
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // TODO: Replace with your Firebase authentication logic
    console.log('Signup attempt:', formData)
    
    // Example Firebase signup would look like:
    // createUserWithEmailAndPassword(auth, formData.email, formData.password)
    //   .then((userCredential) => {
    //     // Add user role to Firestore
    //     // setDoc(doc(db, 'users', userCredential.user.uid), {
    //     //   name: formData.name,
    //     //   email: formData.email,
    //     //   role: formData.role
    //     // })
    //   })
    //   .catch((error) => {
    //     // Handle errors
    //   })
  }

  // Handle Google sign-in
  const handleGoogleSignUp = () => {
    // TODO: Implement Google authentication
    console.log('Google sign-up clicked')
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <Input
        label="NAME"
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      
      <Input
        label="EMAIL"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <Input
        label="PASSWORD"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      
      <RoleSelector
        selectedRole={formData.role}
        onRoleChange={handleRoleChange}
      />
      
      <Button type="submit" variant="primary" fullWidth>
        Create Account
      </Button>
      
      <Button 
        type="button" 
        variant="google" 
        fullWidth
        onClick={handleGoogleSignUp}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" className="google-icon">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.53H1.83v2.07A8 8 0 0 0 8.98 17z"/>
          <path fill="#FBBC05" d="M4.5 10.49a4.8 4.8 0 0 1 0-3.07V5.35H1.83a8 8 0 0 0 0 7.28l2.67-2.14z"/>
          <path fill="#EA4335" d="M8.98 4.72c1.16 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.35L4.5 7.42a4.77 4.77 0 0 1 4.48-2.7z"/>
        </svg>
        Continue with Google
      </Button>
    </form>
  )
}

export default SignupForm