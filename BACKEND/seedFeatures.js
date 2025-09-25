const mongoose = require("mongoose");
const Feature = require("./Model/featureModel");

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 
  "mongodb+srv://Admin:n3AK0A9ujJWgb9dD@cluster0.rejzequ.mongodb.net/smart-alert-db";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Sample features (previously static data from Home component)
const defaultFeatures = [
  {
    title: "Attendance Monitoring",
    description: "Track student and staff attendance in real-time with automated reporting and alerts for absentees.",
    icon: "fas fa-clipboard-check"
  },
  {
    title: "Transportation Tracking",
    description: "Monitor school buses in real-time with GPS tracking and send arrival notifications to parents.",
    icon: "fas fa-bus"
  },
  {
    title: "Performance Monitoring",
    description: "Track academic progress with detailed analytics, grade books, and performance reports.",
    icon: "fas fa-chart-line"
  },
  {
    title: "Announcements",
    description: "Broadcast important updates, events, and emergency alerts to students, parents, and staff.",
    icon: "fas fa-bullhorn"
  },
  {
    title: "Parent Communication",
    description: "Facilitate seamless communication between teachers and parents with messaging and notifications.",
    icon: "fas fa-comments"
  }
];

async function seedFeatures() {
  try {
    // Clear existing features
    await Feature.deleteMany({});
    console.log("Cleared existing features");

    // Insert default features
    const features = await Feature.insertMany(defaultFeatures);
    console.log(`Seeded ${features.length} features successfully`);

    // List the seeded features
    features.forEach(feature => {
      console.log(`- ${feature.title}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding features:", error);
    process.exit(1);
  }
}

// Run the seeder
seedFeatures();

