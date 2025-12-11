const mongoose = require('mongoose');
const Ambulance = require('../models/Ambulance'); // Adjust path as needed
const Hospital = require('../models/Hospital'); // Adjust path as needed
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample ambulance data (WITHOUT baseHospital - will be assigned dynamically)
const ambulanceData = [
  {
    vehicleNumber: 'DL01AB1234',
    role: 'ambulance',
    driver: {
      name: 'Rajesh Kumar',
      phone: '9876543210',
      email: 'rajesh.kumar@ambulance.com',
      licenseNumber: 'DL0120230001',
      licenseExpiry: new Date('2026-12-31'),
    },
    password: 'Driver@123',
    type: 'ALS',
    equipment: {
      oxygen: true,
      defibrillator: true,
      ventilator: true,
      ecgMachine: true,
      stretcher: true,
      firstAidKit: true,
      fireExtinguisher: true
    },
    currentLocation: {
      type: 'Point',
      coordinates: [80.613565, 16.5237], // Near specified location
      address: 'Near HealthLink, Vijayawada',
      lastUpdated: new Date()
    },
    status: 'available',
    isActive: true,
    isVerified: true,
    stats: {
      totalTrips: 145,
      completedTrips: 138,
      cancelledTrips: 7,
      averageResponseTime: 8.5,
      averageRating: 4.7,
      totalRatings: 132
    },
    registrationDate: new Date('2022-01-15'),
    lastMaintenanceDate: new Date('2024-11-01'),
    nextMaintenanceDate: new Date('2025-02-01')
  },
  {
    vehicleNumber: 'DL02CD5678',
    role: 'ambulance',
    driver: {
      name: 'Priya Sharma',
      phone: '9876543211',
      email: 'priya.sharma@ambulance.com',
      licenseNumber: 'DL0220230002',
      licenseExpiry: new Date('2027-06-30'),
    },
    password: 'Driver@123',
    type: 'Cardiac',
    equipment: {
      oxygen: true,
      defibrillator: true,
      ventilator: true,
      ecgMachine: true,
      stretcher: true,
      firstAidKit: true,
      fireExtinguisher: true
    },
    currentLocation: {
      type: 'Point',
      coordinates: [80.6136, 16.5238], // Near specified location
      address: 'Near HealthLink, Vijayawada',
      lastUpdated: new Date()
    },
    status: 'available',
    isActive: true,
    isVerified: true,
    stats: {
      totalTrips: 98,
      completedTrips: 94,
      cancelledTrips: 4,
      averageResponseTime: 7.2,
      averageRating: 4.8,
      totalRatings: 89
    },
    registrationDate: new Date('2022-06-10'),
    lastMaintenanceDate: new Date('2024-10-15'),
    nextMaintenanceDate: new Date('2025-01-15')
  },
  {
    vehicleNumber: 'DL03EF9012',
    role: 'ambulance',
    driver: {
      name: 'Amit Singh',
      phone: '9876543212',
      email: 'amit.singh@ambulance.com',
      licenseNumber: 'DL0320230003',
      licenseExpiry: new Date('2026-09-15'),
    },
    password: 'Driver@123',
    type: 'Basic',
    equipment: {
      oxygen: true,
      defibrillator: false,
      ventilator: false,
      ecgMachine: false,
      stretcher: true,
      firstAidKit: true,
      fireExtinguisher: true
    },
    currentLocation: {
      type: 'Point',
      coordinates: [77.2295, 28.5355], // South Delhi
      address: 'Saket, New Delhi',
      lastUpdated: new Date()
    },
    status: 'available',
    isActive: true,
    isVerified: true,
    stats: {
      totalTrips: 203,
      completedTrips: 195,
      cancelledTrips: 8,
      averageResponseTime: 9.8,
      averageRating: 4.5,
      totalRatings: 187
    },
    registrationDate: new Date('2021-03-20'),
    lastMaintenanceDate: new Date('2024-11-20'),
    nextMaintenanceDate: new Date('2025-02-20')
  },
  {
    vehicleNumber: 'DL04GH3456',
    role: 'ambulance',
    driver: {
      name: 'Sunita Verma',
      phone: '9876543213',
      email: 'sunita.verma@ambulance.com',
      licenseNumber: 'DL0420230004',
      licenseExpiry: new Date('2027-03-25'),
    },
    password: 'Driver@123',
    type: 'Neonatal',
    equipment: {
      oxygen: true,
      defibrillator: true,
      ventilator: true,
      ecgMachine: true,
      stretcher: true,
      firstAidKit: true,
      fireExtinguisher: true
    },
    currentLocation: {
      type: 'Point',
      coordinates: [77.2773, 28.5494], // East Delhi
      address: 'Laxmi Nagar, Delhi',
      lastUpdated: new Date()
    },
    status: 'available',
    isActive: true,
    isVerified: true,
    stats: {
      totalTrips: 67,
      completedTrips: 65,
      cancelledTrips: 2,
      averageResponseTime: 6.5,
      averageRating: 4.9,
      totalRatings: 63
    },
    registrationDate: new Date('2023-01-05'),
    lastMaintenanceDate: new Date('2024-11-10'),
    nextMaintenanceDate: new Date('2025-02-10')
  },
  {
    vehicleNumber: 'DL05IJ7890',
    role: 'ambulance',
    driver: {
      name: 'Vikram Rao',
      phone: '9876543214',
      email: 'vikram.rao@ambulance.com',
      licenseNumber: 'DL0520230005',
      licenseExpiry: new Date('2026-11-20'),
    },
    password: 'Driver@123',
    type: 'ALS',
    equipment: {
      oxygen: true,
      defibrillator: true,
      ventilator: true,
      ecgMachine: true,
      stretcher: true,
      firstAidKit: true,
      fireExtinguisher: true
    },
    currentLocation: {
      type: 'Point',
      coordinates: [77.1025, 28.7041], // West Delhi
      address: 'Pitampura, Delhi',
      lastUpdated: new Date()
    },
    status: 'on_duty',
    isActive: true,
    isVerified: true,
    stats: {
      totalTrips: 178,
      completedTrips: 170,
      cancelledTrips: 8,
      averageResponseTime: 8.9,
      averageRating: 4.6,
      totalRatings: 165
    },
    registrationDate: new Date('2021-09-12'),
    lastMaintenanceDate: new Date('2024-10-25'),
    nextMaintenanceDate: new Date('2025-01-25')
  },
  {
    vehicleNumber: 'DL06KL2345',
    role: 'ambulance',
    driver: {
      name: 'Deepak Patel',
      phone: '9876543215',
      email: 'deepak.patel@ambulance.com',
      licenseNumber: 'DL0620230006',
      licenseExpiry: new Date('2027-08-10'),
    },
    password: 'Driver@123',
    type: 'Basic',
    equipment: {
      oxygen: true,
      defibrillator: false,
      ventilator: false,
      ecgMachine: false,
      stretcher: true,
      firstAidKit: true,
      fireExtinguisher: true
    },
    currentLocation: {
      type: 'Point',
      coordinates: [77.1556, 28.5183], // Vasant Kunj
      address: 'Vasant Kunj, Delhi',
      lastUpdated: new Date()
    },
    status: 'available',
    isActive: true,
    isVerified: true,
    stats: {
      totalTrips: 156,
      completedTrips: 148,
      cancelledTrips: 8,
      averageResponseTime: 11.2,
      averageRating: 4.4,
      totalRatings: 142
    },
    registrationDate: new Date('2022-04-18'),
    lastMaintenanceDate: new Date('2024-11-05'),
    nextMaintenanceDate: new Date('2025-02-05')
  },
  {
    vehicleNumber: 'DL07MN6789',
    role: 'ambulance',
    driver: {
      name: 'Meena Krishnan',
      phone: '9876543216',
      email: 'meena.krishnan@ambulance.com',
      licenseNumber: 'DL0720230007',
      licenseExpiry: new Date('2026-05-22'),
    },
    password: 'Driver@123',
    type: 'Cardiac',
    equipment: {
      oxygen: true,
      defibrillator: true,
      ventilator: true,
      ecgMachine: true,
      stretcher: true,
      firstAidKit: true,
      fireExtinguisher: true
    },
    currentLocation: {
      type: 'Point',
      coordinates: [77.2167, 28.6517], // Rajendra Place
      address: 'Rajendra Place, Delhi',
      lastUpdated: new Date()
    },
    status: 'available',
    isActive: true,
    isVerified: true,
    stats: {
      totalTrips: 89,
      completedTrips: 86,
      cancelledTrips: 3,
      averageResponseTime: 7.8,
      averageRating: 4.8,
      totalRatings: 83
    },
    registrationDate: new Date('2022-11-30'),
    lastMaintenanceDate: new Date('2024-10-20'),
    nextMaintenanceDate: new Date('2025-01-20')
  },
  {
    vehicleNumber: 'DL08OP1234',
    role: 'ambulance',
    driver: {
      name: 'Ravi Subramanian',
      phone: '9876543217',
      email: 'ravi.subramanian@ambulance.com',
      licenseNumber: 'DL0820230008',
      licenseExpiry: new Date('2027-02-14'),
    },
    password: 'Driver@123',
    type: 'ALS',
    equipment: {
      oxygen: true,
      defibrillator: true,
      ventilator: true,
      ecgMachine: true,
      stretcher: true,
      firstAidKit: true,
      fireExtinguisher: true
    },
    currentLocation: {
      type: 'Point',
      coordinates: [77.2773, 28.6139], // Janakpuri
      address: 'Janakpuri, Delhi',
      lastUpdated: new Date()
    },
    status: 'available',
    isActive: true,
    isVerified: true,
    stats: {
      totalTrips: 124,
      completedTrips: 119,
      cancelledTrips: 5,
      averageResponseTime: 8.3,
      averageRating: 4.7,
      totalRatings: 115
    },
    registrationDate: new Date('2021-12-08'),
    lastMaintenanceDate: new Date('2024-11-15'),
    nextMaintenanceDate: new Date('2025-02-15')
  }
];

// Seed function
const seedAmbulances = async () => {
  try {
    await connectDB();
    
    // Clear existing ambulances
    console.log('🗑️  Clearing existing ambulances...');
    await Ambulance.deleteMany({});
    
    // Get all hospitals (should match hospital seeder)
    const hospitals = await Hospital.find({ isActive: true, isVerified: true });
    
    if (hospitals.length === 0) {
      console.log('⚠️  No hospitals found. Please seed hospitals first.');
      console.log('💡 Run: node seeders/hospitalSeeder.js');
      process.exit(1);
    }
    
    console.log(`✅ Found ${hospitals.length} hospitals for assignment`);
    
    // Distribute ambulances across hospitals evenly
    const ambulancesWithHospitals = ambulanceData.map((amb, index) => ({
      ...amb,
      baseHospital: hospitals[index % hospitals.length]._id
    }));
    
    // Insert ambulances
    console.log('🚑 Creating ambulances...');
    const createdAmbulances = await Ambulance.create(ambulancesWithHospitals);
    
    console.log(`✅ Successfully created ${createdAmbulances.length} ambulances`);
    console.log('\n📊 Ambulance Summary:');
    console.log(`   - Basic: ${createdAmbulances.filter(a => a.type === 'Basic').length}`);
    console.log(`   - ALS: ${createdAmbulances.filter(a => a.type === 'ALS').length}`);
    console.log(`   - Cardiac: ${createdAmbulances.filter(a => a.type === 'Cardiac').length}`);
    console.log(`   - Neonatal: ${createdAmbulances.filter(a => a.type === 'Neonatal').length}`);
    console.log(`   - Available: ${createdAmbulances.filter(a => a.status === 'available').length}`);
    console.log(`   - On Duty: ${createdAmbulances.filter(a => a.status === 'on_duty').length}`);
    
    // Show hospital distribution
    console.log('\n🏥 Hospital Distribution:');
    for (const hospital of hospitals) {
      const count = createdAmbulances.filter(
        a => a.baseHospital.toString() === hospital._id.toString()
      ).length;
      console.log(`   - ${hospital.name}: ${count} ambulance(s)`);
    }
    
    console.log('\n🔐 Login Credentials:');
    console.log('   Email: rajesh.kumar@ambulance.com');
    console.log('   Password: Driver@123');
    console.log('   (Use any ambulance email with password: Driver@123)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding ambulances:', error);
    if (error.errors) {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
};

// Run seeder
seedAmbulances();