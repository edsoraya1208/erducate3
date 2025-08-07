const RoleSelector = ({ selectedRole, onRoleChange }) => {
  const roles = [
    {
      id: 'student',
      name: 'Student',
      emoji: '🎓',
      description: 'Learn database design with AI feedback'
    },
    {
      id: 'lecturer', // Note: keeping 'lecturer' to match your image
      name: 'Lecturer',
      emoji: '👨‍🏫',
      description: 'Teach and monitor student progress'
    }
  ]

  return (
    <div className="role-selector">
      <label className="input-label">ROLE</label>
      
      <div className="role-options">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`role-option ${selectedRole === role.id ? 'selected' : ''}`}
            onClick={() => onRoleChange(role.id)}
          >
            <div className="role-icon">{role.emoji}</div>
            <div className="role-name">{role.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RoleSelector