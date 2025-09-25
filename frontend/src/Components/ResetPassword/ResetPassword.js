import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResetPassword.css';
import { api } from '../../utils/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // UI state
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showRequirements, setShowRequirements] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    space: false
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Remove spaces from password fields
    const cleanValue = (name === 'currentPassword' || name === 'newPassword' || name === 'confirmPassword') 
      ? value.replace(/\s/g, '') 
      : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: cleanValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = useCallback((field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  }, []);

  // Validate password strength and requirements (without state updates)
  const validatePasswordLogic = useCallback((password) => {
    const newRequirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      space: !/\s/.test(password)
    };
    
    // Calculate strength (0-100)
    const strength = Object.values(newRequirements).filter(Boolean).length * 20;
    
    return {
      requirements: newRequirements,
      strength,
      isValid: Object.values(newRequirements).every(Boolean)
    };
  }, []);

  // Validate password match (without state updates)
  const validatePasswordMatchLogic = useCallback((newPassword, confirmPassword) => {
    if (confirmPassword && newPassword !== confirmPassword) {
      return false;
    }
    return true;
  }, []);

  // Check if form has basic required fields (always enable button)
  const isFormValid = useMemo(() => {
    const hasCurrentPassword = formData.currentPassword.length > 0;
    const hasNewPassword = formData.newPassword.length > 0;
    const hasConfirmPassword = formData.confirmPassword.length > 0;
    
    return hasCurrentPassword && hasNewPassword && hasConfirmPassword;
  }, [formData.currentPassword, formData.newPassword, formData.confirmPassword]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    // Validate password requirements
    const passwordValidation = validatePasswordLogic(formData.newPassword);
    if (!passwordValidation.isValid) {
      setErrors(prev => ({
        ...prev,
        newPassword: 'Password must meet all requirements'
      }));
      return;
    }
    
    // Validate password match
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the reset password API
      await api('/auth/reset-password', {
        method: 'POST',
        body: {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }
      });
      
      // Success - show message and redirect
      alert('Password has been reset successfully! You will need to login again with your new password.');
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Reset UI state
      setPasswordStrength(0);
      setShowRequirements(false);
      setRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        space: false
      });
      
      // Redirect to login
      navigate('/login');
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.message.includes('Invalid credentials') || error.message.includes('Current password')) {
        setErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
      } else {
        alert('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = useCallback(() => {
    navigate('/forgot-password');
  }, [navigate]);

  // Handle back to login
  const handleBackToLogin = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  // Prevent spaces in password fields
  const handleKeyPress = useCallback((e) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  }, []);

  // Handle paste events to remove spaces
  const handlePaste = useCallback((e) => {
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    if (pastedText.includes(' ')) {
      e.preventDefault();
      const textWithoutSpaces = pastedText.replace(/\s/g, '');
      document.execCommand('insertText', false, textWithoutSpaces);
    }
  }, []);

  // Update password validation on new password change
  useEffect(() => {
    if (formData.newPassword) {
      const validation = validatePasswordLogic(formData.newPassword);
      setRequirements(validation.requirements);
      setPasswordStrength(validation.strength);
    } else {
      setRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        space: false
      });
      setPasswordStrength(0);
    }
  }, [formData.newPassword, validatePasswordLogic]);

  // Update password match validation on confirm password change
  useEffect(() => {
    if (formData.confirmPassword) {
      const isMatch = validatePasswordMatchLogic(formData.newPassword, formData.confirmPassword);
      if (!isMatch) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          confirmPassword: ''
        }));
      }
    } else {
      setErrors(prev => ({
        ...prev,
        confirmPassword: ''
      }));
    }
  }, [formData.confirmPassword, formData.newPassword, validatePasswordMatchLogic]);

  return (
    <div className="reset-page">
      <div className="reset-container">
        <div className="reset-header">
          <h1>Smart Alert</h1>
          <p>Reset Your Password</p>
        </div>
        
        <form className="reset-form" onSubmit={handleSubmit}>
          <div className="school-icon">
            <i className="fas fa-lock"></i>
          </div>
          
          <div className="instruction">
            <p>Please enter your current password and set a new password</p>
            <p>Make sure your new password is strong and secure</p>
          </div>
          
          <div className="input-group">
            <input 
              type={showPasswords.current ? "text" : "password"} 
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder="Current Password" 
              required 
            />
            <label htmlFor="currentPassword">Current Password</label>
            <span 
              className="password-toggle" 
              onClick={() => togglePasswordVisibility('current')}
            >
              <i className={showPasswords.current ? "far fa-eye" : "far fa-eye-slash"}></i>
            </span>
            {errors.currentPassword && (
              <div className="error-message">{errors.currentPassword}</div>
            )}
          </div>
          
          <div className="input-group">
            <input 
              type={showPasswords.new ? "text" : "password"} 
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder="New Password" 
              required 
            />
            <label htmlFor="newPassword">New Password</label>
            <span 
              className="password-toggle" 
              onClick={() => togglePasswordVisibility('new')}
            >
              <i className={showPasswords.new ? "far fa-eye" : "far fa-eye-slash"}></i>
            </span>
            {errors.newPassword && (
              <div className="error-message">{errors.newPassword}</div>
            )}
            
            <div className="password-strength">
              <div 
                className="password-strength-fill" 
                style={{
                  width: `${passwordStrength}%`,
                  background: passwordStrength < 40 ? '#ff6e40' : 
                             passwordStrength < 80 ? '#ffb74d' : '#4caf50'
                }}
              ></div>
            </div>
            
            <div 
              className="requirements-toggle" 
              onClick={() => setShowRequirements(!showRequirements)}
            >
              <span>Password Requirements</span>
              <i className={`fas fa-chevron-down ${showRequirements ? 'expanded' : ''}`}></i>
            </div>
            
            <div className={`password-requirements ${showRequirements ? 'expanded' : ''}`}>
              <p>Your password must include:</p>
              <ul>
                <li className={requirements.length ? 'requirement-met' : 'requirement-not-met'}>
                  <i className="fas fa-circle"></i>At least 8 characters
                </li>
                <li className={requirements.uppercase ? 'requirement-met' : 'requirement-not-met'}>
                  <i className="fas fa-circle"></i>One uppercase letter
                </li>
                <li className={requirements.lowercase ? 'requirement-met' : 'requirement-not-met'}>
                  <i className="fas fa-circle"></i>One lowercase letter
                </li>
                <li className={requirements.number ? 'requirement-met' : 'requirement-not-met'}>
                  <i className="fas fa-circle"></i>One number
                </li>
                <li className={requirements.special ? 'requirement-met' : 'requirement-not-met'}>
                  <i className="fas fa-circle"></i>One special character
                </li>
                <li className={requirements.space ? 'requirement-met' : 'requirement-not-met'}>
                  <i className="fas fa-circle"></i>No spaces
                </li>
              </ul>
            </div>
          </div>
          
          <div className="input-group">
            <input 
              type={showPasswords.confirm ? "text" : "password"} 
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder="Confirm Password" 
              required 
            />
            <label htmlFor="confirmPassword">Confirm Password</label>
            <span 
              className="password-toggle" 
              onClick={() => togglePasswordVisibility('confirm')}
            >
              <i className={showPasswords.confirm ? "far fa-eye" : "far fa-eye-slash"}></i>
            </span>
            {errors.confirmPassword && (
              <div className="error-message">{errors.confirmPassword}</div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="reset-button" 
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> RESETTING
              </>
            ) : (
              'RESET PASSWORD'
            )}
          </button>
          
          <div className="forgot-password-link">
            <a href="#" onClick={handleForgotPassword}>Forgot your current password?</a>
          </div>
          
          <div className="back-to-login">
            <a href="#" onClick={handleBackToLogin}>← Back</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
