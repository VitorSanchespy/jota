import React from "react";
import { buttonStyles } from "../../utils/commonUtils";

const Button = ({ 
  variant = 'primary', 
  children, 
  onClick, 
  disabled = false,
  type = 'button',
  style = {},
  ...props 
}) => {
  const baseStyle = buttonStyles[variant] || buttonStyles.primary;
  
  const finalStyle = {
    ...baseStyle,
    ...style,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer'
  };

  const handleMouseEnter = (e) => {
    if (!disabled) {
      switch (variant) {
        case 'success':
          e.target.style.backgroundColor = '#218838';
          break;
        case 'danger':
          e.target.style.backgroundColor = '#c82333';
          break;
        case 'secondary':
          e.target.style.backgroundColor = '#545b62';
          break;
        default:
          e.target.style.backgroundColor = '#0056b3';
      }
      e.target.style.transform = 'translateY(-2px)';
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled) {
      e.target.style.backgroundColor = baseStyle.backgroundColor;
      e.target.style.transform = 'translateY(0)';
    }
  };

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={finalStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
