"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2, Phone, Mail, Search } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: 'CONSULTATION' | 'SURVEY' | 'DESIGN_MEETING' | 'DESIGN_PRESENTATION' | 'FOLLOW_UP' | 'INTERNAL_MEETING' | 'OTHER';
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  location?: string;
  customerId?: string; // Required for non-internal events
  customerName?: string;
  attendees: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  projectId?: string;
  clientId?: string;
  createdBy: {
    id: string;
    name: string;
  };
  assignedTo: {
    id: string;
    name: string;
    role: string;
  };
}

const eventTypeColors = {
  CONSULTATION: 'bg-blue-100 text-blue-800 border-blue-200',
  SURVEY: 'bg-green-100 text-green-800 border-green-200',
  DESIGN_MEETING: 'bg-purple-100 text-purple-800 border-purple-200',
  DESIGN_PRESENTATION: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  FOLLOW_UP: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  INTERNAL_MEETING: 'bg-gray-100 text-gray-800 border-gray-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
};

// Default durations in minutes for each event type
const defaultDurations = {
  CONSULTATION: 60,        // 1 hour
  SURVEY: 60,             // 1 hour  
  DESIGN_MEETING: 90,     // 1.5 hours
  DESIGN_PRESENTATION: 120, // 2 hours
  FOLLOW_UP: 5,           // 5 minutes
  INTERNAL_MEETING: 60,   // 1 hour
  OTHER: 60,              // 1 hour default
};

// Default descriptions for each event type
const defaultDescriptions = {
  CONSULTATION: 'Design consultation to discuss bathroom renovation requirements, budget, and timeline.',
  SURVEY: 'Detailed site survey to measure space, assess plumbing, and identify any potential challenges.',
  DESIGN_MEETING: 'Collaborative design session to review layouts, select fixtures, and finalise design concepts.',
  DESIGN_PRESENTATION: 'Presentation of final design proposals with 3D visualisations and material selections.',
  FOLLOW_UP: 'Follow-up call to chase enquiry and discuss next steps in the process.',
  INTERNAL_MEETING: 'Internal team meeting to discuss projects, planning, and coordination.',
  OTHER: 'General appointment or meeting.',
};

// Default titles for each event type
const getDefaultTitle = (eventType: CalendarEvent['type']) => {
  const titles = {
    CONSULTATION: 'Design Consultation',
    SURVEY: 'Site Survey',
    DESIGN_MEETING: 'Design Meeting',
    DESIGN_PRESENTATION: 'Design Presentation',
    FOLLOW_UP: 'Follow-up Call',
    INTERNAL_MEETING: 'Internal Meeting',
    OTHER: '', // Only OTHER requires custom title
  };
  return titles[eventType];
};

// Mock address suggestions for autocomplete
const mockAddressSuggestions = [
  "123 High Street, Manchester, M1 1AA",
  "456 Queen's Road, Liverpool, L1 8JQ",
  "789 King Street, Birmingham, B1 2AA",
  "321 Victoria Avenue, Leeds, LS1 6DL",
  "654 Church Lane, Sheffield, S1 2HE",
  "987 Market Square, Newcastle, NE1 4XF",
  "147 Crown Street, Bristol, BS1 5TR",
  "258 Oxford Road, Manchester, M13 9GP",
  "369 Park Lane, London, W1K 1BE",
  "741 Mill Road, Cambridge, CB1 2AD"
];

// Mock customers for selection (with addresses)
const mockCustomers = [
  { id: '1', name: 'John Doe', email: 'john.doe@email.com', phone: '07123 456789', address: '123 High Street, Manchester, M1 1AA' },
  { id: '2', name: 'Emma Williams', email: 'emma.williams@email.com', phone: '07234 567890', address: '456 Queen\'s Road, Liverpool, L1 8JQ' },
  { id: '3', name: 'Sarah Johnson', email: 'sarah.johnson@email.com', phone: '07345 678901', address: '789 King Street, Birmingham, B1 2AA' },
  { id: '4', name: 'Michael Brown', email: 'michael.brown@email.com', phone: '07456 789012', address: '321 Victoria Avenue, Leeds, LS1 6DL' },
  { id: '5', name: 'Lisa Davis', email: 'lisa.davis@email.com', phone: '07567 890123', address: '654 Church Lane, Sheffield, S1 2HE' },
  { id: '6', name: 'Robert Wilson', email: 'robert.wilson@email.com', phone: '07678 901234', address: '987 Market Square, Newcastle, NE1 4XF' },
  { id: '7', name: 'Jennifer Taylor', email: 'jennifer.taylor@email.com', phone: '07789 012345', address: '147 Crown Street, Bristol, BS1 5TR' },
  { id: '8', name: 'David Anderson', email: 'david.anderson@email.com', phone: '07890 123456', address: '258 Oxford Road, Manchester, M13 9GP' },
];

// Mock users/staff for assignment
const mockUsers = [
  { id: '1', name: 'James Smith', role: 'Sales Manager', email: 'james.smith@bowmanbathrooms.com' },
  { id: '2', name: 'Mike Wilson', role: 'Surveyor', email: 'mike.wilson@bowmanbathrooms.com' },
  { id: '3', name: 'Sarah Johnson', role: 'Sales Representative', email: 'sarah.johnson@bowmanbathrooms.com' },
  { id: '4', name: 'David Brown', role: 'Project Manager', email: 'david.brown@bowmanbathrooms.com' },
  { id: '5', name: 'Emma Davis', role: 'Designer', email: 'emma.davis@bowmanbathrooms.com' },
  { id: '6', name: 'Tom Williams', role: 'Sales Representative', email: 'tom.williams@bowmanbathrooms.com' },
  { id: '7', name: 'Lisa Thompson', role: 'Install Manager', email: 'lisa.thompson@bowmanbathrooms.com' },
  { id: '8', name: 'Mark Taylor', role: 'Director', email: 'mark.taylor@bowmanbathrooms.com' },
];

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  className?: string;
}

interface CustomerAutocompleteProps {
  value: string;
  onSelect: (customerId: string, customerName: string, customerAddress?: string) => void;
  placeholder: string;
  required?: boolean;
  className?: string;
}

// Function to round time to quarter hour intervals
const roundToQuarterHour = (dateTimeString: string) => {
  if (!dateTimeString) return '';
  
  // Parse the datetime-local string directly
  const [date, time] = dateTimeString.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  
  // Create date object using local time components
  const dateObj = new Date(year, month - 1, day, hour, minute, 0, 0);
  
  // Round minutes to nearest 15-minute interval
  const roundedMinutes = Math.round(minute / 15) * 15;
  
  if (roundedMinutes === 60) {
    dateObj.setHours(hour + 1, 0, 0, 0);
  } else {
    dateObj.setMinutes(roundedMinutes, 0, 0);
  }
  
  // Format back to datetime-local format
  const resultYear = dateObj.getFullYear();
  const resultMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
  const resultDay = String(dateObj.getDate()).padStart(2, '0');
  const resultHour = String(dateObj.getHours()).padStart(2, '0');
  const resultMinute = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${resultYear}-${resultMonth}-${resultDay}T${resultHour}:${resultMinute}`;
};

interface QuarterHourTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  min?: string;
  required?: boolean;
  id?: string;
}

function QuarterHourTimeInput({ value, onChange, className, min, required, id }: QuarterHourTimeInputProps) {
  const [dateValue, setDateValue] = useState('');
  const [hourValue, setHourValue] = useState('');
  const [minuteValue, setMinuteValue] = useState('');
  
  useEffect(() => {
    if (value) {
      const [date, time] = value.split('T');
      setDateValue(date);
      if (time) {
        const [hour, minute] = time.split(':');
        setHourValue(hour);
        setMinuteValue(minute);
      }
    }
  }, [value]);

  const handleChange = () => {
    if (dateValue && hourValue && minuteValue) {
      onChange(`${dateValue}T${hourValue}:${minuteValue}`);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    if (newDate && hourValue && minuteValue) {
      onChange(`${newDate}T${hourValue}:${minuteValue}`);
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    setHourValue(newHour);
    if (dateValue && newHour && minuteValue) {
      onChange(`${dateValue}T${newHour}:${minuteValue}`);
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    setMinuteValue(newMinute);
    if (dateValue && hourValue && newMinute) {
      onChange(`${dateValue}T${hourValue}:${newMinute}`);
    }
  };

  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    const displayHour = i === 0 ? '12 AM' : i === 12 ? '12 PM' : i < 12 ? `${i} AM` : `${i - 12} PM`;
    return { value: hour, label: displayHour };
  });

  // Only quarter-hour minute options
  const minuteOptions = [
    { value: '00', label: '00' },
    { value: '15', label: '15' },
    { value: '30', label: '30' },
    { value: '45', label: '45' }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Date picker on top */}
      <div>
        <Input
          type="date"
          value={dateValue}
          onChange={handleDateChange}
          min={min ? min.split('T')[0] : undefined}
          required={required}
          className="text-sm w-full"
        />
      </div>
      
      {/* Time pickers in a row below */}
      <div className="grid grid-cols-2 gap-3">
        <select
          value={hourValue}
          onChange={handleHourChange}
          required={required}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full min-w-0"
        >
          <option value="">Hour</option>
          {hourOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={minuteValue}
          onChange={handleMinuteChange}
          required={required}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full min-w-0"
        >
          <option value="" disabled>Min</option>
          {minuteOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AddressAutocomplete({ value, onChange, placeholder, required, className }: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.length > 2) {
      const filtered = mockAddressSuggestions.filter(address =>
        address.toLowerCase().includes(newValue.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={className}
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-900">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomerAutocomplete({ value, onSelect, placeholder, required, className }: CustomerAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<typeof mockCustomers>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Find customer name from ID
  useEffect(() => {
    const customer = mockCustomers.find(c => c.id === value);
    setInputValue(customer ? `${customer.name} - ${customer.email}` : '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (newValue.length > 1) {
      const filtered = mockCustomers.filter(customer =>
        customer.name.toLowerCase().includes(newValue.toLowerCase()) ||
        customer.email.toLowerCase().includes(newValue.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 8));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      onSelect('', '', ''); // Clear selection if input is too short
    }
  };

  const handleSuggestionClick = (customer: typeof mockCustomers[0]) => {
    setInputValue(`${customer.name} - ${customer.email}`);
    onSelect(customer.id, customer.name, customer.address);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={className}
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => handleSuggestionClick(customer)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  <div className="text-xs text-gray-500">{customer.email}</div>
                  {customer.address && (
                    <div className="text-xs text-gray-400 mt-1">{customer.address}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // June 2025
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFromPlusButton, setIsFromPlusButton] = useState(false);
  const [filterByUser, setFilterByUser] = useState<string>('all'); // 'all' or specific user ID

  // Get current user info (default to James Smith as session user)
  const currentUser = session?.user ? {
    id: session.user.id || '1',
    name: session.user.name || 'James Smith',
    role: 'Sales Manager'
  } : mockUsers[0]; // Default to first user

  // Initialize filter based on user role
  useEffect(() => {
    if (currentUser.role === 'Sales Representative') {
      // Sales reps should only see their own events by default
      setFilterByUser(currentUser.id);
    }
    // Directors and managers start with 'all' by default
  }, [currentUser.id, currentUser.role]);

  const [newEvent, setNewEvent] = useState({
    title: getDefaultTitle('CONSULTATION'),
    description: defaultDescriptions.CONSULTATION,
    startDate: '',
    endDate: '',
    type: 'CONSULTATION' as CalendarEvent['type'],
    location: '',
    customerId: '',
    customerName: '',
    projectId: '',
    clientId: '',
    assignedTo: currentUser.id, // Default to current user
  });

  useEffect(() => {
    fetchEvents();
  }, []); // Only fetch once on mount

  useEffect(() => {
    // Close context menu when clicking outside
    const handleClickOutside = () => {
      setShowContextMenu(false);
    };
    
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  const fetchEvents = async () => {
    try {
      // Mock data for demonstration with customer names
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Design Consultation',
          description: 'Discuss requirements and budget for main bathroom renovation',
          startDate: new Date(2025, 5, 29, 10, 0).toISOString(),
          endDate: new Date(2025, 5, 29, 12, 0).toISOString(),
          type: 'CONSULTATION',
          status: 'CONFIRMED',
          location: '123 Main St, London, SW1A 1AA',
          customerId: '1',
          customerName: 'John Doe',
          attendees: [
            { id: '1', name: 'James Smith', email: 'james.smith@bowmanbathrooms.com', role: 'Sales Manager' },
            { id: '2', name: 'John Doe', email: 'john.doe@email.com', role: 'Client' },
          ],
          projectId: '1',
          clientId: '1',
          createdBy: { id: '1', name: 'James Smith' },
          assignedTo: { id: '1', name: 'James Smith', role: 'Sales Manager' },
        },
        {
          id: '2',
          title: 'Site Survey',
          description: 'Measure bathroom space and assess plumbing',
          startDate: new Date(2025, 5, 30, 14, 0).toISOString(),
          endDate: new Date(2025, 5, 30, 16, 0).toISOString(),
          type: 'SURVEY',
          status: 'SCHEDULED',
          location: '456 Oak Avenue, Manchester, M1 1AA',
          customerId: '2',
          customerName: 'Emma Williams',
          attendees: [
            { id: '3', name: 'Mike Wilson', email: 'mike.wilson@bowmanbathrooms.com', role: 'Surveyor' },
            { id: '4', name: 'Emma Williams', email: 'emma.williams@email.com', role: 'Client' },
          ],
          projectId: '2',
          clientId: '2',
          createdBy: { id: '1', name: 'James Smith' },
          assignedTo: { id: '2', name: 'Mike Wilson', role: 'Surveyor' },
        },
        {
          id: '3',
          title: 'Design Review',
          description: 'Review initial design concepts and finalize selections',
          startDate: new Date(2025, 6, 2, 9, 0).toISOString(),
          endDate: new Date(2025, 6, 2, 11, 0).toISOString(),
          type: 'DESIGN_MEETING',
          status: 'CONFIRMED',
          location: 'Bowman Bathrooms Showroom, Altrincham',
          customerId: '3',
          customerName: 'Sarah Johnson',
          attendees: [
            { id: '1', name: 'James Smith', email: 'james.smith@bowmanbathrooms.com', role: 'Sales Manager' },
            { id: '5', name: 'Sarah Johnson', email: 'sarah.johnson@email.com', role: 'Client' },
          ],
          projectId: '3',
          clientId: '3',
          createdBy: { id: '1', name: 'James Smith' },
          assignedTo: { id: '5', name: 'Emma Davis', role: 'Designer' },
        },
        {
          id: '4',
          title: 'Follow-up Call',
          description: 'Check satisfaction and discuss any concerns',
          startDate: new Date(2025, 5, 30, 16, 0).toISOString(),
          endDate: new Date(2025, 5, 30, 16, 30).toISOString(),
          type: 'FOLLOW_UP',
          status: 'SCHEDULED',
          location: 'Phone call',
          customerId: '2',
          customerName: 'Emma Williams',
          attendees: [
            { id: '1', name: 'James Smith', email: 'james.smith@bowmanbathrooms.com', role: 'Sales Manager' },
            { id: '4', name: 'Emma Williams', email: 'emma.williams@email.com', role: 'Client' },
          ],
          projectId: '2',
          clientId: '2',
          createdBy: { id: '1', name: 'James Smith' },
          assignedTo: { id: '1', name: 'James Smith', role: 'Sales Manager' },
        },
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug logging
    console.log('=== CREATE EVENT DEBUG ===');
    console.log('Event data:', newEvent);
    console.log('Start date:', newEvent.startDate);
    console.log('End date:', newEvent.endDate);
    console.log('Event type:', newEvent.type);
    console.log('Customer ID:', newEvent.customerId);
    console.log('Location:', newEvent.location);
    console.log('=== END DEBUG ===');
    
    // Validate required fields
    if (!newEvent.startDate || !newEvent.endDate) {
      alert('Please select start and end dates');
      return;
    }
    
    // Check if title is required for OTHER event type
    if (newEvent.type === 'OTHER' && !newEvent.title.trim()) {
      alert('Please enter a title for OTHER event type');
      return;
    }
    
    // Check if customer is required for this event type
    if (isCustomerRequired(newEvent.type) && !newEvent.customerId.trim()) {
      alert(`Customer selection is required for ${newEvent.type.toLowerCase().replace('_', ' ')}`);
      return;
    }
    
    // Check if location is required for this event type
    if (isLocationRequired(newEvent.type) && !newEvent.location.trim()) {
      alert(`Location is required for ${newEvent.type.toLowerCase().replace('_', ' ')}`);
      return;
    }

    try {
      // Find assigned user details
      const assignedUser = mockUsers.find(user => user.id === newEvent.assignedTo) || currentUser;
      
      const eventData: CalendarEvent = {
        id: Math.random().toString(),
        ...newEvent,
        title: newEvent.title || getDefaultTitle(newEvent.type), // Use default title if empty
        status: 'SCHEDULED',
        attendees: [
          { id: session?.user?.id || 'unknown', name: session?.user?.name || '', email: session?.user?.email || '', role: 'Organizer' }
        ],
        createdBy: { id: session?.user?.id || 'unknown', name: session?.user?.name || '' },
        assignedTo: { id: assignedUser.id, name: assignedUser.name, role: assignedUser.role },
      };

      setEvents(prev => [...prev, eventData]);
      setShowAddForm(false);
      setNewEvent({
        title: getDefaultTitle('CONSULTATION'),
        description: defaultDescriptions.CONSULTATION,
        startDate: '',
        endDate: '',
        type: 'CONSULTATION',
        location: '',
        customerId: '',
        customerName: '',
        projectId: '',
        clientId: '',
        assignedTo: currentUser.id,
      });
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    setSelectedEvent(null);
  };

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (viewMode === 'month') {
        if (direction === 'prev') {
          newDate.setMonth(prev.getMonth() - 1);
        } else {
          newDate.setMonth(prev.getMonth() + 1);
        }
      } else if (viewMode === 'week') {
        if (direction === 'prev') {
          newDate.setDate(prev.getDate() - 7);
        } else {
          newDate.setDate(prev.getDate() + 7);
        }
      } else if (viewMode === 'day') {
        if (direction === 'prev') {
          newDate.setDate(prev.getDate() - 1);
        } else {
          newDate.setDate(prev.getDate() + 1);
        }
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date(2025, 5, 28)); // June 28, 2025
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (date: Date, day: number) => {
    const today = new Date(2025, 5, 28); // June 28, 2025
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           day === today.getDate();
  };

  const getEventsForDate = (date: Date, day: number, isCurrentMonth: boolean = true) => {
    let targetDate: Date;
    
    if (isCurrentMonth) {
      targetDate = new Date(date.getFullYear(), date.getMonth(), day);
    } else {
      // Handle previous/next month dates
      const firstDay = getFirstDayOfMonth(date);
      if (day > 15) {
        // This is a date from the previous month
        targetDate = new Date(date.getFullYear(), date.getMonth() - 1, day);
      } else {
        // This is a date from the next month
        targetDate = new Date(date.getFullYear(), date.getMonth() + 1, day);
      }
    }
    
    const filteredEvents = getFilteredEvents();
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getFullYear() === targetDate.getFullYear() &&
             eventDate.getMonth() === targetDate.getMonth() &&
             eventDate.getDate() === targetDate.getDate();
    });
  };

  const handleLeftClick = (e: React.MouseEvent, day: number, isCurrentMonth: boolean = true) => {
    let clickedDate: Date;
    
    if (isCurrentMonth) {
      clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    } else {
      // Handle previous/next month dates
      const firstDay = getFirstDayOfMonth(currentDate);
      if (day > 15) {
        // This is a date from the previous month
        clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
      } else {
        // This is a date from the next month
        clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
      }
    }
    
    setSelectedDate(clickedDate);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setIsFromPlusButton(false);
    setShowContextMenu(true);
  };

  const handleContextMenuAction = (eventType: CalendarEvent['type'], isFromPlusButton = false) => {
    if (!selectedDate) return;
    
    const businessHours = getBusinessHours();
    const now = new Date(2025, 5, 28); // Current date: June 28, 2025 (Saturday)
    let defaultStart: Date;
    
    if (isFromPlusButton) {
      // Plus button: Use business rules for next available slot
      defaultStart = new Date(now);
      
      // Move to next business day (Monday if today is Saturday)
      if (defaultStart.getDay() === 6) { // Saturday
        defaultStart.setDate(defaultStart.getDate() + 2); // Move to Monday
      } else if (defaultStart.getDay() === 0) { // Sunday
        defaultStart.setDate(defaultStart.getDate() + 1); // Move to Monday
      } else {
        // Weekday - check if we can schedule today or need next day
        if (defaultStart.getHours() >= businessHours.end - 1) {
          // Too late today, move to next business day
          defaultStart.setDate(defaultStart.getDate() + 1);
          // Skip Sunday if we land on it
          if (defaultStart.getDay() === 0) {
            defaultStart.setDate(defaultStart.getDate() + 1);
          }
        }
      }
      
      // Set to business hours start
      defaultStart.setHours(businessHours.start, 0, 0, 0);
    } else {
      // Calendar day click: Use the selected date
      defaultStart = new Date(selectedDate);
      
      // If the selected date is in the past, move to next business day
      if (selectedDate < now) {
        defaultStart = new Date(now);
        if (defaultStart.getDay() === 6) { // Saturday
          defaultStart.setDate(defaultStart.getDate() + 2); // Move to Monday
        } else if (defaultStart.getDay() === 0) { // Sunday
          defaultStart.setDate(defaultStart.getDate() + 1); // Move to Monday
        } else {
          defaultStart.setDate(defaultStart.getDate() + 1);
          if (defaultStart.getDay() === 0) {
            defaultStart.setDate(defaultStart.getDate() + 1);
          }
        }
        defaultStart.setHours(businessHours.start, 0, 0, 0);
      } else {
        // Selected date is today or in future
        if (selectedDate.toDateString() === now.toDateString()) {
          // Today - set to next available hour or business start if too late
          const currentHour = now.getHours();
          if (currentHour >= businessHours.end - 1) {
            // Too late today, move to next business day
            defaultStart.setDate(defaultStart.getDate() + 1);
            if (defaultStart.getDay() === 0) {
              defaultStart.setDate(defaultStart.getDate() + 1);
            }
            defaultStart.setHours(businessHours.start, 0, 0, 0);
          } else {
            // Set to next hour or business start
            defaultStart.setHours(Math.max(currentHour + 1, businessHours.start), 0, 0, 0);
          }
        } else {
          // Future date - check if it's a Sunday
          if (defaultStart.getDay() === 0) {
            // Sunday, move to Monday
            defaultStart.setDate(defaultStart.getDate() + 1);
          }
          defaultStart.setHours(businessHours.start, 0, 0, 0);
        }
      }
    }
    
    // Format to datetime-local format manually to avoid timezone issues
    const year = defaultStart.getFullYear();
    const month = String(defaultStart.getMonth() + 1).padStart(2, '0');
    const day = String(defaultStart.getDate()).padStart(2, '0');
    const hour = String(defaultStart.getHours()).padStart(2, '0');
    const minute = String(defaultStart.getMinutes()).padStart(2, '0');
    const startTime = `${year}-${month}-${day}T${hour}:${minute}`;
    
    const endTime = calculateEndTime(startTime, eventType);
    const defaultLocation = getDefaultLocation(eventType);
    const defaultDescription = getDefaultDescription(eventType);
    
    // Check if the slot is available, if not suggest next available
    let finalStart = startTime;
    let finalEnd = endTime;
    
    if (!isTimeSlotAvailable(startTime, endTime)) {
      const suggestion = suggestNextAvailableSlot(startTime, eventType);
      if (suggestion) {
        finalStart = suggestion.start;
        finalEnd = suggestion.end;
      }
    }
    
    setNewEvent(prev => ({ 
      ...prev, 
      type: eventType,
      title: getDefaultTitle(eventType),
      startDate: finalStart,
      endDate: finalEnd,
      location: defaultLocation,
      description: defaultDescription,
      assignedTo: currentUser.id // Preserve current user assignment
    }));
    setShowAddForm(true);
    setShowContextMenu(false);
  };

  const handleUpdateEvent = async (updatedEvent: CalendarEvent) => {
    setEvents(prev => prev.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
    setEditingEvent(null);
    setSelectedEvent(updatedEvent);
  };

  const getMinDateTime = () => {
    const now = new Date();
    const currentDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return currentDateTime.toISOString().slice(0, 16);
  };

  const calculateEndTime = (startTime: string, eventType: CalendarEvent['type']) => {
    if (!startTime) return '';
    
    console.log('=== DEBUG calculateEndTime ===');
    console.log('Input startTime:', startTime);
    console.log('Event type:', eventType);
    console.log('Duration from defaultDurations:', defaultDurations[eventType], 'minutes');
    
    // Parse the datetime-local string directly without timezone conversion
    const [date, time] = startTime.split('T');
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    
    console.log('Parsed components:', { year, month, day, hour, minute });
    
    // Create date object using local time components
    const start = new Date(year, month - 1, day, hour, minute, 0, 0);
    console.log('Start date object:', start);
    
    const duration = defaultDurations[eventType]; // Duration in minutes
    console.log('Adding duration:', duration, 'minutes');
    
    // Add duration in minutes
    const end = new Date(start.getTime() + (duration * 60 * 1000));
    console.log('End date object:', end);
    
    // Format back to datetime-local format
    const endYear = end.getFullYear();
    const endMonth = String(end.getMonth() + 1).padStart(2, '0');
    const endDay = String(end.getDate()).padStart(2, '0');
    const endHour = String(end.getHours()).padStart(2, '0');
    const endMinute = String(end.getMinutes()).padStart(2, '0');
    
    const result = `${endYear}-${endMonth}-${endDay}T${endHour}:${endMinute}`;
    console.log('Final result:', result);
    console.log('=== END DEBUG ===');
    
    return result;
  };

  const handleStartTimeChange = (startTime: string) => {
    const roundedStartTime = roundToQuarterHour(startTime);
    const endTime = calculateEndTime(roundedStartTime, newEvent.type);
    setNewEvent(prev => ({
      ...prev,
      startDate: roundedStartTime,
      endDate: endTime
    }));
  };

  const handleEditStartTimeChange = (startTime: string) => {
    if (!editingEvent) return;
    const roundedStartTime = roundToQuarterHour(startTime);
    const endTime = calculateEndTime(roundedStartTime, editingEvent.type);
    setEditingEvent(prev => prev ? ({
      ...prev,
      startDate: new Date(roundedStartTime).toISOString(),
      endDate: new Date(endTime).toISOString()
    }) : null);
  };

  const handleEventTypeChange = (eventType: CalendarEvent['type']) => {
    let startTime = newEvent.startDate;
    
    // If no start time set, use current business hour
    if (!startTime) {
      const now = new Date();
      const businessHours = getBusinessHours();
      const defaultStart = new Date(now);
      defaultStart.setHours(Math.max(now.getHours() + 1, businessHours.start), 0, 0, 0);
      
      // Format to datetime-local format manually
      const year = defaultStart.getFullYear();
      const month = String(defaultStart.getMonth() + 1).padStart(2, '0');
      const day = String(defaultStart.getDate()).padStart(2, '0');
      const hour = String(defaultStart.getHours()).padStart(2, '0');
      const minute = String(defaultStart.getMinutes()).padStart(2, '0');
      startTime = `${year}-${month}-${day}T${hour}:${minute}`;
    }
    
    const endTime = calculateEndTime(startTime, eventType);
    const defaultLocation = getDefaultLocation(eventType);
    const defaultDescription = getDefaultDescription(eventType);
    
    setNewEvent(prev => ({
      ...prev,
      type: eventType,
      title: eventType === 'OTHER' ? '' : getDefaultTitle(eventType), // Clear title for OTHER, set default for others
      startDate: startTime,
      endDate: endTime,
      location: defaultLocation || prev.location,
      description: defaultDescription
    }));
  };

  const handleEditEventTypeChange = (eventType: CalendarEvent['type']) => {
    if (!editingEvent) return;
    const startTime = new Date(editingEvent.startDate).toISOString().slice(0, 16);
    const endTime = calculateEndTime(startTime, eventType);
    const defaultLocation = getDefaultLocation(eventType);
    
    setEditingEvent(prev => prev ? ({
      ...prev,
      type: eventType,
      title: eventType === 'OTHER' ? '' : getDefaultTitle(eventType), // Clear title for OTHER, set default for others
      endDate: new Date(endTime).toISOString(),
      location: defaultLocation || prev.location
    }) : null);
  };

  const isTimeSlotAvailable = (startDate: string, endDate: string, excludeEventId?: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log('=== CHECKING TIME SLOT AVAILABILITY ===');
    console.log('Checking slot:', start.toLocaleString(), 'to', end.toLocaleString());
    console.log('ExcludeEventId:', excludeEventId);
    
    const conflicts = events.filter(event => {
      if (excludeEventId && event.id === excludeEventId) {
        console.log('Skipping excluded event:', event.id);
        return false;
      }
      
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      
      console.log('Comparing with event:', eventStart.toLocaleString(), 'to', eventEnd.toLocaleString());
      
      // Check for direct overlap - appointments overlap if they share any time
      const hasOverlap = (start < eventEnd && end > eventStart);
      console.log('Has overlap:', hasOverlap);
      
      // Allow back-to-back appointments - no conflict if they just touch
      const isExactlyBackToBack = (start.getTime() === eventEnd.getTime()) || (end.getTime() === eventStart.getTime());
      console.log('Is exactly back-to-back:', isExactlyBackToBack);
      
      const isConflict = hasOverlap && !isExactlyBackToBack;
      console.log('Final conflict result:', isConflict);
      console.log('---');
      
      return isConflict;
    });
    
    const isAvailable = conflicts.length === 0;
    console.log('FINAL RESULT - Time slot available:', isAvailable);
    console.log('=== END CHECK ===');
    
    return isAvailable;
  };

  const getBusinessHours = () => {
    return {
      start: 9, // 9 AM
      end: 17,  // 5 PM
    };
  };

  // Location requirements based on event type
  const locationRequirements = {
    CONSULTATION: { required: false, default: 'Bowman Bathrooms Showroom' },
    SURVEY: { required: true, default: '' },
    DESIGN_MEETING: { required: false, default: 'Bowman Bathrooms Showroom' },
    DESIGN_PRESENTATION: { required: false, default: 'Bowman Bathrooms Showroom' },
    FOLLOW_UP: { required: false, default: 'Phone call' },
    INTERNAL_MEETING: { required: false, default: 'Bowman Bathrooms Office' },
    OTHER: { required: false, default: '' },
  };

  const isCustomerRequired = (eventType: CalendarEvent['type']) => {
    return eventType !== 'INTERNAL_MEETING' && eventType !== 'OTHER'; // Internal meetings and OTHER events don't require customers
  };

  const isLocationRequired = (eventType: CalendarEvent['type']) => {
    return locationRequirements[eventType].required;
  };

  const getDefaultLocation = (eventType: CalendarEvent['type']) => {
    return locationRequirements[eventType].default;
  };

  const getDefaultDescription = (eventType: CalendarEvent['type']) => {
    return defaultDescriptions[eventType];
  };

  const suggestNextAvailableSlot = (preferredStart: string, eventType: CalendarEvent['type']) => {
    console.log('=== SUGGESTING NEXT AVAILABLE SLOT ===');
    console.log('Preferred start:', preferredStart);
    console.log('Event type:', eventType);
    
    const duration = defaultDurations[eventType];
    let start = new Date(preferredStart);
    const businessHours = getBusinessHours();
    
    console.log('Duration:', duration, 'minutes');
    console.log('Business hours:', businessHours);
    
    // Round to next quarter hour
    const currentMinutes = start.getMinutes();
    const nextQuarterHour = Math.ceil(currentMinutes / 15) * 15;
    
    if (nextQuarterHour >= 60) {
      start.setHours(start.getHours() + 1, 0, 0, 0);
    } else {
      start.setMinutes(nextQuarterHour, 0, 0);
    }
    
    for (let i = 0; i < 14; i++) { // Check next 14 days
      console.log('Checking day:', start.toDateString());
      
      // Skip Sundays
      if (start.getDay() === 0) {
        console.log('Skipping Sunday');
        start.setDate(start.getDate() + 1);
        start.setHours(businessHours.start, 0, 0, 0);
        continue;
      }
      
      // For the first day, start from the calculated time, otherwise start from business hours
      const startHour = i === 0 ? Math.max(start.getHours(), businessHours.start) : businessHours.start;
      const startMinute = i === 0 && start.getHours() >= businessHours.start ? start.getMinutes() : 0;
      
      // Check each quarter-hour slot during business hours
      for (let hour = startHour; hour < businessHours.end; hour++) {
        const minuteStart = (hour === startHour) ? startMinute : 0;
        for (let minute = minuteStart; minute < 60; minute += 15) {
          // Make sure we don't exceed business hours with the event duration
          const testStart = new Date(start);
          testStart.setHours(hour, minute, 0, 0);
          const testEnd = new Date(testStart.getTime() + duration * 60000);
          
          // Skip if event would end after business hours
          if (testEnd.getHours() > businessHours.end || 
              (testEnd.getHours() === businessHours.end && testEnd.getMinutes() > 0)) {
            continue;
          }
          
          console.log('Testing slot:', testStart.toLocaleString(), 'to', testEnd.toLocaleString());
          
          if (isTimeSlotAvailable(testStart.toISOString(), testEnd.toISOString())) {
            console.log('FOUND AVAILABLE SLOT!');
            const result = {
              start: testStart.toISOString().slice(0, 16),
              end: testEnd.toISOString().slice(0, 16)
            };
            console.log('Returning:', result);
            console.log('=== END SUGGESTION ===');
            return result;
          } else {
            console.log('Slot not available');
          }
        }
      }
      
      // Move to next day
      start.setDate(start.getDate() + 1);
      start.setHours(businessHours.start, 0, 0, 0);
    }
    
    console.log('No available slot found in 14 days');
    console.log('=== END SUGGESTION ===');
    return null;
  };

  // Filter events based on user role and selected filter
  const getFilteredEvents = () => {
    let filteredEvents = events;

    // Role-based filtering
    if (currentUser.role === 'Sales Representative') {
      // Sales reps only see their own events
      filteredEvents = events.filter(event => event.assignedTo.id === currentUser.id);
    } else if (currentUser.role === 'Director' || currentUser.role === 'Sales Manager') {
      // Directors and managers can see all events, apply user filter if selected
      if (filterByUser !== 'all') {
        filteredEvents = events.filter(event => event.assignedTo.id === filterByUser);
      }
    } else {
      // Other roles see their own events by default, with optional filtering
      if (filterByUser === 'all') {
        filteredEvents = events.filter(event => event.assignedTo.id === currentUser.id);
      } else {
        filteredEvents = events.filter(event => event.assignedTo.id === filterByUser);
      }
    }

    return filteredEvents;
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Condensed Header - Everything on one line */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-6">
            <h2 className="text-base font-semibold text-gray-900">{formatMonthYear(currentDate)}</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => navigate('prev')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title={`Previous ${viewMode}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={() => navigate('next')}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title={`Next ${viewMode}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex space-x-2">
            <button 
              onClick={() => setViewMode('day')}
              className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                viewMode === 'day' ? 'text-blue-600 bg-blue-100' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Day
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                viewMode === 'week' ? 'text-blue-600 bg-blue-100' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Week
            </button>
            <button 
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                viewMode === 'month' ? 'text-blue-600 bg-blue-100' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Month
            </button>
          </div>
          {/* User Filter - only show for directors/managers */}
          {(currentUser.role === 'Director' || currentUser.role === 'Sales Manager') && (
            <div className="flex items-center space-x-2">
              <label htmlFor="userFilter" className="text-sm font-medium text-gray-700">Show events for:</label>
              <select
                id="userFilter"
                value={filterByUser}
                onChange={(e) => setFilterByUser(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Staff</option>
                {mockUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex space-x-3">
            <button 
              onClick={goToToday}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Today
            </button>
            <button 
              onClick={(e) => {
                const buttonRect = e.currentTarget.getBoundingClientRect();
                setContextMenuPosition({ 
                  x: buttonRect.left - 150,
                  y: buttonRect.bottom + 10 
                });
                setSelectedDate(new Date(2025, 5, 28)); // Set to current date for plus button
                setIsFromPlusButton(true);
                setShowContextMenu(true);
              }}
              className="inline-flex items-center justify-center w-10 h-10 border border-transparent text-sm font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-md"
              title="New appointment"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Status Indicator */}
      {filterByUser !== 'all' && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center text-sm text-blue-800">
            <Users className="w-4 h-4 mr-2" />
            <span>
              Showing events for: {mockUsers.find(u => u.id === filterByUser)?.name || 'Unknown User'}
            </span>
          </div>
          {(currentUser.role === 'Director' || currentUser.role === 'Sales Manager') && (
            <button
              onClick={() => setFilterByUser('all')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Show all events
            </button>
          )}
        </div>
      )}

      {/* Calendar Grid */}
      {viewMode === 'month' && (
        <div className="bg-white border border-gray-200 overflow-hidden flex-1">
          <div className="grid grid-cols-7 gap-px bg-gray-200 h-full">
            {/* Header Row */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-gray-50 px-1 py-1 text-center">
                <span className="text-xs font-semibold text-gray-900">{day}</span>
              </div>
            ))}
            
            {/* Calendar Days */}
            {Array.from({ length: 42 }, (_, i) => {
              const firstDay = getFirstDayOfMonth(currentDate);
              const daysInMonth = getDaysInMonth(currentDate);
              const daysInPrevMonth = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
              
              let dayNumber: number;
              let isCurrentMonth: boolean;
              let actualDate: Date;
              
              if (i < firstDay) {
                // Previous month days
                dayNumber = daysInPrevMonth - (firstDay - i - 1);
                isCurrentMonth = false;
                actualDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, dayNumber);
              } else if (i >= firstDay + daysInMonth) {
                // Next month days
                dayNumber = i - firstDay - daysInMonth + 1;
                isCurrentMonth = false;
                actualDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, dayNumber);
              } else {
                // Current month days
                dayNumber = i - firstDay + 1;
                isCurrentMonth = true;
                actualDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
              }
              
              const dayEvents = getEventsForDate(currentDate, dayNumber, isCurrentMonth);
              const isTodayDate = isCurrentMonth && isToday(currentDate, dayNumber);
              
              return (
                <div
                  key={i}
                  className={`bg-white px-1 py-1 border-r border-b border-gray-200 relative overflow-hidden hover:bg-gray-50 cursor-pointer ${
                    !isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''
                  }`}
                  style={{ height: 'calc((100vh - 80px) / 6)' }}
                  onClick={(e) => {
                    // Don't trigger if clicking on an event
                    if ((e.target as HTMLElement).closest('.event-item')) return;
                    handleLeftClick(e, dayNumber, isCurrentMonth);
                  }}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    isTodayDate 
                      ? 'bg-blue-500 text-white px-2 py-1 rounded-lg shadow-lg border-2 border-blue-600 text-xs font-bold flex items-center justify-center min-w-[24px] h-6 mx-auto' 
                      : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {dayNumber}
                  </div>
                  
                  {/* Events for this date */}
                  {dayEvents.length > 0 && (
                    <div className="space-y-px">
                      {dayEvents.slice(0, 4).map((event, index) => {
                        const clientName = event.attendees.find(a => a.role === 'Client')?.name || '';
                        const displayName = event.type === 'OTHER' ? event.title : clientName; // Show title for OTHER events, customer name for others
                        const eventTime = new Date(event.startDate).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        });
                        
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                            }}
                            className={`event-item text-xs p-1 rounded cursor-pointer hover:opacity-80 ${eventTypeColors[event.type]} ${
                              !isCurrentMonth ? 'opacity-60' : ''
                            }`}
                            title={`${event.title} - ${displayName} - ${eventTime}`}
                            style={{
                              fontSize: '14px',
                              lineHeight: '1.4',
                              padding: '3px 5px'
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold" style={{ fontSize: '14px' }}>
                                {eventTime}
                              </span>
                              {displayName && (
                                <span className="opacity-75 ml-2 truncate" style={{ fontSize: '13px', maxWidth: '160px' }}>
                                  {displayName}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {dayEvents.length > 4 && (
                        <div className="text-xs text-gray-500 font-medium" style={{ fontSize: '9px' }}>
                          +{dayEvents.length - 4} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            {/* Time column header */}
            <div className="bg-gray-50 p-2 text-center">
              <span className="text-sm font-medium text-gray-900">Time</span>
            </div>
            
            {/* Week day headers */}
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date(currentDate);
              const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
              const dayDate = new Date(startOfWeek);
              dayDate.setDate(startOfWeek.getDate() + i);
              const isToday = dayDate.toDateString() === new Date(2025, 5, 28).toDateString();
              
              return (
                <div key={i} className={`p-2 text-center ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="text-xs text-gray-500">
                    {dayDate.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {dayDate.getDate()}
                  </div>
                </div>
              );
            })}
            
            {/* Time slots */}
            {Array.from({ length: 12 }, (_, hour) => {
              const timeHour = hour + 7; // 7 AM to 6 PM
              const timeString = `${timeHour > 12 ? timeHour - 12 : timeHour}:00 ${timeHour >= 12 ? 'PM' : 'AM'}`;
              
              return (
                <React.Fragment key={hour}>
                  <div className="bg-gray-50 p-2 border-r border-b border-gray-200 text-xs text-gray-500">
                    {timeString}
                  </div>
                  {Array.from({ length: 7 }, (_, day) => {
                    const date = new Date(currentDate);
                    const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
                    const cellDate = new Date(startOfWeek);
                    cellDate.setDate(startOfWeek.getDate() + day);
                    cellDate.setHours(timeHour, 0, 0, 0);
                    
                    const filteredEvents = getFilteredEvents();
                    const cellEvents = filteredEvents.filter(event => {
                      const eventStart = new Date(event.startDate);
                      return eventStart.toDateString() === cellDate.toDateString() &&
                             eventStart.getHours() === timeHour;
                    });
                    
                    return (
                      <div
                        key={day}
                        className="bg-white p-1 h-16 border-r border-b border-gray-200 hover:bg-gray-50 cursor-pointer relative"
                        onClick={(e) => {
                          // Don't trigger if clicking on an event
                          if ((e.target as HTMLElement).closest('.event-item')) return;
                          setSelectedDate(cellDate);
                          setContextMenuPosition({ x: e.clientX, y: e.clientY });
                          setIsFromPlusButton(false);
                          setShowContextMenu(true);
                        }}
                      >
                        {cellEvents.map(event => {
                          const clientName = event.attendees.find(a => a.role === 'Client')?.name || '';
                          const displayName = event.type === 'OTHER' ? event.title : clientName; // Show title for OTHER events, customer name for others
                          return (
                            <div
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                              }}
                              className={`event-item text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate ${eventTypeColors[event.type]}`}
                              title={`${event.title} - ${displayName}`}
                            >
                              {displayName}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 p-4">
            <h3 className="text-lg font-medium text-gray-900">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-px bg-gray-200">
            <div className="bg-gray-50 p-2 text-center">
              <span className="text-sm font-medium text-gray-900">Time</span>
            </div>
            <div className="bg-gray-50 p-2 text-center">
              <span className="text-sm font-medium text-gray-900">Events</span>
            </div>
            
            {Array.from({ length: 12 }, (_, hour) => {
              const timeHour = hour + 7; // 7 AM to 6 PM
              const timeString = `${timeHour > 12 ? timeHour - 12 : timeHour}:00 ${timeHour >= 12 ? 'PM' : 'AM'}`;
              
              const filteredEvents = getFilteredEvents();
              const hourEvents = filteredEvents.filter(event => {
                const eventStart = new Date(event.startDate);
                return eventStart.toDateString() === currentDate.toDateString() &&
                       eventStart.getHours() === timeHour;
              });
              
              return (
                <React.Fragment key={hour}>
                  <div className="bg-gray-50 p-2 border-r border-b border-gray-200 text-sm text-gray-500">
                    {timeString}
                  </div>
                  <div 
                    className="bg-white p-2 h-16 border-r border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      // Don't trigger if clicking on an event
                      if ((e.target as HTMLElement).closest('.event-item')) return;
                      const cellDate = new Date(currentDate);
                      cellDate.setHours(timeHour, 0, 0, 0);
                      setSelectedDate(cellDate);
                      setContextMenuPosition({ x: e.clientX, y: e.clientY });
                      setIsFromPlusButton(false);
                      setShowContextMenu(true);
                    }}
                  >
                    {hourEvents.map(event => {
                      const clientName = event.attendees.find(a => a.role === 'Client')?.name || '';
                      const displayName = event.type === 'OTHER' ? event.title : clientName; // Show title for OTHER events, customer name for others
                      const eventTitle = event.type === 'OTHER' ? '' : event.title; // Don't show title for OTHER events since we show it as display name
                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`event-item text-sm p-2 rounded cursor-pointer hover:opacity-80 mb-1 ${eventTypeColors[event.type]}`}
                        >
                          {eventTitle && <div className="font-medium">{eventTitle}</div>}
                          <div className="text-xs opacity-75">{displayName}</div>
                          <div className="text-xs opacity-75">{event.location}</div>
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}



      {/* Event Creation Modal */}
      {showAddForm && (
        <div 
          className="fixed inset-0 overflow-y-auto h-full w-full z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddForm(false);
            }
          }}
        >
          <div className="relative w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Create New Event</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateEvent} className="space-y-4">
                {/* Title field - only for OTHER event type */}
                {newEvent.type === 'OTHER' && (
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Title <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1"
                      placeholder="Enter custom event title..."
                      required={true}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">Event Type</Label>
                  <select
                    id="type"
                    value={newEvent.type}
                    onChange={(e) => handleEventTypeChange(e.target.value as CalendarEvent['type'])}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="CONSULTATION">Design Consultation (1 hour)</option>
                    <option value="SURVEY">Survey (1 hour)</option>
                    <option value="DESIGN_MEETING">Design Meeting (1.5 hours)</option>
                    <option value="DESIGN_PRESENTATION">Design Presentation (2 hours)</option>
                    <option value="FOLLOW_UP">Follow-up (5 minutes)</option>
                    <option value="INTERNAL_MEETING">Internal Meeting (1 hour)</option>
                    <option value="OTHER">Other (1 hour)</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="assignedTo" className="text-sm font-medium text-gray-700">Assign to</Label>
                  <select
                    id="assignedTo"
                    value={newEvent.assignedTo}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {mockUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Customer Selection - Required for non-internal events */}
                {isCustomerRequired(newEvent.type) && (
                  <div>
                    <Label htmlFor="customer" className="text-sm font-medium text-gray-700">
                      Customer <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <CustomerAutocomplete
                      value={newEvent.customerId}
                      onSelect={(customerId, customerName, customerAddress) => {
                        setNewEvent(prev => ({ 
                          ...prev, 
                          customerId,
                          customerName,
                          // Auto-fill location with customer address for surveys
                          location: prev.type === 'SURVEY' && customerAddress 
                            ? customerAddress 
                            : prev.location
                        }));
                      }}
                      placeholder="Search for a customer..."
                      required={true}
                      className="mt-1"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">Start Date</Label>
                    <QuarterHourTimeInput
                      id="startDate"
                      value={newEvent.startDate}
                      onChange={(value) => handleStartTimeChange(value)}
                      className="mt-1"
                      min={getMinDateTime()}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">End Date</Label>
                    <QuarterHourTimeInput
                      id="endDate"
                      value={newEvent.endDate}
                      onChange={(value) => setNewEvent(prev => ({ ...prev, endDate: value }))}
                      className="mt-1"
                      min={newEvent.startDate}
                      required
                    />
                  </div>
                </div>
                
                {/* Time slot availability indicator */}
                {newEvent.startDate && newEvent.endDate && (
                  <div className="text-sm">
                    {isTimeSlotAvailable(newEvent.startDate, newEvent.endDate) ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Time slot available
                      </div>
                    ) : (
                      <div className="text-amber-600">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Time slot conflict detected
                        </div>
                        {(() => {
                          const suggestion = suggestNextAvailableSlot(newEvent.startDate, newEvent.type);
                          return suggestion && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewEvent(prev => ({
                                  ...prev,
                                  startDate: suggestion.start,
                                  endDate: suggestion.end
                                }));
                              }}
                              className="mt-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                            >
                              Use next available: {new Date(suggestion.start).toLocaleDateString()} at {new Date(suggestion.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            </button>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                    Location 
                    {isLocationRequired(newEvent.type) && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {newEvent.type === 'SURVEY' ? (
                    <AddressAutocomplete
                      value={newEvent.location}
                      onChange={(value) => setNewEvent(prev => ({ ...prev, location: value }))}
                      placeholder="Enter client address..."
                      required={isLocationRequired(newEvent.type)}
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      id="location"
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      className="mt-1"
                      placeholder={getDefaultLocation(newEvent.type) || "Enter location..."}
                      required={isLocationRequired(newEvent.type)}
                    />
                  )}
                  {isLocationRequired(newEvent.type) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Address is required for {newEvent.type.toLowerCase().replace('_', ' ')}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                    placeholder={getDefaultDescription(newEvent.type)}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
                    disabled={!isTimeSlotAvailable(newEvent.startDate, newEvent.endDate) || 
                             (isLocationRequired(newEvent.type) && !newEvent.location.trim()) ||
                             (isCustomerRequired(newEvent.type) && !newEvent.customerId.trim()) ||
                             (newEvent.type === 'OTHER' && !newEvent.title.trim())}
                  >
                    Create Event
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && !editingEvent && (
        <div 
          className="fixed inset-0 overflow-y-auto h-full w-full z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedEvent(null);
            }
          }}
        >
          <div className="relative w-full max-w-lg mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedEvent.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${eventTypeColors[selectedEvent.type]}`}>
                      {selectedEvent.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => setEditingEvent(selectedEvent)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit event"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete event"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-3 text-gray-400" />
                  <span>
                    {new Date(selectedEvent.startDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-3 text-gray-400" />
                  <span>
                    {new Date(selectedEvent.startDate).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })} - {new Date(selectedEvent.endDate).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-start text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-3 mt-0.5 text-gray-400" />
                    <span className="flex-1">
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(selectedEvent.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {selectedEvent.location}
                      </a>
                    </span>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-medium text-gray-900 mb-2">Description</p>
                    <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Assigned to</p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs font-medium text-blue-600">
                        {selectedEvent.assignedTo.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedEvent.assignedTo.name}</p>
                      <p className="text-xs text-gray-500">{selectedEvent.assignedTo.role}</p>
                    </div>
                  </div>
                </div>
                
                {selectedEvent.attendees.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-medium text-gray-900 mb-3">Attendees</p>
                    <div className="space-y-2">
                      {selectedEvent.attendees.map((attendee) => (
                        <div key={attendee.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-medium text-gray-600">
                                {attendee.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{attendee.name}</p>
                              <p className="text-xs text-gray-500">{attendee.role}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <a 
                              href={`mailto:${attendee.email}`}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Send email"
                            >
                              <Mail className="w-4 h-4" />
                            </a>
                            {attendee.role === 'Client' && (
                              <a 
                                href={`tel:${attendee.email}`}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Call"
                              >
                                <Phone className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowContextMenu(false)}
          />
          <div 
            className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[200px]"
            style={(() => {
              const menuWidth = 200;
              const menuHeight = 280; // Approximate height of menu (7 items × 40px each)
              const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
              const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
              const padding = 20; // Safety padding from edges
              
              let left = contextMenuPosition.x;
              let top = contextMenuPosition.y;
              let transformX = '-50%'; // Default: center horizontally
              let transformY = '-10px'; // Default: slightly above click point
              
              // Horizontal positioning
              if (left + menuWidth / 2 > viewportWidth - padding) {
                // Would go off right edge - align to right of click point
                transformX = '-100%';
              } else if (left - menuWidth / 2 < padding) {
                // Would go off left edge - align to left of click point
                transformX = '0%';
              }
              
              // Vertical positioning
              if (top + menuHeight > viewportHeight - padding) {
                // Would go off bottom edge - show above click point
                transformY = `calc(-100% - 10px)`;
              }
              
              return {
                left: `${left}px`,
                top: `${top}px`,
                transform: `translate(${transformX}, ${transformY})`
              };
            })()}
          >
            <button
              onClick={() => handleContextMenuAction('CONSULTATION', isFromPlusButton)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 flex items-center"
            >
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Schedule Design Consultation
            </button>
            <button
              onClick={() => handleContextMenuAction('SURVEY', isFromPlusButton)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-900 flex items-center"
            >
              <Users className="w-4 h-4 mr-2 text-green-600" />
              Arrange Survey
            </button>
            <button
              onClick={() => handleContextMenuAction('DESIGN_MEETING', isFromPlusButton)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-900 flex items-center"
            >
              <Edit className="w-4 h-4 mr-2 text-purple-600" />
              Design Meeting
            </button>
            <button
              onClick={() => handleContextMenuAction('DESIGN_PRESENTATION', isFromPlusButton)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center"
            >
              <Users className="w-4 h-4 mr-2 text-indigo-600" />
              Design Presentation
            </button>
            <button
              onClick={() => handleContextMenuAction('FOLLOW_UP', isFromPlusButton)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-900 flex items-center"
            >
              <Phone className="w-4 h-4 mr-2 text-yellow-600" />
              Schedule Follow-up
            </button>
            <button
              onClick={() => handleContextMenuAction('INTERNAL_MEETING', isFromPlusButton)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
            >
              <Users className="w-4 h-4 mr-2 text-gray-600" />
              Internal Meeting
            </button>
            <button
              onClick={() => handleContextMenuAction('OTHER', isFromPlusButton)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2 text-gray-600" />
              Other Event
            </button>
          </div>
        </>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div 
          className="fixed inset-0 overflow-y-auto h-full w-full z-40 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingEvent(null);
            }
          }}
        >
          <div className="relative w-full max-w-md mx-auto bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Event</h3>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                
                // Validate title for OTHER event type
                if (editingEvent.type === 'OTHER' && !editingEvent.title?.trim()) {
                  alert('Please enter a title for OTHER event type');
                  return;
                }
                
                // Validate required fields
                if (isCustomerRequired(editingEvent.type) && !editingEvent.customerId?.trim()) {
                  alert(`Customer selection is required for ${editingEvent.type.toLowerCase().replace('_', ' ')}`);
                  return;
                }
                
                // Validate required location for certain event types
                if (isLocationRequired(editingEvent.type) && !editingEvent.location?.trim()) {
                  alert(`Location is required for ${editingEvent.type.toLowerCase().replace('_', ' ')}`);
                  return;
                }
                
                handleUpdateEvent(editingEvent);
              }} className="space-y-4">
                {/* Title field - only for OTHER event type */}
                {editingEvent.type === 'OTHER' && (
                  <div>
                    <Label htmlFor="edit-title" className="text-sm font-medium text-gray-700">
                      Title <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      id="edit-title"
                      type="text"
                      value={editingEvent.title}
                      onChange={(e) => setEditingEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="mt-1"
                      placeholder="Enter custom event title..."
                      required={true}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="edit-type" className="text-sm font-medium text-gray-700">Event Type</Label>
                  <select
                    id="edit-type"
                    value={editingEvent.type}
                    onChange={(e) => handleEditEventTypeChange(e.target.value as CalendarEvent['type'])}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="CONSULTATION">Design Consultation (1 hour)</option>
                    <option value="SURVEY">Survey (1 hour)</option>
                    <option value="DESIGN_MEETING">Design Meeting (1.5 hours)</option>
                    <option value="DESIGN_PRESENTATION">Design Presentation (2 hours)</option>
                    <option value="FOLLOW_UP">Follow-up (5 minutes)</option>
                    <option value="INTERNAL_MEETING">Internal Meeting (1 hour)</option>
                    <option value="OTHER">Other (1 hour)</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="edit-assignedTo" className="text-sm font-medium text-gray-700">Assign to</Label>
                  <select
                    id="edit-assignedTo"
                    value={editingEvent.assignedTo.id}
                    onChange={(e) => {
                      const selectedUser = mockUsers.find(user => user.id === e.target.value);
                      if (selectedUser) {
                        setEditingEvent(prev => prev ? { 
                          ...prev, 
                          assignedTo: { id: selectedUser.id, name: selectedUser.name, role: selectedUser.role } 
                        } : null);
                      }
                    }}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {mockUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Customer Selection - Required for non-internal events */}
                {isCustomerRequired(editingEvent.type) && (
                  <div>
                    <Label htmlFor="edit-customer" className="text-sm font-medium text-gray-700">
                      Customer <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <CustomerAutocomplete
                      value={editingEvent.customerId || ''}
                      onSelect={(customerId, customerName, customerAddress) => {
                        setEditingEvent(prev => prev ? { 
                          ...prev, 
                          customerId,
                          customerName,
                          // Auto-fill location with customer address for surveys
                          location: prev.type === 'SURVEY' && customerAddress 
                            ? customerAddress 
                            : prev.location
                        } : null);
                      }}
                      placeholder="Search for a customer..."
                      required={true}
                      className="mt-1"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-startDate" className="text-sm font-medium text-gray-700">Start Date</Label>
                    <QuarterHourTimeInput
                      id="edit-startDate"
                      value={new Date(editingEvent.startDate).toISOString().slice(0, 16)}
                      onChange={(value) => handleEditStartTimeChange(value)}
                      className="mt-1"
                      min={getMinDateTime()}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-endDate" className="text-sm font-medium text-gray-700">End Date</Label>
                    <QuarterHourTimeInput
                      id="edit-endDate"
                      value={new Date(editingEvent.endDate).toISOString().slice(0, 16)}
                      onChange={(value) => setEditingEvent(prev => prev ? { ...prev, endDate: new Date(value).toISOString() } : null)}
                      className="mt-1"
                      min={new Date(editingEvent.startDate).toISOString().slice(0, 16)}
                      required
                    />
                  </div>
                </div>
                
                {/* Time slot availability for editing */}
                {editingEvent.startDate && editingEvent.endDate && (
                  <div className="text-sm">
                    {isTimeSlotAvailable(editingEvent.startDate, editingEvent.endDate, editingEvent.id) ? (
                      <div className="flex items-center text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Time slot available
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Time slot conflict detected
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <Label htmlFor="edit-location" className="text-sm font-medium text-gray-700">
                    Location
                    {isLocationRequired(editingEvent.type) && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {editingEvent.type === 'SURVEY' ? (
                    <AddressAutocomplete
                      value={editingEvent.location || ''}
                      onChange={(value) => setEditingEvent(prev => prev ? { ...prev, location: value } : null)}
                      placeholder="Enter client address..."
                      required={isLocationRequired(editingEvent.type)}
                      className="mt-1"
                    />
                  ) : (
                    <Input
                      id="edit-location"
                      type="text"
                      value={editingEvent.location || ''}
                      onChange={(e) => setEditingEvent(prev => prev ? { ...prev, location: e.target.value } : null)}
                      className="mt-1"
                      placeholder={getDefaultLocation(editingEvent.type) || "Enter location..."}
                      required={isLocationRequired(editingEvent.type)}
                    />
                  )}
                  {isLocationRequired(editingEvent.type) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Address is required for {editingEvent.type.toLowerCase().replace('_', ' ')}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingEvent.description || ''}
                    onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="mt-1"
                    placeholder="Event details..."
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingEvent(null)}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700"
                    disabled={!isTimeSlotAvailable(editingEvent.startDate, editingEvent.endDate, editingEvent.id) ||
                             (isLocationRequired(editingEvent.type) && !editingEvent.location?.trim()) ||
                             (isCustomerRequired(editingEvent.type) && !editingEvent.customerId?.trim()) ||
                             (editingEvent.type === 'OTHER' && !editingEvent.title?.trim())}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

