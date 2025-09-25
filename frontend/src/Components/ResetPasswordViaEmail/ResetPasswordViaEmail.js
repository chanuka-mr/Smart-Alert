import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ResetPasswordViaEmail.css';
import { api } from '../../utils/api';

const ResetPasswordViaEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Form state
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  // UI state
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  
  const [errors, setErrors] = useState({
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
  
  const [tokenValid, setTokenValid] = useState(null); // null = checking, true = valid, false = invalid
  const [token, setToken] = useState('');

  // Get token from URL
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      setTokenValid(true); // Assume valid for now, will be validated on submit
    } else {
      setTokenValid(false);
    }
  }, [searchParams]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Remove spaces from password fields
    const cleanValue = (name === 'newPassword' || name === 'confirmPassword') 
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

  // Check if form has basic required fields
  const isFormValid = useMemo(() => {
    const hasNewPassword = formData.newPassword.length > 0;
    const hasConfirmPassword = formData.confirmPassword.length > 0;
    
    return hasNewPassword && hasConfirmPassword;
  }, [formData.newPassword, formData.confirmPassword]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      alert('Invalid reset link. Please request a new password reset.');
      navigate('/forgot-password');
      return;
    }
    
    // Clear previous errors
    setErrors({
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
      // Call the reset password via email API
      await api('/auth/reset-password-via-email', {
        method: 'POST',
        body: {
          token: token,
          newPassword: formData.newPassword
        }
      });
      
      // Success - show message and redirect
      alert('Password has been reset successfully! You can now login with your new password.');
      navigate('/login');
      
    } catch (error) {
      console.error('Password reset error:', error);
      
      if (error.message.includes('Invalid token') || error.message.includes('expired')) {
        alert('This reset link is invalid or has expired. Please request a new password reset.');
        navigate('/forgot-password');
      } else {
        alert('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to login
  const handleBackToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

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

  // Show loading while checking token
  if (tokenValid === null) {
    return (
      <div className="reset-page">
        <div className="reset-container">
          <div className="reset-header">
            <h1>Smart Alert</h1>
            <p>Verifying Reset Link</p>
          </div>
          <div className="reset-form">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '40px', color: '#00bfa5', marginBottom: '20px' }}></i>
              <p>Please wait while we verify your reset link...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no token
  if (tokenValid === false) {
    return (
      <div className="reset-page">
        <div className="reset-container">
          <div className="reset-header">
            <h1>Smart Alert</h1>
            <p>Invalid Reset Link</p>
          </div>
          <div className="reset-form">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '40px', color: '#ff6e40', marginBottom: '20px' }}></i>
              <h3 style={{ color: '#ff6e40', marginBottom: '15px' }}>Invalid Reset Link</h3>
              <p style={{ marginBottom: '20px' }}>This password reset link is invalid or has expired.</p>
              <button 
                onClick={() => navigate('/forgot-password')}
                style={{
                  background: 'linear-gradient(to right, #00897b 0%, #00bfa5 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Request New Reset Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <p>Please enter your new password</p>
            <p>Make sure your new password is strong and secure</p>
          </div>
          
          <div className="input-group">
            <input 
              type={showPasswords.new ? "text" : "password"} 
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === ' ' && e.preventDefault()}
              onPaste={(e) => {
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                if (pastedText.includes(' ')) {
                  e.preventDefault();
                  const textWithoutSpaces = pastedText.replace(/\s/g, '');
                  document.execCommand('insertText', false, textWithoutSpaces);
                }
              }}
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
              onKeyPress={(e) => e.key === ' ' && e.preventDefault()}
              onPaste={(e) => {
                const pastedText = (e.clipboardData || window.clipboardData).getData('text');
                if (pastedText.includes(' ')) {
                  e.preventDefault();
                  const textWithoutSpaces = pastedText.replace(/\s/g, '');
                  document.execCommand('insertText', false, textWithoutSpaces);
                }
              }}
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
          
          <div className="back-to-login">
            <a href="#" onClick={handleBackToLogin}>← Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordViaEmail;
