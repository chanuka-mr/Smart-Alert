# WhatsApp Notification Setup Guide

## The Issue
The "Notify Parents" feature is failing because Twilio WhatsApp service is not configured.

## Solution Steps

### 1. Create .env file in BACKEND folder
Create a file named `.env` in the BACKEND folder with the following content:

```
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
DEFAULT_PHONE_COUNTRY_CODE=+94
```

### 2. Get Twilio Credentials
1. Go to https://console.twilio.com/
2. Sign up for a free account
3. Get your Account SID and Auth Token from the dashboard
4. Set up WhatsApp Sandbox:
   - Go to Messaging > Try it out > Send a WhatsApp message
   - Follow the instructions to set up WhatsApp sandbox
   - Use the sandbox number: `+14155238886`

### 3. Test Phone Number Format
Your phone number `+94706665715` should work. The system will:
- Keep it as `+94706665715` (already has country code)
- Send to `whatsapp:+94706665715`

### 4. Alternative: Disable WhatsApp Notifications
If you don't want to set up Twilio, you can modify the code to show a success message instead of actually sending WhatsApp.

## Quick Fix (Temporary)
Replace the sendWhatsApp function in AttendanceController.js with:

```javascript
const sendWhatsApp = async ({ to, body }) => {
  console.log(`Would send WhatsApp to ${to}: ${body}`);
  return { success: true }; // Simulate success
};
```

This will show success messages without actually sending WhatsApp.
