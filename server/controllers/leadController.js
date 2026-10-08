import Lead from '../models/Lead.js';
import mongoose from 'mongoose';

// Initial Tata Motors Showroom Leads
export const initialTataLeads = [
  { 
    name: 'Dr. Ramesh Sharma', 
    phone: '+91 98201 44521', 
    email: 'ramesh.sharma@apexhealth.in',
    city: 'Coimbatore',
    carModel: 'Tata Safari', 
    variant: 'Accomplished Plus 6S Dark Edition',
    fuelType: 'Diesel',
    transmission: 'Automatic (DCA/AMT)',
    value: 2850000, 
    bookingAmount: 50000,
    stage: 'Booking Done', 
    priority: 'Hot', 
    source: 'WhatsApp Cloud API', 
    testDriveStatus: 'Completed',
    testDriveDate: '2026-09-10 11:30 AM',
    testDriveLocation: 'Customer Home / Office',
    exchangeCar: '2019 Hyundai Creta SX',
    exchangeEvaluatedPrice: 850000,
    financePreference: 'Tata Motors Finance',
    salesExecutive: 'Rajesh Kumar (Senior Product Specialist)',
    followUpDate: '2026-09-14',
    notes: 'Customer paid 50k booking token. Loan documentation pending with Tata Motors Finance. Delivery requested for next Friday.',
    followUpHistory: [
      { date: new Date(Date.now() - 86400000), type: 'Test Drive', notes: 'Home test drive conducted on Avinashi Road. Customer highly satisfied with ADAS Level 2 features.', executive: 'Rajesh Kumar' },
      { date: new Date(Date.now() - 43200000), type: 'WhatsApp', notes: 'Sent quotation with accessories package and exchange valuation.', executive: 'Rajesh Kumar' },
    ],
  },
  { 
    name: 'Priya Sundaram', 
    phone: '+91 98450 11928', 
    email: 'priya.s@novaretail.io',
    city: 'Tirupur',
    carModel: 'Tata Curvv EV', 
    variant: 'Empowered Plus 55kWh',
    fuelType: 'EV',
    transmission: 'EV Single-Speed',
    value: 2200000, 
    bookingAmount: 0,
    stage: 'Test Drive Scheduled', 
    priority: 'Hot', 
    source: 'Meta Ads Campaign', 
    testDriveStatus: 'Scheduled',
    testDriveDate: 'Tomorrow at 04:00 PM',
    testDriveLocation: 'Showroom',
    exchangeCar: 'None',
    exchangeEvaluatedPrice: 0,
    financePreference: 'HDFC Bank Auto Loan',
    salesExecutive: 'Anitha Rao (EV Specialist)',
    followUpDate: '2026-09-13',
    notes: 'Interested in Tata Curvv EV 502km range model. Test drive slot booked at showroom track.',
    followUpHistory: [
      { date: new Date(Date.now() - 7200000), type: 'WhatsApp', notes: 'Inquired via WhatsApp Ad. Sent Curvv EV specs and subsidy breakdown.', executive: 'Anitha Rao' },
    ],
  },
  { 
    name: 'Vikram Malhotra', 
    phone: '+91 99100 87341', 
    email: 'vikram.m@kryptonlogistics.com',
    city: 'Coimbatore',
    carModel: 'Tata Harrier', 
    variant: 'Fearless Plus Sunroof (AT)',
    fuelType: 'Diesel',
    transmission: 'Automatic (DCA/AMT)',
    value: 2450000, 
    bookingAmount: 0,
    stage: 'Quote Sent', 
    priority: 'Hot', 
    source: 'Showroom Walk-in', 
    testDriveStatus: 'Completed',
    testDriveDate: 'Yesterday 05:00 PM',
    testDriveLocation: 'Showroom',
    exchangeCar: '2017 Honda City V',
    exchangeEvaluatedPrice: 520000,
    financePreference: 'SBI Car Loan',
    salesExecutive: 'Vignesh S (Sales Consultant)',
    followUpDate: '2026-09-14',
    notes: 'Quotation sent including corporate discount and exchange bonus of Rs. 40,000.',
    followUpHistory: [
      { date: new Date(Date.now() - 14400000), type: 'Showroom Visit', notes: 'Walk-in with family. Explored Sunroof variants.', executive: 'Vignesh S' },
    ],
  },
  { 
    name: 'Ananya Deshmukh', 
    phone: '+91 97690 32189', 
    email: 'ananya@zenithcloud.org',
    city: 'Erode',
    carModel: 'Tata Nexon', 
    variant: 'Creative Plus S (DCA)',
    fuelType: 'Petrol',
    transmission: 'Automatic (DCA/AMT)',
    value: 1520000, 
    bookingAmount: 25000,
    stage: 'Finance & RTO', 
    priority: 'Hot', 
    source: 'WhatsApp Cloud API', 
    testDriveStatus: 'Completed',
    testDriveDate: '3 days ago',
    testDriveLocation: 'Customer Home / Office',
    exchangeCar: 'None',
    exchangeEvaluatedPrice: 0,
    financePreference: 'Tata Motors Finance',
    salesExecutive: 'Rajesh Kumar (Senior Product Specialist)',
    followUpDate: '2026-09-15',
    notes: 'Loan sanction approved. RTO road tax challan generated. Delivery promised before auspicious date.',
    followUpHistory: [
      { date: new Date(Date.now() - 86400000), type: 'Call', notes: 'Confirmed loan approval from Tata Motors Finance at 8.65% ROI.', executive: 'Rajesh Kumar' },
    ],
  },
  { 
    name: 'Arun Patel', 
    phone: '+91 98250 67123', 
    email: 'arun@gujaratpolymers.com',
    city: 'Salem',
    carModel: 'Tata Punch', 
    variant: 'Accomplished Dazzle Sunroof iCNG',
    fuelType: 'CNG',
    transmission: 'Manual',
    value: 985000, 
    bookingAmount: 0,
    stage: 'New Inquiry', 
    priority: 'Warm', 
    source: 'CarDekho / CarWale', 
    testDriveStatus: 'Not Requested',
    testDriveDate: '',
    testDriveLocation: 'Showroom',
    exchangeCar: '2015 Maruti WagonR',
    exchangeEvaluatedPrice: 220000,
    financePreference: 'ICICI Bank',
    salesExecutive: 'Karthik N (Product Genius)',
    followUpDate: '2026-09-13',
    notes: 'Inquired about twin-cylinder CNG technology and boot space. WhatsApp automated brochure sent.',
    followUpHistory: [
      { date: new Date(Date.now() - 172800000), type: 'WhatsApp', notes: 'Automated AI welcome message and Punch iCNG brochure delivered.', executive: 'Tata AI Bot' },
    ],
  },
  { 
    name: 'Sunita Reddy', 
    phone: '+91 94401 55678', 
    email: 'sunita@hydrafin.com',
    city: 'Coimbatore',
    carModel: 'Tata Altroz', 
    variant: 'XZ Plus (S) Lux',
    fuelType: 'Petrol',
    transmission: 'Automatic (DCA/AMT)',
    value: 1150000, 
    bookingAmount: 50000,
    stage: 'Delivered', 
    priority: 'Hot', 
    source: 'Customer Exchange / Referral', 
    testDriveStatus: 'Completed',
    testDriveDate: 'Last week',
    testDriveLocation: 'Showroom',
    exchangeCar: '2014 Hyundai i10',
    exchangeEvaluatedPrice: 240000,
    financePreference: 'Self Finance / Cash',
    salesExecutive: 'Vignesh S (Sales Consultant)',
    followUpDate: '2026-09-20',
    notes: 'Car delivered successfully with ceremonial handover and gold coin offer. First service reminder scheduled in 30 days.',
    followUpHistory: [
      { date: new Date(Date.now() - 259200000), type: 'Showroom Visit', notes: 'Delivered Tata Altroz XZ+. Customer gave 5-star Google review.', executive: 'Vignesh S' },
    ],
  },
];

let memoryLeads = initialTataLeads.map((l, i) => ({ ...l, _id: `lead-tata-${i + 1}`, createdAt: new Date().toISOString() }));

export const getLeads = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      let leads = await Lead.find().sort({ createdAt: -1 });
      if (leads.length === 0) {
        // Auto-seed initial Tata Showroom leads
        leads = await Lead.insertMany(initialTataLeads);
      }
      return res.json(leads);
    }
    return res.json(memoryLeads);
  } catch (err) {
    return res.json(memoryLeads);
  }
};

export const createLead = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const newLead = await Lead.create(req.body);
      return res.status(201).json(newLead);
    }
    const memLead = { 
      _id: 'lead-tata-' + Date.now(), 
      ...req.body, 
      createdAt: new Date().toISOString(),
      followUpHistory: req.body.notes ? [{ date: new Date(), type: 'WhatsApp', notes: req.body.notes, executive: 'Sales Consultant' }] : []
    };
    memoryLeads.unshift(memLead);
    return res.status(201).json(memLead);
  } catch (err) {
    const memLead = { 
      _id: 'lead-tata-' + Date.now(), 
      ...req.body, 
      createdAt: new Date().toISOString() 
    };
    memoryLeads.unshift(memLead);
    return res.status(201).json(memLead);
  }
};

export const updateLeadStage = async (req, res) => {
  const { id } = req.params;
  const { stage, priority, purchaseTimeline } = req.body;
  const setFields = { stage };
  if (priority) setFields.priority = priority;
  if (purchaseTimeline) setFields.purchaseTimeline = purchaseTimeline;

  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await Lead.findByIdAndUpdate(
        id, 
        { 
          $set: setFields,
          $push: {
            followUpHistory: {
              date: new Date(),
              type: 'WhatsApp',
              notes: `Pipeline stage moved to: ${stage}${purchaseTimeline ? ` • Timeline: ${purchaseTimeline}` : ''}`,
              executive: 'Sales Consultant'
            }
          }
        }, 
        { new: true }
      );
      return res.json(updated);
    }
    const lead = memoryLeads.find((l) => l._id === id);
    if (lead) {
      lead.stage = stage;
      if (priority) lead.priority = priority;
      if (purchaseTimeline) lead.purchaseTimeline = purchaseTimeline;
      lead.followUpHistory = lead.followUpHistory || [];
      lead.followUpHistory.unshift({
        date: new Date(),
        type: 'WhatsApp',
        notes: `Pipeline stage moved to: ${stage}`,
        executive: 'Sales Consultant'
      });
    }
    return res.json(lead || { _id: id, ...setFields });
  } catch (err) {
    const lead = memoryLeads.find((l) => l._id === id);
    if (lead) {
      lead.stage = stage;
      if (priority) lead.priority = priority;
      if (purchaseTimeline) lead.purchaseTimeline = purchaseTimeline;
    }
    return res.json(lead || { _id: id, ...setFields });
  }
};

export const addFollowUpLog = async (req, res) => {
  const { id } = req.params;
  const { type, notes, nextFollowUpDate, executive } = req.body;

  const logEntry = {
    date: new Date(),
    type: type || 'WhatsApp',
    notes: notes || 'Follow-up discussion logged',
    executive: executive || 'Sales Consultant',
    nextFollowUpDate: nextFollowUpDate || null,
  };

  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await Lead.findByIdAndUpdate(
        id, 
        { 
          $push: { followUpHistory: logEntry },
          ...(nextFollowUpDate ? { followUpDate: nextFollowUpDate } : {})
        }, 
        { new: true }
      );
      return res.json(updated);
    }

    const lead = memoryLeads.find((l) => l._id === id);
    if (lead) {
      lead.followUpHistory = lead.followUpHistory || [];
      lead.followUpHistory.unshift(logEntry);
      if (nextFollowUpDate) lead.followUpDate = nextFollowUpDate;
    }
    return res.json(lead);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateLead = async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoose.connection.readyState === 1) {
      const updated = await Lead.findByIdAndUpdate(id, req.body, { new: true });
      return res.json(updated);
    }
    let lead = memoryLeads.find((l) => l._id === id);
    if (lead) Object.assign(lead, req.body);
    return res.json(lead || { _id: id, ...req.body });
  } catch (err) {
    let lead = memoryLeads.find((l) => l._id === id);
    if (lead) Object.assign(lead, req.body);
    return res.json(lead || { _id: id, ...req.body });
  }
};

export const deleteLead = async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoose.connection.readyState === 1) {
      await Lead.findByIdAndDelete(id);
      return res.json({ success: true });
    }
    memoryLeads = memoryLeads.filter((l) => l._id !== id);
    return res.json({ success: true });
  } catch (err) {
    memoryLeads = memoryLeads.filter((l) => l._id !== id);
    return res.json({ success: true });
  }
};
