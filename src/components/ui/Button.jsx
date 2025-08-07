const Button = ({ 
  children, 
  type = "button", 
  variant = "primary", 
  fullWidth = false, 
  onClick,
  disabled = false 
}) => {
  // Dynamic class names based on props
  const baseClass = "btn"
  const variantClass = `btn-${variant}`
  const widthClass = fullWidth ? "btn-full-width" : ""
  const disabledClass = disabled ? "btn-disabled" : ""
  
  const buttonClass = `${baseClass} ${variantClass} ${widthClass} ${disabledClass}`.trim()

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export default Button