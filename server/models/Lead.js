import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['WhatsApp', 'Call', 'Showroom Visit', 'Test Drive'], default: 'WhatsApp' },
  notes: { type: String, required: true },
  executive: { type: String, default: 'Sales Consultant' },
  nextFollowUpDate: { type: Date },
});

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    city: { type: String, default: 'Coimbatore / Tamil Nadu' },
    carModel: { 
      type: String, 
      default: 'Tata Nexon'
    },
    variant: { type: String, default: 'Creative Plus S' },
    fuelType: { type: String, enum: ['Petrol', 'Diesel', 'CNG', 'EV'], default: 'Petrol' },
    transmission: { type: String, enum: ['Manual', 'Automatic (DCA/AMT)', 'EV Single-Speed'], default: 'Manual' },
    value: { type: Number, default: 1450000 }, // On-road valuation in INR
    bookingAmount: { type: Number, default: 0 },
    priority: { type: String, enum: ['Hot', 'Warm', 'Cold'], default: 'Hot' },
    purchaseTimeline: { 
      type: String, 
      enum: ['10 - 15 Days', '1 Month', '1 - 3 Months', 'Immediate', '3+ Months'], 
      default: '10 - 15 Days' 
    },
    stage: { 
      type: String, 
      enum: [
        'New Inquiry',
        'Inquiry - Hot',
        'Inquiry - Warm',
        'Inquiry - Cold',
        'Test Drive Scheduled', 
        'Quote Sent', 
        'Booking Done', 
        'Finance & RTO', 
        'Retail',
        'Delivered', 
        'Lost'
      ], 
      default: 'Inquiry - Hot' 
    },
    source: { 
      type: String, 
      enum: [
        'WhatsApp Cloud API', 
        'Showroom Walk-in', 
        'Test Drive Portal', 
        'CarDekho / CarWale', 
        'Meta Ads Campaign', 
        'Customer Exchange / Referral'
      ], 
      default: 'WhatsApp Cloud API' 
    },
    testDriveStatus: { 
      type: String, 
      enum: ['Not Requested', 'Scheduled', 'Completed', 'Customer Rescheduled'],
      default: 'Not Requested'
    },
    testDriveDate: { type: String, default: '' },
    testDriveLocation: { type: String, enum: ['Showroom', 'Customer Home / Office'], default: 'Showroom' },
    exchangeCar: { type: String, default: 'None' },
    exchangeEvaluatedPrice: { type: Number, default: 0 },
    financePreference: { 
      type: String, 
      enum: ['Tata Motors Finance', 'HDFC Bank Auto Loan', 'SBI Car Loan', 'ICICI Bank', 'Self Finance / Cash'],
      default: 'Tata Motors Finance'
    },
    salesExecutive: { type: String, default: 'Rajesh Kumar (Senior Product Specialist)' },
    followUpDate: { type: String, default: '' },
    followUpHistory: [followUpSchema],
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model('Lead', leadSchema);
