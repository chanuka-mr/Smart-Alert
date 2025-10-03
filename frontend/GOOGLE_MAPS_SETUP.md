# Google Maps API Setup Instructions

## 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Go to "Credentials" and create an API key
5. Restrict the API key to your domain for security

## 2. Configure Environment Variables

Create a `.env` file in the frontend directory with:

```
REACT_APP_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
REACT_APP_API_URL=http://localhost:5000
```

## 3. Features Included

- Real-time shuttle tracking on Google Maps
- Live location updates via WebSocket
- Shuttle selection and tracking
- Location history
- Speed and heading information
- Interactive map with markers

## 4. Backend Setup

The backend includes:
- Location tracking model
- Real-time WebSocket updates
- REST API endpoints for location data
- Socket.IO integration

## 5. Testing

1. Start the backend: `cd BACKEND && npm start`
2. Start the frontend: `cd frontend && npm start`
3. Go to the "Live Tracking" tab
4. Select a shuttle to track
5. Use "Simulate Location Update" to test real-time updates

## 6. Production Deployment

For production, make sure to:
- Set up proper API key restrictions
- Use HTTPS for WebSocket connections
- Configure CORS properly
- Set up proper error handling
