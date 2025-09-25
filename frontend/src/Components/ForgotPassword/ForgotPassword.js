import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';
import { api } from '../../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    userIdentifier: ''
  });
  
  // UI state
  const [errors, setErrors] = useState({
    userIdentifier: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const identifier = formData.userIdentifier.trim();
    
    // Clear previous errors
    setErrors({
      userIdentifier: ''
    });
    
    // Basic validation
    if (identifier === '') {
      setErrors(prev => ({
        ...prev,
        userIdentifier: 'Please enter your User ID or Email'
      }));
      return;
    }
    
    // Check if it looks like an email or user ID
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isUserID = /^[a-zA-Z0-9]{6,}$/.test(identifier);
    
    if (!isEmail && !isUserID) {
      setErrors(prev => ({
        ...prev,
        userIdentifier: 'Please enter a valid User ID or Email address'
      }));
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the forgot password API
      await api('/auth/forgot-password', {
        method: 'POST',
        body: {
          userIdentifier: identifier
        }
      });
      
      // Success - show success message
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.message.includes('User not found') || error.message.includes('Invalid')) {
        setErrors(prev => ({
          ...prev,
          userIdentifier: 'User ID or Email not found in our system'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          userIdentifier: 'Failed to send reset link. Please try again.'
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back to login
  const handleBackToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <div className="forgot-page">
      <div className="forgot-container">
        <div className="forgot-header">
          <h1>Smart Alert</h1>
          <p>Password Recovery</p>
        </div>
        
        <form className="forgot-form" onSubmit={handleSubmit}>
          <div className="school-icon">
            <i className="fas fa-key"></i>
          </div>
          
          <div className="instruction">
            <p>Enter your User ID or Email address associated with your account</p>
            <p>We'll send you a link to reset your password</p>
          </div>
          
          <div className="input-group">
            <input 
              type="text" 
              name="userIdentifier"
              value={formData.userIdentifier}
              onChange={handleInputChange}
              placeholder="User ID or Email" 
              required 
            />
            <label htmlFor="userIdentifier">User ID or Email</label>
            {errors.userIdentifier && (
              <div className="error-message">{errors.userIdentifier}</div>
            )}
          </div>
          
          {!showSuccess ? (
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isLoading || formData.userIdentifier.trim() === ''}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> SENDING
                </>
              ) : (
                'SEND RESET LINK'
              )}
            </button>
          ) : (
            <div className="success-message">
              <i className="fas fa-check-circle"></i>
              <h3>Reset Link Sent!</h3>
              <p>We've sent a password reset link to your email address. Please check your inbox and follow the instructions to reset your password.</p>
            </div>
          )}
          
          <div className="back-to-login">
            <a href="#" onClick={handleBackToLogin}>← Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

