import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { shuttleAPI } from '../services/api';
import './RealTimeTracking.css';

const RealTimeTracking = () => {
  const [map, setMap] = useState(null);
  const [shuttles, setShuttles] = useState([]);
  const [selectedShuttle, setSelectedShuttle] = useState(null);
  const [shuttleLocations, setShuttleLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [socket, setSocket] = useState(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);

  // Google Maps API key
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyDzX3gTBkOMsHOYaLf_z1ABfBFoJBF_k4g';
  
  console.log('Environment variable:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY);
  console.log('Final API key:', GOOGLE_MAPS_API_KEY);

  // Add error boundary for the component
  const [componentError, setComponentError] = useState(null);

  useEffect(() => {
    try {
      initializeMap();
      loadShuttles();
      initializeSocket();
    } catch (err) {
      console.error('Error in useEffect:', err);
      setComponentError(err.message);
    }

    return () => {
      try {
        if (socket) {
          socket.disconnect();
        }
      } catch (err) {
        console.error('Error cleaning up socket:', err);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (componentError) {
    return (
      <div className="error-container">
        <h2>Something went wrong with Live Tracking</h2>
        <p>Error: {componentError}</p>
        <button onClick={() => setComponentError(null)}>Try Again</button>
      </div>
    );
  }

  const initializeMap = async () => {
    try {
      console.log('initializeMap called');
      console.log('Google Maps API Key:', GOOGLE_MAPS_API_KEY);
      console.log('window.google exists:', !!window.google);
      console.log('window.google.maps exists:', !!(window.google && window.google.maps));
      
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded, creating map...');
        createMap();
        return;
      }
      
      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        console.log('Google Maps script already loading, waiting...');
        // Wait for existing script to load
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps) {
            console.log('Google Maps loaded from existing script');
            clearInterval(checkGoogle);
            createMap();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkGoogle);
          if (!window.google || !window.google.maps) {
            console.error('Google Maps failed to load from existing script');
            setError('Google Maps failed to load. Please check your API key.');
            setLoading(false);
          }
        }, 10000);
        return;
      }
      
      console.log('Loading Google Maps script...');
      // Load Google Maps API
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        createMap();
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        setError('Failed to load Google Maps. Please check your API key and ensure it has Maps JavaScript API enabled.');
        setLoading(false);
      };
      
      document.head.appendChild(script);
      
    } catch (err) {
      console.error('Error loading Google Maps:', err);
      setError(`Failed to load Google Maps. Error: ${err.message}`);
      setLoading(false);
    }
  };

  const createMap = () => {
    try {
      console.log('createMap called, mapRef.current:', mapRef.current);
      // Wait a bit for the DOM to be ready
      setTimeout(() => {
        console.log('After timeout, mapRef.current:', mapRef.current);
        if (!mapRef.current) {
          console.error('Map container not found, retrying...');
          // Try again after a short delay
          setTimeout(() => {
            console.log('Second retry, mapRef.current:', mapRef.current);
            if (!mapRef.current) {
              setError('Map container not found. Please refresh the page.');
              setLoading(false);
              return;
            }
            createMapInstance();
          }, 500);
          return;
        }
        createMapInstance();
      }, 100);
    } catch (err) {
      console.error('Error creating map:', err);
      setError(`Failed to create map: ${err.message}`);
      setLoading(false);
    }
  };

  const createMapInstance = () => {
    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 6.9271, lng: 79.8612 }, // Colombo, Sri Lanka
        zoom: 12,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      setMap(mapInstance);
      setLoading(false);
    } catch (err) {
      console.error('Error creating map instance:', err);
      setError(`Failed to create map: ${err.message}`);
      setLoading(false);
    }
  };

  const loadShuttles = async () => {
    try {
      const data = await shuttleAPI.getAllShuttles();
      setShuttles(data);
    } catch (err) {
      setError('Failed to load shuttles: ' + err.message);
    }
  };

  const initializeSocket = () => {
    const socketInstance = io('http://localhost:5001');
    
    socketInstance.on('locationUpdate', (data) => {
      updateShuttleLocation(data);
    });

    socketInstance.on('studentLocationUpdate', (data) => {
      // Handle student location updates if needed
      console.log('Student location update:', data);
    });

    setSocket(socketInstance);
  };

  const updateShuttleLocation = (data) => {
    const { shuttleId, location, shuttle } = data;
    
    setShuttleLocations(prev => ({
      ...prev,
      [shuttleId]: {
        ...location,
        shuttle: shuttle
      }
    }));

    if (map) {
      updateMapMarker(shuttleId, location, shuttle);
    }
  };

  const updateMapMarker = (shuttleId, location, shuttle) => {
    if (!window.google || !map) return;
    
    const position = { lat: location.latitude, lng: location.longitude };
    
    if (markersRef.current[shuttleId]) {
      // Update existing marker
      markersRef.current[shuttleId].setPosition(position);
    } else {
      // Create new marker
      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: `${shuttle.vehicleNo} - ${shuttle.driverName}`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/bus.png',
          scaledSize: new window.google.maps.Size(40, 40)
        }
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3>${shuttle.vehicleNo}</h3>
            <p><strong>Driver:</strong> ${shuttle.driverName}</p>
            <p><strong>Route:</strong> ${shuttle.route}</p>
            <p><strong>Contact:</strong> ${shuttle.contactNo}</p>
            <p><strong>Last Update:</strong> ${new Date(location.timestamp).toLocaleString()}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current[shuttleId] = marker;
    }
  };

  const handleShuttleSelect = (shuttleId) => {
    setSelectedShuttle(shuttleId);
    
    if (socket) {
      socket.emit('joinTracking', { shuttleId });
    }

    // Center map on selected shuttle if location is available
    const location = shuttleLocations[shuttleId];
    if (location && map) {
      map.setCenter({ lat: location.latitude, lng: location.longitude });
      map.setZoom(15);
    }
  };

  const simulateLocationUpdate = async (shuttleId) => {
    // This is for testing - in real implementation, this would come from GPS devices
    const lat = 6.9271 + (Math.random() - 0.5) * 0.01;
    const lng = 79.8612 + (Math.random() - 0.5) * 0.01;
    
    try {
      const response = await fetch(`http://localhost:5001/api/locations/shuttle/${shuttleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          address: 'Simulated Location',
          speed: Math.floor(Math.random() * 60) + 20,
          heading: Math.floor(Math.random() * 360)
        })
      });

      if (response.ok) {
        console.log('Location updated for shuttle:', shuttleId);
        setSuccess('Location updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error updating location:', err);
      setError('Failed to update location: ' + err.message);
    }
  };

  // Start sharing user's live location
  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsSharingLocation(true);
    setSuccess('Requesting location permission...');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => handleLocationSuccess(position),
      (error) => handleLocationError(error),
      options
    );

    setWatchId(watchId);
  };

  // Stop sharing user's live location
  const stopLocationSharing = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    setIsSharingLocation(false);
    setUserLocation(null);
    
    // Remove user marker from map
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    setSuccess('Location sharing stopped');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Handle successful location update
  const handleLocationSuccess = (position) => {
    const { latitude, longitude, speed, heading } = position.coords;
    
    const location = {
      latitude,
      longitude,
      speed: speed ? Math.round(speed * 3.6) : 0, // Convert m/s to km/h
      heading: heading || 0,
      timestamp: new Date()
    };

    setUserLocation(location);
    updateUserMarkerOnMap(location);
    
    if (isSharingLocation) {
      setSuccess('Live location updated!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  // Handle location error
  const handleLocationError = (error) => {
    let message = 'Unknown error occurred';
    
    switch(error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied by user';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out';
        break;
    }
    
    setError('Location Error: ' + message);
    setIsSharingLocation(false);
  };

  // Update user marker on map
  const updateUserMarkerOnMap = (location) => {
    if (!window.google || !map) return;
    
    const position = { lat: location.latitude, lng: location.longitude };
    
    if (userMarkerRef.current) {
      // Update existing marker
      userMarkerRef.current.setPosition(position);
    } else {
      // Create new marker for user
      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: 'Your Location',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(40, 40)
        },
        animation: window.google.maps.Animation.BOUNCE
      });

      // Add info window for user location
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div>
            <h3>📍 Your Location</h3>
            <p><strong>Latitude:</strong> ${location.latitude.toFixed(6)}</p>
            <p><strong>Longitude:</strong> ${location.longitude.toFixed(6)}</p>
            <p><strong>Speed:</strong> ${location.speed} km/h</p>
            <p><strong>Last Update:</strong> ${location.timestamp.toLocaleTimeString()}</p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      userMarkerRef.current = marker;
    }
  };

  // Center map on user location
  const centerOnUserLocation = () => {
    if (userLocation && map) {
      map.setCenter({ 
        lat: userLocation.latitude, 
        lng: userLocation.longitude 
      });
      map.setZoom(15);
    }
  };

  try {
    return (
      <div className="tracking-container">
        <div className="page-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Real-Time Shuttle Tracking</h1>
              <p>Monitor shuttle locations and routes in real-time with live updates</p>
            </div>
            <div className="header-actions">
              <div className="tracking-controls">
                <select 
                  value={selectedShuttle || ''} 
                  onChange={(e) => handleShuttleSelect(e.target.value)}
                  className="shuttle-selector"
                >
                  <option value="">Select a shuttle to track</option>
                  {shuttles.map(shuttle => (
                    <option key={shuttle._id} value={shuttle._id}>
                      {shuttle.vehicleNo} - {shuttle.driverName}
                    </option>
                  ))}
                </select>
                
                <div className="location-controls">
                  {!isSharingLocation ? (
                    <button 
                      onClick={startLocationSharing}
                      className="btn btn-success"
                    >
                      <span>📍</span>
                      Share My Location
                    </button>
                  ) : (
                    <button 
                      onClick={stopLocationSharing}
                      className="btn btn-danger"
                    >
                      <span>⏹️</span>
                      Stop Sharing
                    </button>
                  )}
                  
                  {userLocation && (
                    <button 
                      onClick={centerOnUserLocation}
                      className="btn btn-secondary"
                    >
                      <span>🎯</span>
                      Center on Me
                    </button>
                  )}
                  
                  {selectedShuttle && (
                    <button 
                      onClick={() => simulateLocationUpdate(selectedShuttle)}
                      className="btn btn-primary"
                    >
                      <span>🚌</span>
                      Test Shuttle Location
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading">Loading map...</div>
        )}

        {error && (
          <div className="alert alert-error fade-in">{error}</div>
        )}

        {success && (
          <div className="alert alert-success fade-in">{success}</div>
        )}

        <div className="map-container">
          <div ref={mapRef} className="map" />
        </div>

        <div className="tracking-info">
          <div className="info-sections">
            <div className="shuttle-section">
              <h3>Active Shuttles</h3>
              <div className="shuttle-list">
                {Object.entries(shuttleLocations).map(([shuttleId, data]) => (
                  <div key={shuttleId} className="shuttle-info">
                    <h4>{data.shuttle.vehicleNo}</h4>
                    <p><strong>Driver:</strong> {data.shuttle.driverName}</p>
                    <p><strong>Route:</strong> {data.shuttle.route}</p>
                    <p><strong>Last Update:</strong> {new Date(data.timestamp).toLocaleString()}</p>
                    <p><strong>Speed:</strong> {data.speed || 'N/A'} km/h</p>
                  </div>
                ))}
              </div>
            </div>

            {userLocation && (
              <div className="user-location-section">
                <h3>📍 Your Location</h3>
                <div className="user-location-info">
                  <p><strong>Latitude:</strong> {userLocation.latitude.toFixed(6)}</p>
                  <p><strong>Longitude:</strong> {userLocation.longitude.toFixed(6)}</p>
                  <p><strong>Speed:</strong> {userLocation.speed} km/h</p>
                  <p><strong>Last Update:</strong> {userLocation.timestamp.toLocaleTimeString()}</p>
                  <p><strong>Status:</strong> 
                    <span className={`status-indicator ${isSharingLocation ? 'sharing' : 'stopped'}`}>
                      {isSharingLocation ? '🟢 Live Sharing' : '🔴 Stopped'}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error('Error in render:', err);
    return (
      <div className="error-container">
        <h2>Something went wrong with Live Tracking</h2>
        <p>Error: {err.message}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
  }
};

export default RealTimeTracking;
