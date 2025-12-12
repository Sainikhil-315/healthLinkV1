const mongoose = require('mongoose');
const Hospital = require('../models/Hospital'); // Adjust path to your model
require('dotenv').config();


const hospitals = [
  {
    name: "Apollo Hospitals Delhi",
    registrationNumber: "APL-DLH-2024-001",
    email: "apollo.delhi@hospital.com",
    phone: "9876543211",
    emergencyPhone: "9876543211",
    password: "Hospital@123", // Will be hashed automatically
    location: {
      type: "Point",
      coordinates: [80.613539, 16.5236721], // Near test location
      address: "Test Area",
      city: "Test City",
      state: "Test State",
      pincode: "000000"
    },
    type: "Private",
    bedAvailability: {
      general: { total: 100, available: 85 },
      icu: { total: 30, available: 25 },
      emergency: { total: 20, available: 18 }
    },
    specialists: [
      {
        specialization: "Cardiologist",
        name: "Dr. Rajesh Kumar",
        isAvailable: true,
        phone: "9876543301"
      },
      {
        specialization: "Neurologist",
        name: "Dr. Priya Sharma",
        isAvailable: true,
        phone: "9876543302"
      }
    ],
    facilities: {
      oxygenAvailable: true,
      ventilators: 15,
      ambulanceService: true,
      bloodBank: true,
      pharmacy24x7: true,
      emergencyRoom: true,
      operationTheater: true
    },
    isVerified: true,
    isActive: true,
    acceptingEmergencies: true
  },
  {
    name: "AIIMS Mumbai",
    registrationNumber: "AIIMS-MUM-2024-002",
    email: "aiims.mumbai@hospital.com",
    phone: "9876543212",
    emergencyPhone: "9876543212",
    password: "Hospital@123",
    location: {
      type: "Point",
      coordinates: [80.613539, 16.5236721], // Near test location
      address: "Test Area",
      city: "Test City",
      state: "Test State",
      pincode: "000000"
    },
    type: "Government",
    bedAvailability: {
      general: { total: 200, available: 150 },
      icu: { total: 50, available: 40 },
      emergency: { total: 30, available: 25 }
    },
    specialists: [
      {
        specialization: "Emergency Medicine",
        name: "Dr. Amit Patel",
        isAvailable: true,
        phone: "9876543303"
      }
    ],
    facilities: {
      oxygenAvailable: true,
      ventilators: 25,
      ambulanceService: true,
      bloodBank: true,
      pharmacy24x7: true,
      emergencyRoom: true,
      operationTheater: true
    },
    isVerified: true,
    isActive: true,
    acceptingEmergencies: true
  },
  {
    name: "Fortis Hospital Bangalore",
    registrationNumber: "FRT-BLR-2024-003",
    email: "fortis.bangalore@hospital.com",
    phone: "9876543213",
    emergencyPhone: "9876543213",
    password: "Hospital@123",
    location: {
      type: "Point",
      coordinates: [80.613539, 16.5236721], // Near test location
      address: "Test Area",
      city: "Test City",
      state: "Test State",
      pincode: "000000"
    },
    type: "Private",
    bedAvailability: {
      general: { total: 80, available: 70 },
      icu: { total: 25, available: 20 },
      emergency: { total: 15, available: 12 }
    },
    specialists: [
      {
        specialization: "Orthopedic",
        name: "Dr. Suresh Reddy",
        isAvailable: true,
        phone: "9876543304"
      }
    ],
    facilities: {
      oxygenAvailable: true,
      ventilators: 12,
      ambulanceService: true,
      bloodBank: false,
      pharmacy24x7: true,
      emergencyRoom: true,
      operationTheater: true
    },
    isVerified: true,
    isActive: true,
    acceptingEmergencies: true
  },
  {
    name: "Max Super Speciality Hospital Hyderabad",
    registrationNumber: "MAX-HYD-2024-004",
    email: "max.hyderabad@hospital.com",
    phone: "9876543214",
    emergencyPhone: "9876543214",
    password: "Hospital@123",
    location: {
      type: "Point",
      coordinates: [80.613539, 16.5236721], // Near test location
      address: "Test Area",
      city: "Test City",
      state: "Test State",
      pincode: "000000"
    },
    type: "Private",
    bedAvailability: {
      general: { total: 90, available: 75 },
      icu: { total: 28, available: 22 },
      emergency: { total: 18, available: 15 }
    },
    specialists: [
      {
        specialization: "Pulmonologist",
        name: "Dr. Kavita Rao",
        isAvailable: true,
        phone: "9876543305"
      }
    ],
    facilities: {
      oxygenAvailable: true,
      ventilators: 18,
      ambulanceService: true,
      bloodBank: true,
      pharmacy24x7: true,
      emergencyRoom: true,
      operationTheater: true
    },
    isVerified: true,
    isActive: true,
    acceptingEmergencies: true
  },
  {
    name: "Medanta Hospital Kolkata",
    registrationNumber: "MED-KOL-2024-005",
    email: "medanta.kolkata@hospital.com",
    phone: "9876543215",
    emergencyPhone: "9876543215",
    password: "Hospital@123",
    location: {
      type: "Point",
      coordinates: [80.613539, 16.5236721], // Near test location
      address: "Test Area",
      city: "Test City",
      state: "Test State",
      pincode: "000000"
    },
    type: "Private",
    bedAvailability: {
      general: { total: 75, available: 60 },
      icu: { total: 22, available: 18 },
      emergency: { total: 12, available: 10 }
    },
    specialists: [
      {
        specialization: "Nephrologist",
        name: "Dr. Arun Ghosh",
        isAvailable: true,
        phone: "9876543306"
      }
    ],
    facilities: {
      oxygenAvailable: true,
      ventilators: 14,
      ambulanceService: true,
      bloodBank: true,
      pharmacy24x7: true,
      emergencyRoom: true,
      operationTheater: true
    },
    isVerified: true,
    isActive: true,
    acceptingEmergencies: true
  },
  {
    name: "Christian Medical College Vellore",
    registrationNumber: "CMC-VEL-2024-006",
    email: "cmc.vellore@hospital.com",
    phone: "9876543216",
    emergencyPhone: "9876543216",
    password: "Hospital@123",
    location: {
      type: "Point",
      coordinates: [80.613539, 16.5236721], // Near test location
      address: "Test Area",
      city: "Test City",
      state: "Test State",
      pincode: "000000"
    },
    type: "Charitable",
    bedAvailability: {
      general: { total: 120, available: 95 },
      icu: { total: 35, available: 28 },
      emergency: { total: 22, available: 18 }
    },
    specialists: [
      {
        specialization: "General Surgeon",
        name: "Dr. Thomas Jacob",
        isAvailable: true,
        phone: "9876543307"
      },
      {
        specialization: "Pediatrician",
        name: "Dr. Mary Joseph",
        isAvailable: true,
        phone: "9876543308"
      }
    ],
    facilities: {
      oxygenAvailable: true,
      ventilators: 20,
      ambulanceService: true,
      bloodBank: true,
      pharmacy24x7: true,
      emergencyRoom: true,
      operationTheater: true
    },
    isVerified: true,
    isActive: true,
    acceptingEmergencies: true
  },
  {
    name: "Manipal Hospital Jaipur",
    registrationNumber: "MNP-JPR-2024-007",
    email: "manipal.jaipur@hospital.com",
    phone: "9876543217",
    emergencyPhone: "9876543217",
    password: "Hospital@123",
    location: {
      type: "Point",
      coordinates: [80.613539, 16.5236721], // Near test location
      address: "Test Area",
      city: "Test City",
      state: "Test State",
      pincode: "000000"
    },
    type: "Private",
    bedAvailability: {
      general: { total: 70, available: 55 },
      icu: { total: 20, available: 16 },
      emergency: { total: 14, available: 11 }
    },
    specialists: [
      {
        specialization: "Traumatologist",
        name: "Dr. Vikram Singh",
        isAvailable: true,
        phone: "9876543309"
      }
    ],
    facilities: {
      oxygenAvailable: true,
      ventilators: 11,
      ambulanceService: true,
      bloodBank: false,
      pharmacy24x7: true,
      emergencyRoom: true,
      operationTheater: true
    },
    isVerified: true,
    isActive: true,
    acceptingEmergencies: true
  },
  {
    name: "Kokilaben Dhirubhai Ambani Hospital Pune",
    registrationNumber: "KDA-PUN-2024-008",
    email: "kokilaben.pune@hospital.com",
    phone: "9876543218",
    emergencyPhone: "9876543218",
    password: "Hospital@123",
    location: {
      type: "Point",
      coordinates: [80.613539, 16.5236721], // Near test location
      address: "Test Area",
      city: "Test City",
      state: "Test State",
      pincode: "000000"
    },
    type: "Private",
    bedAvailability: {
      general: { total: 85, available: 68 },
      icu: { total: 26, available: 21 },
      emergency: { total: 16, available: 13 }
    },
    specialists: [
      {
        specialization: "Cardiologist",
        name: "Dr. Sanjay Mehta",
        isAvailable: true,
        phone: "9876543310"
      }
    ],
    facilities: {
      oxygenAvailable: true,
      ventilators: 16,
      ambulanceService: true,
      bloodBank: true,
      pharmacy24x7: true,
      emergencyRoom: true,
      operationTheater: true
    },
    isVerified: true,
    isActive: true,
    acceptingEmergencies: true
  },
  {
    name: "Narayana Health Ahmedabad",
    registrationNumber: "NAR-AHM-2024-009",
    email: "narayana.ahmedabad@hospital.com",
    phone: "9876543219",
    emergencyPhone: "9876543219",
    password: "Hospital@123",
    location: {
      type: "Point",
      coordinates: [80.613539, 16.5236721], // Near test location
      address: "Test Area",
      city: "Test City",
      state: "Test State",
      pincode: "000000"
    },
    type: "Private",
    bedAvailability: {
      general: { total: 95, available: 78 },
      icu: { total: 30, available: 24 },
      emergency: { total: 19, available: 16 }
    },
    specialists: [
      {
        specialization: "Neurologist",
        name: "Dr. Manish Shah",
        isAvailable: true,
        phone: "9876543311"
      }
    ],
    facilities: {
      oxygenAvailable: true,
      ventilators: 17,
      ambulanceService: true,
      bloodBank: true,
      pharmacy24x7: true,
      emergencyRoom: true,
      operationTheater: true
    },
    isVerified: true,
    isActive: true,
    acceptingEmergencies: true
  },
  {
    name: "Government General Hospital Chennai",
    registrationNumber: "GGH-CHN-2024-010",
    email: "ggh.chennai@hospital.com",
    phone: "9876543220",
    emergencyPhone: "9876543220",
    password: "Hospital@123",
    location: {
      type: "Point",
      coordinates: [80.613539, 16.5236721], // Near test location
      address: "Test Area",
      city: "Test City",
      state: "Test State",
      pincode: "000000"
    },
    type: "Government",
    bedAvailability: {
      general: { total: 150, available: 120 },
      icu: { total: 40, available: 32 },
      emergency: { total: 25, available: 20 }
    },
    specialists: [
      {
        specialization: "Emergency Medicine",
        name: "Dr. Lakshmi Narayan",
        isAvailable: true,
        phone: "9876543312"
      },
      {
        specialization: "Pediatrician",
        name: "Dr. Sundar Rajan",
        isAvailable: true,
        phone: "9876543313"
      }
    ],
    facilities: {
      oxygenAvailable: true,
      ventilators: 22,
      ambulanceService: true,
      bloodBank: true,
      pharmacy24x7: true,
      emergencyRoom: true,
      operationTheater: true
    },
    isVerified: true,
    isActive: true,
    acceptingEmergencies: true
  }
];

async function seedHospitals() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');

    // Optional: Clear existing hospitals (comment out if you want to keep existing data)
    // await Hospital.deleteMany({});
    // console.log('Cleared existing hospitals');

    // Insert hospitals
    const result = await Hospital.insertMany(hospitals);
    console.log(`✅ Successfully inserted ${result.length} hospitals`);
    
    // Display inserted hospitals
    result.forEach((hospital, index) => {
      console.log(`${index + 1}. ${hospital.name} - ${hospital.city}`);
    });

  } catch (error) {
    console.error('❌ Error seeding hospitals:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedHospitals();