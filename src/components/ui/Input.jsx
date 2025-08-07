const Input = ({ 
  label, 
  type = "text", 
  name, 
  value, 
  onChange, 
  required = false,
  placeholder = ""
}) => {
  return (
    <div className="input-group">
      {/* Label styling matches the design */}
      <label className="input-label" htmlFor={name}>
        {label}
      </label>
      
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  )
}

export default Input