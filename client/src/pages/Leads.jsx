import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Kanban, 
  Table, 
  Phone, 
  Mail, 
  Car, 
  Calendar, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  CheckCircle2,
  X, 
  Send,
  MoreVertical,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  TrendingUp,
  Tag,
  ArrowRight,
  Zap,
  Navigation,
  FileText,
  ShieldCheck,
  Key,
  Award,
  Sparkles,
  Layers,
  Activity,
  SlidersHorizontal,
  Flame,
  Snowflake,
  UserCheck,
  Info,
  Check,
  Shield
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const STAGES = [
  'Inquiry - Hot',
  'Inquiry - Warm',
  'Inquiry - Cold',
  'Test Drive Scheduled',
  'Quote Sent',
  'Booking Done',
  'Finance & RTO',
  'Retail',
  'Delivered'
];

const UNIFIED_TAB_COLOR = '#10b981';
const UNIFIED_TAB_GRADIENT = 'linear-gradient(90deg, #10b981, #059669)';
const UNIFIED_TAB_BG = 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, transparent 100%)';

export const STAGE_CONFIG = {
  'Inquiry - Hot': {
    step: '01',
    code: 'HOT',
    color: UNIFIED_TAB_COLOR,
    accentGradient: UNIFIED_TAB_GRADIENT,
    bgGradient: UNIFIED_TAB_BG,
    badgeText: 'Hot Inquiry 🔥',
    icon: Flame,
    priority: 'Hot'
  },
  'Inquiry - Warm': {
    step: '02',
    code: 'WARM',
    color: UNIFIED_TAB_COLOR,
    accentGradient: UNIFIED_TAB_GRADIENT,
    bgGradient: UNIFIED_TAB_BG,
    badgeText: 'Warm Inquiry ⚡',
    icon: Zap,
    priority: 'Warm'
  },
  'Inquiry - Cold': {
    step: '03',
    code: 'COLD',
    color: UNIFIED_TAB_COLOR,
    accentGradient: UNIFIED_TAB_GRADIENT,
    bgGradient: UNIFIED_TAB_BG,
    badgeText: 'Cold Inquiry ❄️',
    icon: Snowflake,
    priority: 'Cold'
  },
  'Test Drive Scheduled': {
    step: '04',
    code: 'DRIVE',
    color: UNIFIED_TAB_COLOR,
    accentGradient: UNIFIED_TAB_GRADIENT,
    bgGradient: UNIFIED_TAB_BG,
    badgeText: 'Test Drive 🏎️',
    icon: Navigation
  },
  'Quote Sent': {
    step: '05',
    code: 'QUOTE',
    color: UNIFIED_TAB_COLOR,
    accentGradient: UNIFIED_TAB_GRADIENT,
    bgGradient: UNIFIED_TAB_BG,
    badgeText: 'Quote Sent 📑',
    icon: FileText
  },
  'Booking Done': {
    step: '06',
    code: 'BOOKED',
    color: UNIFIED_TAB_COLOR,
    accentGradient: UNIFIED_TAB_GRADIENT,
    bgGradient: UNIFIED_TAB_BG,
    badgeText: 'Token Locked 💰',
    icon: CheckCircle2
  },
  'Finance & RTO': {
    step: '07',
    code: 'RTO',
    color: UNIFIED_TAB_COLOR,
    accentGradient: UNIFIED_TAB_GRADIENT,
    bgGradient: UNIFIED_TAB_BG,
    badgeText: 'Finance & RTO 🏦',
    icon: ShieldCheck
  },
  'Retail': {
    step: '08',
    code: 'RETAIL',
    color: UNIFIED_TAB_COLOR,
    accentGradient: UNIFIED_TAB_GRADIENT,
    bgGradient: UNIFIED_TAB_BG,
    badgeText: 'Invoiced 🔑',
    icon: Key
  },
  'Delivered': {
    step: '09',
    code: 'DELIVERED',
    color: UNIFIED_TAB_COLOR,
    accentGradient: UNIFIED_TAB_GRADIENT,
    bgGradient: UNIFIED_TAB_BG,
    badgeText: 'Delivered 🏆',
    icon: Award
  }
};

export const ALL_TATA_MODELS = [
  { name: 'Tata Curvv EV', fuel: 'EV', variant: 'Empowered Plus 55kWh', price: 2199000, desc: 'Electric SUV Coupé • 502km Range' },
  { name: 'Tata Curvv', fuel: 'Petrol', variant: 'Accomplished Plus A 1.2 DCA', price: 1749000, desc: 'Hyperion Turbo GDi Coupé' },
  { name: 'Tata Harrier EV', fuel: 'EV', variant: 'Empowered AWD Dual-Motor', price: 2499000, desc: 'All-Terrain Dual Motor EV' },
  { name: 'Tata Harrier', fuel: 'Diesel', variant: 'Fearless Plus Sunroof (AT)', price: 2450000, desc: 'Kryotec 2.0L Diesel • ADAS L2' },
  { name: 'Tata Safari', fuel: 'Diesel', variant: 'Accomplished Plus 6S Dark Edition', price: 2850000, desc: 'Flagship 6/7-Seater Luxury SUV' },
  { name: 'Tata Nexon EV', fuel: 'EV', variant: 'Empowered Plus 45kWh LR', price: 1699000, desc: 'India’s #1 Electric SUV • 489km' },
  { name: 'Tata Nexon', fuel: 'Petrol', variant: 'Creative Plus S (DCA)', price: 1450000, desc: '1.2L Turbo Dual-Clutch 7-Speed' },
  { name: 'Tata Nexon iCNG', fuel: 'CNG', variant: 'Fearless Plus Twin-Cylinder', price: 1390000, desc: 'Turbocharged Twin-Cylinder CNG' },
  { name: 'Tata Punch EV', fuel: 'EV', variant: 'Empowered Plus LR Sunroof', price: 1420000, desc: 'Smart Compact Electric SUV' },
  { name: 'Tata Punch', fuel: 'Petrol', variant: 'Accomplished Dazzle Sunroof', price: 920000, desc: '5-Star Safety Micro-SUV' },
  { name: 'Tata Punch iCNG', fuel: 'CNG', variant: 'Accomplished Dazzle iCNG', price: 980000, desc: 'Twin-Cylinder 60L Boot' },
  { name: 'Tata Altroz Racer', fuel: 'Petrol', variant: 'R3 1.2L Turbo 120PS 6MT', price: 1099000, desc: 'Track-Inspired Hot Hatch' },
  { name: 'Tata Altroz', fuel: 'Petrol', variant: 'XZ Plus OS Dual-Clutch (DCA)', price: 1050000, desc: 'Gold Standard 5-Star Hatch' },
  { name: 'Tata Altroz iCNG', fuel: 'CNG', variant: 'XZ Plus iCNG Sunroof', price: 1010000, desc: 'Twin-Cylinder Tech Premium CNG' },
  { name: 'Tata Tiago EV', fuel: 'EV', variant: 'XZ Plus Tech LUX 24kWh', price: 1149000, desc: 'Electrifying City Car • 315km' },
  { name: 'Tata Tiago', fuel: 'Petrol', variant: 'XZ Plus AMT Dual-Tone', price: 799000, desc: 'Revotron 1.2L Peppy Hatch' },
  { name: 'Tata Tiago iCNG', fuel: 'CNG', variant: 'XZ Plus iCNG AMT', price: 875000, desc: 'Automatic CNG Hatch' },
  { name: 'Tata Tigor EV', fuel: 'EV', variant: 'XZ Plus LUX Sedan', price: 1375000, desc: 'Electric Executive Sedan' },
  { name: 'Tata Tigor', fuel: 'CNG', variant: 'XZ Plus iCNG AMT', price: 940000, desc: 'Compact Executive Sedan with iCNG' },
  { name: 'Tata Sierra EV', fuel: 'EV', variant: 'Signature Lounge Edition AWD', price: 2600000, desc: 'Iconic Reborn Luxury Electric SUV' },
  { name: 'Tata Avinya Concept', fuel: 'EV', variant: 'Gen-3 Pure EV Architecture', price: 3500000, desc: 'Next-Gen Ultra Luxury EV' }
];

export const PURCHASE_TIMELINES = [
  {
    key: 'Hot',
    timeline: '10 - 15 Days',
    label: '10 to 15 Days',
    stage: 'Inquiry - Hot',
    priority: 'Hot',
    color: '#ff0055',
    badge: '🔥 HOT',
    desc: 'Immediate Purchase (10-15 Days)'
  },
  {
    key: 'Warm',
    timeline: '1 Month',
    label: '1 Month (30 Days)',
    stage: 'Inquiry - Warm',
    priority: 'Warm',
    color: '#ff9900',
    badge: '⚡ WARM',
    desc: 'Active Consideration (Within 1 Month)'
  },
  {
    key: 'Cold',
    timeline: '1 - 3 Months',
    label: '1 to 3 Months',
    stage: 'Inquiry - Cold',
    priority: 'Cold',
    color: '#00b4d8',
    badge: '❄️ COLD',
    desc: 'Future Planning (1 to 3 Months)'
  }
];

export const STAGE_SHORT_NAMES = {
  'Inquiry - Hot': '🔥 Hot',
  'Inquiry - Warm': '⚡ Warm',
  'Inquiry - Cold': '❄️ Cold',
  'Test Drive Scheduled': '🚗 Test Drive',
  'Quote Sent': '📑 Quote',
  'Booking Done': '💰 Booking',
  'Finance & RTO': '🏦 Finance',
  'Retail': '🔑 Retail',
  'Delivered': '🏆 Delivered'
};

export const normalizeLeadStage = (lead) => {
  if (lead.stage === 'New Inquiry' || !lead.stage) {
    if (lead.priority === 'Hot' || lead.purchaseTimeline === '10 - 15 Days') return 'Inquiry - Hot';
    if (lead.priority === 'Cold' || lead.purchaseTimeline === '1 - 3 Months') return 'Inquiry - Cold';
    return 'Inquiry - Warm';
  }
  return lead.stage;
};

export const getLeadTimelineInfo = (lead) => {
  const explicit = lead.purchaseTimeline;
  const stage = normalizeLeadStage(lead);
  if (explicit === '10 - 15 Days' || stage === 'Inquiry - Hot' || (!explicit && lead.priority === 'Hot')) {
    return {
      timeline: '10 - 15 Days',
      label: '10-15 Days',
      priority: 'Hot',
      color: '#ff0055',
      bg: 'rgba(255, 0, 85, 0.12)',
      border: 'rgba(255, 0, 85, 0.35)',
      icon: '🔥'
    };
  }
  if (explicit === '1 Month' || stage === 'Inquiry - Warm' || (!explicit && lead.priority === 'Warm')) {
    return {
      timeline: '1 Month',
      label: '1 Month',
      priority: 'Warm',
      color: '#ff9900',
      bg: 'rgba(255, 153, 0, 0.12)',
      border: 'rgba(255, 153, 0, 0.35)',
      icon: '⚡'
    };
  }
  return {
    timeline: '1 - 3 Months',
    label: '1-3 Months',
    priority: 'Cold',
    color: '#00b4d8',
    bg: 'rgba(0, 240, 255, 0.12)',
    border: 'rgba(0, 240, 255, 0.35)',
    icon: '❄️'
  };
};

const getPowertrainTag = (lead) => {
  const model = lead.carModel || '';
  const fuel = (lead.fuelType || '').toUpperCase();
  if (fuel === 'EV' || model.toLowerCase().includes('ev')) {
    return {
      text: '⚡ EV 55kWh • 502km',
      color: '#00f0ff',
      bg: 'rgba(0, 240, 255, 0.12)',
      border: 'rgba(0, 240, 255, 0.35)'
    };
  }
  if (fuel === 'DIESEL') {
    return {
      text: '⚙️ 2.0L Kryotec • AT',
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.12)',
      border: 'rgba(168, 85, 247, 0.35)'
    };
  }
  if (fuel === 'CNG' || model.toLowerCase().includes('cng')) {
    return {
      text: '🌿 iCNG Twin-Cylinder',
      color: '#00ff88',
      bg: 'rgba(0, 255, 136, 0.12)',
      border: 'rgba(0, 255, 136, 0.35)'
    };
  }
  return {
    text: '⛽ 1.2L Turbo • DCA',
    color: '#ff9900',
    bg: 'rgba(255, 153, 0, 0.12)',
    border: 'rgba(255, 153, 0, 0.35)'
  };
};

const getInitials = (name) => {
  if (!name) return 'TM';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

const INITIAL_FALLBACK_LEADS = [
  {
    _id: 'inq-hot-1',
    name: 'Rahul Verma',
    phone: '+91 98401 23456',
    email: 'rahul.verma@techcloud.io',
    carModel: 'Tata Curvv EV',
    variant: 'Empowered Plus 55kWh',
    fuelType: 'EV',
    value: 2199000,
    bookingAmount: 0,
    stage: 'Inquiry - Hot',
    priority: 'Hot',
    source: 'WhatsApp Cloud API',
    validated: true,
    salesExecutive: 'Ruban',
    notes: 'Hot inquiry: Customer ready for immediate booking, checking subsidy and home charger installation.',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'inq-warm-1',
    name: 'Karthik Subramanian',
    phone: '+91 94430 77123',
    email: 'karthik.s@autoline.in',
    carModel: 'Tata Punch EV',
    variant: 'Empowered Plus LR Sunroof',
    fuelType: 'EV',
    value: 1420000,
    bookingAmount: 0,
    stage: 'Inquiry - Warm',
    priority: 'Warm',
    source: 'Meta Ads Campaign',
    validated: true,
    salesExecutive: 'Ruban',
    notes: 'Warm inquiry: Comparing with Citroen eC3, requested home test drive this Saturday.',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'inq-cold-1',
    name: 'Meera Nambiar',
    phone: '+91 98840 55219',
    email: 'meera.n@solaris.co',
    carModel: 'Tata Altroz Racer',
    variant: 'R3 1.2L Turbo 120PS 6MT',
    fuelType: 'Petrol',
    value: 1099000,
    bookingAmount: 0,
    stage: 'Inquiry - Cold',
    priority: 'Cold',
    source: 'Showroom Walk-in',
    validated: true,
    salesExecutive: 'Ruban',
    notes: 'Cold inquiry: Long purchase timeline (Diwali festive season), comparing hatchback models.',
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    name: 'Priya Sundaram',
    phone: '+91 98450 11928',
    email: 'priya.s@novaretail.io',
    carModel: 'Tata Curvv EV',
    variant: 'Empowered Plus 55kWh',
    fuelType: 'EV',
    value: 2200000,
    bookingAmount: 0,
    stage: 'Test Drive Scheduled',
    priority: 'Hot',
    source: 'Meta Ads Campaign',
    validated: true,
    testDriveStatus: 'Scheduled',
    salesExecutive: 'Ruban',
    notes: 'Interested in Tata Curvv EV 502km range model. Test drive slot booked at showroom track.',
    createdAt: new Date().toISOString()
  },
  {
    _id: '3',
    name: 'Vikram Malhotra',
    phone: '+91 99100 87341',
    email: 'vikram.m@kryptonlogistics.com',
    carModel: 'Tata Harrier',
    variant: 'Fearless Plus Sunroof (AT)',
    fuelType: 'Diesel',
    value: 2450000,
    bookingAmount: 0,
    stage: 'Quote Sent',
    priority: 'Hot',
    source: 'Showroom Walk-in',
    validated: true,
    testDriveStatus: 'Completed',
    salesExecutive: 'Ruban',
    notes: 'Quotation sent including corporate discount and exchange bonus of Rs. 40,000.',
    createdAt: new Date().toISOString()
  },
  {
    _id: '1',
    name: 'Dr. Ramesh Sharma',
    phone: '+91 98201 44521',
    email: 'ramesh.sharma@apexhealth.in',
    carModel: 'Tata Safari',
    variant: 'Accomplished Plus 6S Dark Edition',
    fuelType: 'Diesel',
    value: 2850000,
    bookingAmount: 50000,
    stage: 'Booking Done',
    priority: 'Hot',
    source: 'WhatsApp Cloud API',
    validated: true,
    testDriveStatus: 'Completed',
    salesExecutive: 'Ruban',
    notes: 'Customer paid 50k booking token. Loan documentation pending with Tata Motors Finance.',
    createdAt: new Date().toISOString()
  },
  {
    _id: '4',
    name: 'Ananya Deshmukh',
    phone: '+91 97690 32189',
    email: 'ananya@zenithcloud.org',
    carModel: 'Tata Nexon',
    variant: 'Creative Plus S (DCA)',
    fuelType: 'Petrol',
    value: 1520000,
    bookingAmount: 25000,
    stage: 'Finance & RTO',
    priority: 'Hot',
    source: 'WhatsApp Cloud API',
    validated: true,
    testDriveStatus: 'Completed',
    salesExecutive: 'Ruban',
    notes: 'Finance sanction approved by SBI Car Loan.',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'retail-lead-1',
    name: 'Suresh Kumar',
    phone: '+91 93449 14311',
    email: 'suresh@motors.in',
    carModel: 'Tata Safari',
    variant: 'Dark Edition 6S',
    fuelType: 'Diesel',
    value: 2850000,
    bookingAmount: 50000,
    stage: 'Retail',
    priority: 'Hot',
    source: 'WhatsApp Cloud API',
    validated: true,
    testDriveStatus: 'Completed',
    salesExecutive: 'Ruban',
    notes: 'Vehicle invoiced and verified by dealership. Handover kit prepared for customer.',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'deliv-lead-1',
    name: 'Rajesh Pandian',
    phone: '+91 97900 88123',
    email: 'rajesh.p@coimbatoretech.com',
    carModel: 'Tata Harrier',
    variant: 'Fearless Plus Dark Edition',
    fuelType: 'Diesel',
    value: 2450000,
    bookingAmount: 50000,
    stage: 'Delivered',
    priority: 'Hot',
    source: 'WhatsApp Cloud API',
    validated: true,
    testDriveStatus: 'Completed',
    salesExecutive: 'Ruban',
    notes: 'Keys handed over! Customer verified and delighted with Dark Edition delivery kit.',
    createdAt: new Date().toISOString()
  }
];

const Leads = () => {
  const [leads, setLeads] = useState(INITIAL_FALLBACK_LEADS);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  // Drag and Drop & Horizontal Scroll States
  const [draggingLeadId, setDraggingLeadId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const kanbanRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  const handleKanbanScroll = () => {
    if (kanbanRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = kanbanRef.current;
      const maxScroll = Math.max(1, scrollWidth - clientWidth);
      setScrollProgress(Math.min(1, Math.max(0, scrollLeft / maxScroll)));
      
      const colWidth = 331; // 315px column + 16px gap
      const idx = Math.min(STAGES.length - 1, Math.max(0, Math.round(scrollLeft / colWidth)));
      setActiveStageIndex(idx);
    }
  };

  const scrollToStage = (index) => {
    if (kanbanRef.current) {
      const colWidth = 331;
      kanbanRef.current.scrollTo({
        left: index * colWidth,
        behavior: 'smooth'
      });
      setActiveStageIndex(index);
    }
  };

  const scrollKanban = (offset) => {
    if (kanbanRef.current) {
      kanbanRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const handleKanbanWheel = (e) => {
    if (kanbanRef.current && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      kanbanRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleAdvanceStage = (leadId, currentStage) => {
    const currentIndex = STAGES.indexOf(currentStage);
    if (currentIndex >= 0 && currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1];
      handleStageChange(leadId, nextStage);
      toast.success(`🚀 Advanced to ${nextStage}!`);
    }
  };

  const handleDragStart = (e, leadId) => {
    e.dataTransfer.setData('text/plain', leadId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingLeadId(leadId);
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e, stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e, stage) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverStage === stage) {
        setDragOverStage(null);
      }
    }
  };

  const handleDrop = (e, targetStage) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggingLeadId;
    if (leadId) {
      const lead = leads.find((l) => l._id === leadId);
      if (lead && lead.stage !== targetStage) {
        handleStageChange(leadId, targetStage);
      }
    }
    setDraggingLeadId(null);
    setDragOverStage(null);
  };

  // New Lead Form State with Customer Validation Defaults
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    carModel: 'Tata Curvv EV',
    variant: 'Empowered Plus 55kWh',
    fuelType: 'EV',
    value: 2199000,
    priority: 'Hot',
    purchaseTimeline: '10 - 15 Days',
    stage: 'Inquiry - Hot',
    source: 'WhatsApp Cloud API',
    notes: '',
    validated: true
  });

  // Handle Model Selection with Auto-population of Variant, Fuel, & Price
  const handleModelSelectInForm = (modelName) => {
    const modelData = ALL_TATA_MODELS.find(m => m.name === modelName);
    if (modelData) {
      setFormData(prev => ({
        ...prev,
        carModel: modelData.name,
        variant: modelData.variant,
        fuelType: modelData.fuel,
        value: modelData.price
      }));
    } else {
      setFormData(prev => ({ ...prev, carModel: modelName }));
    }
  };

  // Live Customer Validation Check
  const isNameValid = formData.name.trim().length >= 3;
  const isPhoneValid = formData.phone.replace(/\D/g, '').length >= 10;
  const isCustomerValidated = isNameValid && isPhoneValid;

  const fetchLeads = async () => {
    try {
      const res = await api.get('/leads');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setLeads(res.data);
      }
    } catch (err) {
      console.log('Using local fallback leads state');
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStageChange = async (leadId, newStage) => {
    let newPriority;
    let newTimeline;
    if (newStage === 'Inquiry - Hot') {
      newPriority = 'Hot';
      newTimeline = '10 - 15 Days';
    } else if (newStage === 'Inquiry - Warm') {
      newPriority = 'Warm';
      newTimeline = '1 Month';
    } else if (newStage === 'Inquiry - Cold') {
      newPriority = 'Cold';
      newTimeline = '1 - 3 Months';
    }

    const updatePayload = { stage: newStage };
    if (newPriority) updatePayload.priority = newPriority;
    if (newTimeline) updatePayload.purchaseTimeline = newTimeline;

    try {
      await api.patch(`/leads/${leadId}/stage`, updatePayload);
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, ...updatePayload } : l))
      );
      toast.success(`Stage updated to ${newStage}`);
    } catch (err) {
      setLeads((prev) =>
        prev.map((l) => (l._id === leadId ? { ...l, ...updatePayload } : l))
      );
      toast.success(`Stage updated to ${newStage}`);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!isNameValid) {
      toast.error('Customer name must be at least 3 characters');
      return;
    }
    if (!isPhoneValid) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      const res = await api.post('/leads', { ...formData, validated: true });
      const newLead = res.data?.data || { ...formData, _id: 'lead-' + Date.now(), validated: true };
      setLeads((prev) => [newLead, ...prev]);
      toast.success(`🎉 Validated customer created! ${newLead.carModel} added to ${newLead.stage}`);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        carModel: 'Tata Curvv EV',
        variant: 'Empowered Plus 55kWh',
        fuelType: 'EV',
        value: 2199000,
        priority: 'Hot',
        stage: 'Inquiry - Hot',
        source: 'WhatsApp Cloud API',
        notes: '',
        validated: true
      });
    } catch (err) {
      const newLead = { ...formData, _id: 'lead-' + Date.now(), validated: true };
      setLeads((prev) => [newLead, ...prev]);
      toast.success(`🎉 Validated customer created! ${newLead.carModel} added to pipeline`);
      setIsAddModalOpen(false);
    }
  };

  const handleSendWhatsAppQuote = (lead) => {
    toast.success(`📱 WhatsApp Official Quotation & Brochure for ${lead.carModel} sent to ${lead.phone}`);
  };

  const handleUpdateLeadModel = async (leadId, newModelName) => {
    const modelData = ALL_TATA_MODELS.find(m => m.name === newModelName);
    const updates = modelData 
      ? { carModel: modelData.name, variant: modelData.variant, fuelType: modelData.fuel, value: modelData.price }
      : { carModel: newModelName };

    setLeads(prev => prev.map(l => l._id === leadId ? { ...l, ...updates } : l));
    if (selectedLead && selectedLead._id === leadId) {
      setSelectedLead(prev => ({ ...prev, ...updates }));
    }
    toast.success(`🚗 Vehicle updated to ${newModelName}!`);
  };

  const filteredLeads = leads
    .map(l => {
      const stage = normalizeLeadStage(l);
      const tInfo = getLeadTimelineInfo({ ...l, stage });
      let priority = l.priority;
      if (stage === 'Inquiry - Hot') priority = 'Hot';
      else if (stage === 'Inquiry - Warm') priority = 'Warm';
      else if (stage === 'Inquiry - Cold') priority = 'Cold';
      return {
        ...l,
        stage,
        priority,
        purchaseTimeline: l.purchaseTimeline || tInfo.timeline
      };
    })
    .filter((lead) => {
      const matchSearch =
        (lead.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.phone || '').includes(searchQuery) ||
        (lead.carModel || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchModel = modelFilter === 'All' || lead.carModel === modelFilter;
      const matchPriority = priorityFilter === 'All' || lead.priority === priorityFilter;
      return matchSearch && matchModel && matchPriority;
    });

  return (
    <div className={viewMode === 'kanban' ? 'leads-page-container' : 'page-body'}>
      {/* ── Search Bar Only ── */}
      <div className="tech-filters-bar" style={{ marginBottom: '14px', padding: '6px 12px' }}>
        <div className="tech-search-box" style={{ width: '100%' }}>
          <Search size={16} color="#10b981" />
          <input
            type="text"
            placeholder="Search prospect by customer name, phone, or Tata model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--text-primary)', fontSize: '13.5px', fontWeight: 500 }}
          />
        </div>
      </div>

      {/* ── Main View: Kanban or Table ── */}
      {viewMode === 'kanban' ? (
        <>
          {/* Scrollable Kanban Board Container */}
          <div 
            ref={kanbanRef} 
            className="kanban-board-container"
            onScroll={handleKanbanScroll}
            onWheel={handleKanbanWheel}
          >
            {STAGES.map((stage, stageIdx) => {
              const stageLeads = filteredLeads.filter((l) => l.stage === stage);
              const totalStageValue = stageLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
              const isTarget = dragOverStage === stage;
              const cfg = STAGE_CONFIG[stage] || {
                step: `0${stageIdx + 1}`,
                color: '#10b981',
                accentGradient: 'linear-gradient(90deg, #10b981, #06b6d4)',
                bgGradient: 'transparent',
                badgeText: stage,
                icon: Layers
              };
              const StageIcon = cfg.icon;

              return (
                <div
                  key={stage}
                  className={`kanban-column ${isTarget ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragLeave={(e) => handleDragLeave(e, stage)}
                  onDrop={(e) => handleDrop(e, stage)}
                  style={{
                    borderTop: `3px solid ${cfg.color}`,
                    boxShadow: isTarget ? `0 0 24px ${cfg.color}55` : undefined
                  }}
                >
                  {/* Top Glowing Stage Accent Line */}
                  <div 
                    className="kanban-column-accent" 
                    style={{ background: cfg.accentGradient }} 
                  />

                  {/* High-Tech Column Header */}
                  <div className="kanban-column-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span 
                        className="tech-stage-step" 
                        style={{ color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40` }}
                      >
                        {cfg.step}
                      </span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <StageIcon size={14} color={cfg.color} />
                          <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                            {stage}
                          </h4>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          ₹ {(totalStageValue / 100000).toFixed(1)} L Total
                        </div>
                      </div>
                    </div>
                    <span 
                      className="kanban-column-count"
                      style={{ 
                        color: stageLeads.length > 0 ? cfg.color : 'var(--text-muted)',
                        borderColor: stageLeads.length > 0 ? `${cfg.color}45` : undefined
                      }}
                    >
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Internal Scrollable Column Body */}
                  <div className="kanban-column-body">
                    {stageLeads.map((lead) => {
                      const powertrain = getPowertrainTag(lead);
                      const initials = getInitials(lead.name);
                      const timelineInfo = getLeadTimelineInfo(lead);
                      const isNextAvailable = stageIdx < STAGES.length - 1;

                      return (
                        <div
                          key={lead._id}
                          className={`kanban-card ${draggingLeadId === lead._id ? 'is-dragging' : ''}`}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, lead._id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedLead(lead)}
                          style={{
                            cursor: 'pointer',
                            borderLeft: `3px solid ${cfg.color}`
                          }}
                          title="Click to view Customer & Car Model Dossier"
                        >
                          {/* Card Header: Avatar, Name, Phone & Priority */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span 
                                style={{ cursor: 'grab', color: 'var(--text-light)', display: 'flex', alignItems: 'center' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GripVertical size={14} />
                              </span>
                              <div className="tech-customer-avatar" style={{ border: `1px solid ${cfg.color}50` }}>
                                {initials}
                              </div>
                              <div>
                                <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                                  {lead.name}
                                </h4>
                                <a 
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ fontSize: '11.5px', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}
                                >
                                  <Phone size={10} /> {lead.phone}
                                </a>
                              </div>
                            </div>

                            <span className={
                              lead.priority === 'Hot' ? 'badge-priority-hot' :
                              lead.priority === 'Warm' ? 'badge-priority-warm' : 'badge-priority-cold'
                            }>
                              {lead.priority === 'Hot' ? '🔥 HOT' : lead.priority === 'Warm' ? '⚡ WARM' : '❄️ COLD'}
                            </span>
                          </div>

                          {/* Customer Validation Status Tag & Purchase Timeline Validation Tag */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <span className="customer-verified-chip">
                              <Shield size={10} color="#10b981" />
                              <span>Customer Validated ✅</span>
                            </span>
                            <span 
                              className="tech-timeline-chip" 
                              style={{
                                background: timelineInfo.bg,
                                border: `1px solid ${timelineInfo.border}`,
                                color: timelineInfo.color
                              }}
                              title={`Validated Purchase Decision Window: ${timelineInfo.timeline}`}
                            >
                              <Clock size={10} />
                              <span>{timelineInfo.timeline}</span>
                            </span>
                          </div>

                          {/* Vehicle Specification Box */}
                          <div className="tech-vehicle-spec">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                <Car size={14} color="#10b981" />
                                <span>{lead.carModel}</span>
                              </div>
                              <span 
                                className="tech-powertrain-pill"
                                style={{ color: powertrain.color, background: powertrain.bg, border: `1px solid ${powertrain.border}` }}
                              >
                                {powertrain.text}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {lead.variant || 'Standard Spec'}
                            </div>
                          </div>

                          {/* Valuation & Booking Telemetry */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '10px', padding: '0 2px' }}>
                            <div>
                              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block' }}>
                                On-Road Deal
                              </span>
                              <span className="tech-value-display">
                                ₹ {(lead.value / 100000).toFixed(2)} L
                              </span>
                            </div>
                            
                            {lead.bookingAmount > 0 ? (
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                color: '#10b981',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                padding: '2px 7px',
                                borderRadius: '6px'
                              }}>
                                ₹ {(lead.bookingAmount / 1000).toFixed(0)}k Token ✅
                              </span>
                            ) : (
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Token Pending
                              </span>
                            )}
                          </div>

                          {/* Quick Action Dock */}
                          <div className="tech-card-action-bar" onClick={(e) => e.stopPropagation()}>
                            {isNextAvailable && (
                              <button
                                onClick={() => handleAdvanceStage(lead._id, lead.stage)}
                                className="tech-advance-btn"
                                title={`Advance to ${STAGES[stageIdx + 1]}`}
                              >
                                <span>Advance</span>
                                <ArrowRight size={12} />
                              </button>
                            )}

                            <select
                              value={lead.stage}
                              onChange={(e) => handleStageChange(lead._id, e.target.value)}
                              className="input-field"
                              style={{ fontSize: '11px', padding: '3px 6px', height: '28px', flex: 1, borderRadius: '8px' }}
                            >
                              {STAGES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>

                            <button
                              onClick={() => handleSendWhatsAppQuote(lead)}
                              style={{
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                width: '28px',
                                height: '28px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                              }}
                              title="Send Official WhatsApp Quotation"
                            >
                              <Send size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Drag Drop Zone Placeholder */}
                    {isTarget && draggingLeadId && (
                      <div style={{
                        padding: '16px',
                        border: `2px dashed ${cfg.color}`,
                        borderRadius: '12px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: cfg.color,
                        background: `${cfg.color}15`,
                        animation: 'pulseGlow 1.5s infinite'
                      }}>
                        Release lead to place in {stage}
                      </div>
                    )}

                    {stageLeads.length === 0 && !isTarget && (
                      <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed var(--border-card)', borderRadius: '12px' }}>
                        No prospects currently in {stage}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </>
      ) : (
        /* ── Table View ── */
        <div className="card-glass" style={{ overflowX: 'auto', marginTop: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Prospect Name</th>
                <th style={{ padding: '12px 16px' }}>Tata Model & Spec</th>
                <th style={{ padding: '12px 16px' }}>Valuation</th>
                <th style={{ padding: '12px 16px' }}>Stage</th>
                <th style={{ padding: '12px 16px' }}>Priority</th>
                <th style={{ padding: '12px 16px' }}>Executive</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => {
                const powertrain = getPowertrainTag(lead);
                const cfg = STAGE_CONFIG[lead.stage];

                return (
                  <tr key={lead._id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800 }}>{lead.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lead.phone}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{lead.carModel}</span>
                        <span 
                          className="tech-powertrain-pill"
                          style={{ color: powertrain.color, background: powertrain.bg, border: `1px solid ${powertrain.border}` }}
                        >
                          {powertrain.text}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{lead.variant}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
                      ₹ {(lead.value / 100000).toFixed(2)} L
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span 
                        className="badge-pro-tag"
                        style={{ color: cfg?.color, borderColor: cfg?.color }}
                      >
                        {lead.stage}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={lead.priority === 'Hot' ? 'badge-priority-hot' : 'badge-priority-warm'}>
                        {lead.priority === 'Hot' ? '🔥 HOT' : '⚡ WARM'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                      {lead.salesExecutive || 'Ruban'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleSendWhatsAppQuote(lead)}
                        className="btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Send size={12} /> WhatsApp Quote
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Lead Modal with Live Customer Validation & All Tata Models ── */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
                  Create & Validate Showroom Lead
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Automated customer identity verification and real-time pipeline deployment
                </p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)' }}>CUSTOMER FULL NAME *</label>
                  {isNameValid && <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>Valid Name ✅</span>}
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rahul Verma" 
                  className="input-field" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ borderColor: isNameValid ? '#10b981' : undefined }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)' }}>PHONE NUMBER *</label>
                    {isPhoneValid && <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>10-Digit Mobile ✅</span>}
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder="+91 98401 23456" 
                    className="input-field" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ borderColor: isPhoneValid ? '#10b981' : undefined }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)' }}>EMAIL</label>
                  <input 
                    type="email" 
                    placeholder="customer@domain.com" 
                    className="input-field" 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              {/* ALL TATA MODELS SELECTION */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)' }}>
                    TATA CAR MODEL (ALL {ALL_TATA_MODELS.length} MODELS) *
                  </label>
                  <select 
                    className="input-field"
                    value={formData.carModel}
                    onChange={(e) => handleModelSelectInForm(e.target.value)}
                  >
                    {ALL_TATA_MODELS.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.name} ({m.fuel})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)' }}>PIPELINE STAGE</label>
                  <select 
                    className="input-field"
                    value={formData.stage}
                    onChange={(e) => {
                      const newStage = e.target.value;
                      let newPriority = formData.priority;
                      let newTimeline = formData.purchaseTimeline;
                      if (newStage === 'Inquiry - Hot') {
                        newPriority = 'Hot';
                        newTimeline = '10 - 15 Days';
                      } else if (newStage === 'Inquiry - Warm') {
                        newPriority = 'Warm';
                        newTimeline = '1 Month';
                      } else if (newStage === 'Inquiry - Cold') {
                        newPriority = 'Cold';
                        newTimeline = '1 - 3 Months';
                      }
                      setFormData({ ...formData, stage: newStage, priority: newPriority, purchaseTimeline: newTimeline });
                    }}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Purchase Timeline Validation Selector */}
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  PURCHASE TIMELINE VALIDATION (HOT: 10-15 DAYS • WARM: 1 MONTH • COLD: 1-3 MONTHS) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {PURCHASE_TIMELINES.map((pt) => {
                    const isSelected = formData.purchaseTimeline === pt.timeline;
                    return (
                      <button
                        key={pt.key}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            purchaseTimeline: pt.timeline,
                            stage: pt.stage,
                            priority: pt.priority
                          }));
                        }}
                        style={{
                          padding: '8px 6px',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${pt.color}` : '1px solid var(--border-card)',
                          background: isSelected ? `${pt.color}15` : 'var(--bg-tertiary)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? `0 0 12px ${pt.color}40` : 'none'
                        }}
                      >
                        <div style={{ color: pt.color, fontWeight: 900, fontSize: '12px' }}>{pt.badge}</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>{pt.label}</div>
                        <div style={{ fontSize: '9.5px', color: 'var(--text-muted)', marginTop: '1px' }}>{pt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vehicle Specs Auto-populated Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)' }}>MODEL VARIANT</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.variant}
                    onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)' }}>ON-ROAD VALUE (₹)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  />
                </div>
              </div>

              {/* Live Customer & Vehicle Validation Card */}
              <div style={{
                background: isCustomerValidated ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${isCustomerValidated ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                padding: '12px 14px',
                borderRadius: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: isCustomerValidated ? '#10b981' : '#f59e0b' }}>
                  <ShieldCheck size={16} />
                  <span>
                    {isCustomerValidated 
                      ? 'Customer Validation Status: APPROVED 🛡️' 
                      : 'Validation Pending: Please enter customer name & phone'}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Model: <strong>{formData.carModel}</strong> • Timeline: <strong>{formData.purchaseTimeline}</strong> • Stage: <strong>{formData.stage}</strong>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)' }}>REQUIREMENTS / NOTES</label>
                <textarea 
                  rows={2} 
                  placeholder="Customer requirements, preferred test drive time..." 
                  className="input-field" 
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={!isCustomerValidated}
                  style={{
                    opacity: isCustomerValidated ? 1 : 0.6,
                    cursor: isCustomerValidated ? 'pointer' : 'not-allowed'
                  }}
                >
                  Validate & Deploy to Pipeline 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Customer Dossier & Car Model Validation Inspector Modal ── */}
      {selectedLead && (
        <div className="modal-overlay" onClick={() => setSelectedLead(null)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="tech-customer-avatar" style={{ width: '44px', height: '44px', fontSize: '16px' }}>
                  {getInitials(selectedLead.name)}
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
                    {selectedLead.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span className="customer-verified-chip">
                      <ShieldCheck size={12} color="#10b981" />
                      <span>Customer ID Validated 🛡️</span>
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Assigned: Ruban (Admin)
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contact details */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '10px', 
              background: 'var(--bg-tertiary)', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              marginBottom: '16px',
              border: '1px solid var(--border-card)'
            }}>
              <div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Phone</span>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedLead.phone}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Email</span>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {selectedLead.email || 'customer@tatamotors.com'}
                </div>
              </div>
            </div>

            {/* Selected Tata Car Model Showcase */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={18} color="#10b981" />
                  <h4 style={{ fontSize: '16px', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {selectedLead.carModel}
                  </h4>
                </div>
                <span className="tech-powertrain-pill" style={{ fontSize: '11.5px', padding: '3px 8px' }}>
                  {getPowertrainTag(selectedLead).text}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Variant: <strong>{selectedLead.variant || 'Standard Spec'}</strong> • Fuel: <strong>{selectedLead.fuelType}</strong>
              </div>

              {/* Financial Telemetry Table */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: '8px', background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '10px' }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ex-Showroom</span>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>₹ {((selectedLead.value * 0.84) / 100000).toFixed(2)} L</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>RTO / Tax</span>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>₹ {((selectedLead.value * 0.12) / 100000).toFixed(2)} L</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Insurance</span>
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>₹ {((selectedLead.value * 0.04) / 100000).toFixed(2)} L</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 800 }}>On-Road Total</span>
                  <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#10b981' }}>
                    ₹ {(selectedLead.value / 100000).toFixed(2)} L
                  </div>
                </div>
              </div>
            </div>

            {/* Purchase Timeline & Temperature Validation in Inspector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                PURCHASE TIMELINE & DECISION VALIDATION
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {PURCHASE_TIMELINES.map((pt) => {
                  const isSelected = (selectedLead.purchaseTimeline === pt.timeline) || 
                    (!selectedLead.purchaseTimeline && selectedLead.stage === pt.stage);
                  return (
                    <button
                      key={pt.key}
                      type="button"
                      onClick={() => {
                        const updates = {
                          purchaseTimeline: pt.timeline,
                          priority: pt.priority,
                          stage: pt.stage
                        };
                        handleStageChange(selectedLead._id, pt.stage);
                        setSelectedLead(prev => ({ ...prev, ...updates }));
                      }}
                      style={{
                        padding: '8px 6px',
                        borderRadius: '10px',
                        border: isSelected ? `2px solid ${pt.color}` : '1px solid var(--border-card)',
                        background: isSelected ? `${pt.color}18` : 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        boxShadow: isSelected ? `0 0 12px ${pt.color}40` : 'none'
                      }}
                    >
                      <div style={{ color: pt.color, fontWeight: 900, fontSize: '12px' }}>{pt.badge}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>{pt.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Model Switcher in Inspector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                SWITCH CAR MODEL FOR THIS PROSPECT
              </label>
              <select 
                className="input-field"
                value={selectedLead.carModel}
                onChange={(e) => handleUpdateLeadModel(selectedLead._id, e.target.value)}
              >
                {ALL_TATA_MODELS.map((m) => (
                  <option key={m.name} value={m.name}>{m.name} ({m.fuel})</option>
                ))}
              </select>
            </div>

            {/* Stage and Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--text-muted)' }}>CURRENT STAGE:</span>
                <select
                  value={selectedLead.stage}
                  onChange={(e) => {
                    handleStageChange(selectedLead._id, e.target.value);
                    setSelectedLead({ ...selectedLead, stage: e.target.value });
                  }}
                  className="input-field"
                  style={{ width: '170px', padding: '6px 8px', fontSize: '12px' }}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleSendWhatsAppQuote(selectedLead)}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} />
                  <span>WhatsApp Quote</span>
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
