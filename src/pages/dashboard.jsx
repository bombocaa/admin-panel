import React, { useEffect, useState } from "react";
import { firestore } from "../firebase";
import { collection, query, getDocs, orderBy, limit, onSnapshot, doc } from "firebase/firestore";
import { FaUsers, FaDoorOpen, FaTools, FaRegClock } from "react-icons/fa";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import QuickActionsPanel from '../components/QuickActionsPanel';
import "../styles/dashboard.css";
import { formatTimeAgo } from '../utils/activityLogger';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// API Training Configuration
const API_TRAINING_CONFIG = {
  model: 'gpt-4.1-mini',
  epochs: 3,
  batchSize: 4
};

// Training data for prescriptive analytics
const TRAINING_DATA = [
  {
    "prompt": "Room 301 has 1 AC maintenance request. What action should be taken?",
    "completion": "For Room 301 AC issue:\n1. ACTION: Schedule basic AC maintenance and cleaning\n2. TIMELINE: Within 24-48 hours\n3. COST: Estimated $100-150 for maintenance\n4. FOLLOW-UP: Monitor for 1 week after service"
  },
  {
    "prompt": "Room 302 has 3 AC maintenance requests in 2 months. What action should be taken?",
    "completion": "For Room 302 AC issues:\n1. URGENT: Replace AC unit completely\n2. REASON: Multiple repairs indicate system failure\n3. COST: Estimated $800-1000 for new unit\n4. TIMELINE: Replace within 1 week\n5. PREVENTION: Schedule quarterly maintenance for new unit"
  },
  {
    "prompt": "Room 401 has 1 plumbing issue. What action should be taken?",
    "completion": "For Room 401 plumbing issue:\n1. ACTION: Schedule basic plumbing repair\n2. TIMELINE: Within 24 hours\n3. COST: Estimated $150-200 for repair\n4. FOLLOW-UP: Check for leaks after repair"
  },
  {
    "prompt": "Room 402 has 4 plumbing issues in 3 months. What action should be taken?",
    "completion": "For Room 402 plumbing issues:\n1. URGENT: Complete pipe system replacement\n2. REASON: Multiple leaks indicate system failure\n3. COST: Estimated $1200-1500 for full replacement\n4. TIMELINE: Complete within 1 week\n5. PREVENTION: Install water pressure regulator"
  },
  {
    "prompt": "Room 501 has 1 electrical issue. What action should be taken?",
    "completion": "For Room 501 electrical issue:\n1. ACTION: Schedule electrical repair\n2. TIMELINE: Within 24 hours\n3. COST: Estimated $100-150 for repair\n4. SAFETY: Check circuit breaker and wiring"
  },
  {
    "prompt": "Room 502 has 3 electrical issues in 2 months. What action should be taken?",
    "completion": "For Room 502 electrical issues:\n1. URGENT: Complete electrical system upgrade\n2. REASON: Multiple issues indicate system failure\n3. COST: Estimated $1000-1200 for upgrade\n4. TIMELINE: Complete within 1 week\n5. PREVENTION: Install surge protection"
  },
  {
    "prompt": "Room 601 has 1 cleaning request. What action should be taken?",
    "completion": "For Room 601 cleaning issue:\n1. ACTION: Schedule deep cleaning\n2. TIMELINE: Within 24 hours\n3. COST: Estimated $50-75 for cleaning\n4. FOLLOW-UP: Quality check after cleaning"
  },
  {
    "prompt": "Room 602 has 5 cleaning requests in 1 month. What action should be taken?",
    "completion": "For Room 602 cleaning issues:\n1. URGENT: Implement daily cleaning schedule\n2. REASON: Multiple requests indicate maintenance issue\n3. COST: Estimated $300-400 monthly for daily cleaning\n4. TIMELINE: Start immediately\n5. PREVENTION: Regular quality inspections"
  },
  {
    "prompt": "Room 701 has 1 pest control request. What action should be taken?",
    "completion": "For Room 701 pest issue:\n1. ACTION: Schedule pest control treatment\n2. TIMELINE: Within 24-48 hours\n3. COST: Estimated $150-200 for treatment\n4. FOLLOW-UP: Monitor for 2 weeks"
  },
  {
    "prompt": "Room 702 has 3 pest control requests in 2 months. What action should be taken?",
    "completion": "For Room 702 pest issues:\n1. URGENT: Implement comprehensive pest control program\n2. REASON: Multiple infestations indicate serious issue\n3. COST: Estimated $500-600 for full treatment\n4. TIMELINE: Start within 48 hours\n5. PREVENTION: Monthly preventive treatment"
  }
];

// Function to validate training data
const validateTrainingData = (data) => {
  try {
    if (!Array.isArray(data)) {
      throw new Error('Training data must be an array');
    }
    if (data.length === 0) {
      throw new Error('Training data cannot be empty');
    }
    data.forEach(item => {
      if (!item.prompt || !item.completion) {
        throw new Error('Each training item must have prompt and completion fields');
      }
    });
    return true;
  } catch (error) {
    throw new Error(`Invalid training data format: ${error.message}`);
  }
};

const Dashboard = () => {
  const [tenantsCount, setTenantsCount] = useState(0);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [availableRooms, setAvailableRooms] = useState(0);
  const [roomHistory, setRoomHistory] = useState({
    daily: { count: 0, timestamp: null },
    weekly: { count: 0, timestamp: null },
    monthly: { count: 0, timestamp: null }
  });
  const [activities, setActivities] = useState([]);

  const [tenantGrowthData, setTenantGrowthData] = useState({
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [{
      label: "New Tenants",
      data: Array(12).fill(0),
      borderColor: "#A0C878",
      backgroundColor: "rgba(160, 200, 120, 0.1)",
      tension: 0.4,
      fill: true,
      pointBackgroundColor: "#A0C878",
      pointBorderColor: "#fff",
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  });

const [aiRecommendations, setAiRecommendations] = useState('');
const [selectedFloor, setSelectedFloor] = useState(3);
const [roomMaintenanceData, setRoomMaintenanceData] = useState({});
const [loadingAI, setLoadingAI] = useState(false);
const [maintenanceRequestsThisMonth, setMaintenanceRequestsThisMonth] = useState(0);

const generateRoomNumbers = (floor) => {
  const rooms = [];
  for (let i = 1; i <= 13; i++) {
    if (i === 13) continue; // Skip room 13
    const roomNumber = `${floor}${i.toString().padStart(2, '0')}`;
    rooms.push(roomNumber);
  }
  return rooms;
};

const getAllFloorsAndRooms = () => {
  const floorsAndRooms = {};
  for (let floor = 3; floor <= 15; floor++) {
    if (floor === 13) continue; // Skip 13th floor
    floorsAndRooms[floor] = generateRoomNumbers(floor);
  }
  return floorsAndRooms;
};

const getAIRecommendations = async (maintenanceData) => {
  setLoadingAI(true);
  try {
    // Validate training data first
    validateTrainingData(TRAINING_DATA);

    // Check if API key is available
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Calculate room-specific replacement recommendations
    const roomReplacements = [];
    const categoryReplacements = [];
    
    // Analyze room-specific issues
    Object.entries(roomMaintenanceData).forEach(([room, data]) => {
      Object.entries(data).forEach(([category, count]) => {
        if (category !== 'total' && count >= REPLACEMENT_THRESHOLDS[category]) {
          const threshold = REPLACEMENT_THRESHOLDS[category];
          const repairCost = COST_ESTIMATES[category].repair * count;
          const replacementCost = COST_ESTIMATES[category].replace;
          const savings = repairCost - replacementCost;
          
          roomReplacements.push({
            room,
            category,
            count,
            threshold,
            repairCost,
            replacementCost,
            savings: Math.max(0, savings)
          });
        }
      });
    });

    // Create enhanced prompt with specific data
    const prompt = `Analyze the following maintenance data and provide practical, actionable recommendations:

- If a room or equipment has repeated issues above the normal threshold, suggest a replacement only if it is cost-effective.
- Otherwise, recommend preventive maintenance, monitoring, or minor repairs.
- Summarize any trends or patterns in the data.
- Suggest a simple maintenance schedule for the most common issues.

Data:
CRITICAL EQUIPMENT REPLACEMENT ALERTS:
${roomReplacements.length > 0 ? roomReplacements.map(item => 
  `Room ${item.room} - ${item.category}: ${item.count} repairs (threshold: ${item.threshold})
  - Repair costs so far: $${item.repairCost}
  - New equipment cost: $${item.replacementCost}
  - Potential savings: $${item.savings}`
).join('\n') : 'No equipment currently exceeds replacement thresholds.'}

CATEGORY-WIDE TRENDS:
${Object.entries(maintenanceData).map(([category, data]) => {
  const total = data.reduce((sum, count) => sum + count, 0);
  const peak = Math.max(...data);
  const peakMonth = data.indexOf(peak);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${category}: ${total} total requests, peak in ${months[peakMonth]} (${peak} requests)`;
}).join('\n')}

HIGH-MAINTENANCE ROOMS:
${Object.entries(roomMaintenanceData).filter(([room, data]) => data.total >= 3).map(([room, data]) => 
  `Room ${room}: ${data.total} total issues - Top categories: ${Object.entries(data)
    .filter(([key, value]) => key !== 'total' && value >= 2)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2)
    .map(([cat, count]) => `${cat}(${count})`)
    .join(', ')}`
).join('\n')}

FINANCIAL IMPACT:
- Total potential savings from replacements: $${roomReplacements.reduce((sum, item) => sum + item.savings, 0).toFixed(2)}
- Average monthly maintenance cost: $${Object.values(maintenanceData).flat().reduce((sum, count) => sum + count, 0) * 75}

Please provide:
1. Equipment or rooms that may need replacement, only if justified.
2. Preventive maintenance actions for recurring issues.
3. Simple, cost-effective suggestions for reducing future maintenance.
4. A brief summary of any patterns or trends.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: API_TRAINING_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `You are a property maintenance consultant. Your goal is to provide practical, cost-effective, and realistic maintenance suggestions based on the data. 
- Only recommend equipment replacement if it is clearly justified by repeated failures.
- Focus on preventive maintenance, monitoring, and minor repairs where possible.
- Avoid exaggeration and do not overstate urgency.
- Use clear, professional language.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    
    // Add replacement alerts to the AI response
    let enhancedResponse = data.choices[0].message.content;
    
    if (roomReplacements.length > 0) {
      enhancedResponse = `🚨 URGENT REPLACEMENT ALERTS:\n${roomReplacements.map(item => 
        `• Room ${item.room}: Replace ${item.category} unit (${item.count} repairs, save $${item.savings})`
      ).join('\n')}\n\n${enhancedResponse}`;
    }
    
    setAiRecommendations(enhancedResponse);
  } catch (error) {
    console.error('Error getting AI recommendations:', error);
    const fallbackRecommendations = generateFallbackRecommendations(maintenanceData, roomMaintenanceData);
    setAiRecommendations(`⚠️ AI recommendations unavailable (${error.message})\n\n${fallbackRecommendations}`);
  } finally {
    setLoadingAI(false);
  }
};

// Fallback function to generate recommendations without API
const generateFallbackRecommendations = (maintenanceData, roomMaintenanceData) => {
  let recommendations = "Maintenance Analysis:\n\n";
  
  // Analyze high-maintenance rooms
  const highMaintenanceRooms = Object.entries(roomMaintenanceData)
    .filter(([room, data]) => data.total >= 3)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 5);
  
  if (highMaintenanceRooms.length > 0) {
    recommendations += "🚨 HIGH-PRIORITY ROOMS NEEDING ATTENTION:\n";
    highMaintenanceRooms.forEach(([room, data]) => {
      const topCategory = Object.entries(data)
        .filter(([key]) => key !== 'total')
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topCategory) {
        recommendations += `• Room ${room}: ${data.total} total issues (Primary: ${topCategory[0]} - ${topCategory[1]} incidents)\n`;
      }
    });
    recommendations += "\n";
  }
  
  // Analyze category trends
  const categoryTotals = {};
  Object.entries(maintenanceData).forEach(([category, monthlyData]) => {
    categoryTotals[category] = monthlyData.reduce((sum, count) => sum + count, 0);
  });
  
  const topCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);
  
  if (topCategories.length > 0) {
    recommendations += "📈 TOP MAINTENANCE CATEGORIES:\n";
    topCategories.forEach(([category, total]) => {
      recommendations += `• ${category}: ${total} total requests this year\n`;
    });
    recommendations += "\n";
  }
  
  // Generate specific recommendations
  recommendations += "💡 RECOMMENDED ACTIONS:\n\n";
  
  // Equipment replacement recommendations
  const replacementNeeded = [];
  Object.entries(roomMaintenanceData).forEach(([room, data]) => {
    Object.entries(data).forEach(([category, count]) => {
      if (category !== 'total' && count >= REPLACEMENT_THRESHOLDS[category]) {
        replacementNeeded.push({ room, category, count });
      }
    });
  });
  
  if (replacementNeeded.length > 0) {
    recommendations += "Equipment that may need replacement (based on repeated issues):\n";
    replacementNeeded.forEach(({ room, category, count }) => {
      recommendations += `   • Room ${room}: ${category} (${count} repairs)\n`;
    });
    recommendations += "\n";
  }
  
  recommendations += "Preventive maintenance is recommended for rooms with repeated issues. Consider regular inspections and timely minor repairs to avoid major costs.\n";
  
  return recommendations;
};

// 3. Add this new function to calculate replacement priorities
const getReplacementPriorities = () => {
  const priorities = [];
  
  Object.entries(roomMaintenanceData).forEach(([room, data]) => {
    Object.entries(data).forEach(([category, count]) => {
      if (category !== 'total' && count >= REPLACEMENT_THRESHOLDS[category]) {
        const urgencyScore = (count / REPLACEMENT_THRESHOLDS[category]) * 100;
        const costSavings = (COST_ESTIMATES[category].repair * count) - COST_ESTIMATES[category].replace;
        
        priorities.push({
          room,
          category,
          count,
          urgencyScore,
          costSavings: Math.max(0, costSavings),
          priority: urgencyScore > 150 ? 'CRITICAL' : urgencyScore > 120 ? 'HIGH' : 'MEDIUM'
        });
      }
    });
  });
  
  return priorities.sort((a, b) => b.urgencyScore - a.urgencyScore);
};

const REPLACEMENT_THRESHOLDS = {
  Airconditioning: 4, // Replace after 4+ repairs
  Plumbing: 5,        // Replace after 5+ repairs
  Electrical: 3,      // Replace after 3+ repairs (safety concern)
  PestControl: 6,     // Replace/renovate after 6+ treatments
  Cleaning: 8,        // Deep cleaning/renovation after 8+ issues
  Others: 5           // General threshold
};

const COST_ESTIMATES = {
  Airconditioning: { repair: 150, replace: 800 },
  Plumbing: { repair: 100, replace: 300 },
  Electrical: { repair: 80, replace: 200 },
  PestControl: { repair: 60, replace: 400 },
  Cleaning: { repair: 40, replace: 250 },
  Others: { repair: 75, replace: 300 }
};



const aggregateRoomMaintenanceData = (requests = []) => {
  const allRooms = getAllFloorsAndRooms();
  const roomData = {};

  // Initialize all rooms with zero counts
  Object.values(allRooms).flat().forEach(room => {
    roomData[room] = {
      Airconditioning: 0,
      Plumbing: 0,
      Electrical: 0,
      PestControl: 0,
      Cleaning: 0,
      Others: 0,
      total: 0
    };
  });

  // Process maintenanceRequests from Firebase
  if (Array.isArray(requests)) {
    requests.forEach((request, index) => {
      console.log(`Processing request ${index}:`, request);
      
      if (request && request.roomNo) {
        // Handle different possible formats of roomNo
        let roomNumber = request.roomNo;
        
        // Convert to string and clean up
        if (typeof roomNumber === 'number') {
          roomNumber = roomNumber.toString();
        } else if (typeof roomNumber === 'string') {
          roomNumber = roomNumber.trim();
        }
        
        console.log(`Room number: ${roomNumber}`);
        
        // Get category and normalize it
        const rawCategory = (request.category || "").trim();
        const category = categoryMap[rawCategory] || 'Others';
        
        console.log(`Category: ${rawCategory} -> ${category}`);
        
        // Check if room exists in our data structure
        if (roomData[roomNumber]) {
          roomData[roomNumber][category]++;
          roomData[roomNumber].total++;
          console.log(`Updated room ${roomNumber}: ${category} count is now ${roomData[roomNumber][category]}`);
        } else {
          console.log(`Room ${roomNumber} not found in roomData. Available rooms:`, Object.keys(roomData).slice(0, 10));
        }
      } else {
        console.log(`Skipping request - missing roomNo:`, request);
      }
    });
  }

  return roomData;
};

useEffect(() => {
  const roomData = aggregateRoomMaintenanceData(maintenanceData);
  setRoomMaintenanceData(roomData);
}, [maintenanceData]);

useEffect(() => {
  if (maintenanceData.length > 0) {
    const monthlyData = aggregateMaintenanceData();
    getAIRecommendations(monthlyData);
  }
}, [maintenanceData]);

useEffect(() => {
  console.log('maintenanceData changed:', maintenanceData);
  const roomData = aggregateRoomMaintenanceData(maintenanceData);
  console.log('Setting roomMaintenanceData to:', roomData);
  setRoomMaintenanceData(roomData);
}, [maintenanceData]);

// Additionally, add this debugging useEffect to monitor roomMaintenanceData changes:
useEffect(() => {
  console.log('roomMaintenanceData updated:', roomMaintenanceData);
}, [roomMaintenanceData]);

useEffect(() => {
  if (!Array.isArray(maintenanceData)) return;
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const count = maintenanceData.filter(req => {
    if (!req.timestamp) return false;
    const date = req.timestamp.toDate ? req.timestamp.toDate() : new Date(req.timestamp);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  }).length;
  setMaintenanceRequestsThisMonth(count);
}, [maintenanceData]);

  // Helper functions
  const isNewDay = (oldDate, newDate) => {
    return oldDate.getDate() !== newDate.getDate() ||
           oldDate.getMonth() !== newDate.getMonth() ||
           oldDate.getFullYear() !== newDate.getFullYear();
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const isNewWeek = (oldDate, newDate) => {
    const oldWeek = getWeekNumber(oldDate);
    const newWeek = getWeekNumber(newDate);
    return oldWeek !== newWeek || oldDate.getFullYear() !== newDate.getFullYear();
  };

  const isNewMonth = (oldDate, newDate) => {
    return oldDate.getMonth() !== newDate.getMonth() ||
           oldDate.getFullYear() !== newDate.getFullYear();
  };

  // Handlers for quick actions
  const handleAddAnnouncement = () => {
    alert('Open Add Announcement modal');
  };
  const handleTrashCollection = () => {
    alert('Send Trash Collection Alert');
  };
  const handleAddTenant = () => {
    alert('Open Add Tenant modal');
  };

  useEffect(() => {
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return "Unknown time";
      const now = new Date();
      const updateTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const diffInHours = Math.floor((now - updateTime) / (1000 * 60 * 60));
      return diffInHours < 24 ? `${diffInHours} hours ago` : `${Math.floor(diffInHours / 24)} days ago`;
    };

    const fetchTenants = async () => {
      const q = query(collection(firestore, "users"));
      const snapshot = await getDocs(q);
      setTenantsCount(snapshot.size);
    };

    const fetchMaintenanceRequests = async () => {
      const unsubscribe = onSnapshot(collection(firestore, "maintenanceRequests"), (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp || new Date()
        }));
        setMaintenanceData(requests);
      });
      return () => unsubscribe();
    };

    const fetchRecentUpdates = async () => {
      const q = query(
        collection(firestore, "maintenanceRequests"),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        time: formatTimestamp(doc.data().timestamp)
      }));
      setRecentUpdates(updates);
    };

    const fetchRoomAvailability = () => {
      const roomRef = doc(firestore, 'roomAvailability', 'floors');
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          let count = 0;
          
          Object.values(data).forEach(floor => {
            if (Array.isArray(floor)) {
              count += floor.filter(room => room.available).length;
            }
          });

          const now = new Date();
          const previousCount = availableRooms;
          const difference = count - previousCount;

          setRoomHistory(prev => {
            const newHistory = { ...prev };
            
            if (!prev.daily.timestamp || isNewDay(prev.daily.timestamp, now)) {
              newHistory.daily = { count: difference, timestamp: now };
            } else {
              newHistory.daily.count += difference;
            }

            if (!prev.weekly.timestamp || isNewWeek(prev.weekly.timestamp, now)) {
              newHistory.weekly = { count: difference, timestamp: now };
            } else {
              newHistory.weekly.count += difference;
            }

            if (!prev.monthly.timestamp || isNewMonth(prev.monthly.timestamp, now)) {
              newHistory.monthly = { count: difference, timestamp: now };
            } else {
              newHistory.monthly.count += difference;
            }

            return newHistory;
          });

          setAvailableRooms(count);
        }
      });

      return () => unsubscribe();
    };

    fetchTenants();
    fetchMaintenanceRequests();
    fetchRecentUpdates();
    const unsubscribe = fetchRoomAvailability();

    return () => {
      unsubscribe();
    };
  }, [availableRooms]);

  const getRoomUpdateText = () => {
    const now = new Date();
    const daily = roomHistory.daily;
    const weekly = roomHistory.weekly;
    const monthly = roomHistory.monthly;

    if (daily.timestamp && !isNewDay(daily.timestamp, now)) {
      return `${daily.count > 0 ? '+' : ''}${daily.count} available rooms today`;
    } else if (weekly.timestamp && !isNewWeek(weekly.timestamp, now)) {
      return `${weekly.count > 0 ? '+' : ''}${weekly.count} available rooms this week`;
    } else if (monthly.timestamp && !isNewMonth(monthly.timestamp, now)) {
      return `${monthly.count > 0 ? '+' : ''}${monthly.count} available rooms this month`;
    }

    return "No recent changes in available rooms";
  };

  const categoryMap = {
    "Airconditioning": "Airconditioning",
    "Air Conditioning": "Airconditioning",
    "airconditioning": "Airconditioning",
    "Plumbing": "Plumbing",
    "Electrical": "Electrical",
    "PestControl": "PestControl",
    "Pest Control": "PestControl",
    "Cleaning": "Cleaning",
    "Others": "Others",
  };

  const aggregateMaintenanceData = () => {
    const monthlyData = {
      Airconditioning: Array(12).fill(0),
      Plumbing: Array(12).fill(0),
      Electrical: Array(12).fill(0),
      PestControl: Array(12).fill(0),
      Cleaning: Array(12).fill(0),
      Others: Array(12).fill(0),
    };

    if (Array.isArray(maintenanceData)) {
      maintenanceData.forEach((request) => {
        if (request && request.timestamp) {
          const date = new Date(request.timestamp.toDate ? request.timestamp.toDate() : request.timestamp);
          const month = date.getMonth();

          let rawCategory = (request.category || "").trim();
          const category = categoryMap[rawCategory] || "Others";

          if (monthlyData[category] !== undefined) {
            monthlyData[category][month] += 1;
          }
        }
      });
    }

    return monthlyData;
  };

  const maintenanceMonthlyData = aggregateMaintenanceData();

  const getQuarter = (month) => {
    if (month >= 0 && month <= 2) return "Q1";
    if (month >= 3 && month <= 5) return "Q2";
    if (month >= 6 && month <= 8) return "Q3";
    if (month >= 9 && month <= 11) return "Q4";
    return "";
  };

  const quarterlyData = {
    Airconditioning: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    Plumbing: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    Electrical: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    PestControl: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    Cleaning: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
    Others: { Q1: 0, Q2: 0, Q3: 0, Q4: 0 },
  };

  const ReplacementAlerts = () => {
  const priorities = getReplacementPriorities();
  
  if (priorities.length === 0) return null;
  
  return (
    <div style={{ 
      marginBottom: '20px', 
      padding: '15px', 
      backgroundColor: '#fff3cd', 
      border: '1px solid #ffeaa7',
      borderRadius: '8px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
        🚨 Equipment Replacement Alerts
      </h4>
      {priorities.slice(0, 3).map((item, index) => (
        <div key={`${item.room}-${item.category}`} style={{ 
          marginBottom: '8px', 
          fontSize: '14px',
          color: item.priority === 'CRITICAL' ? '#721c24' : '#856404'
        }}>
          <strong>{item.priority}:</strong> Room {item.room} - Replace {item.category} 
          ({item.count} repairs, save ${item.costSavings.toFixed(0)})
        </div>
      ))}
    </div>
  );
};

  Object.keys(maintenanceMonthlyData).forEach(category => {
    maintenanceMonthlyData[category].forEach((count, month) => {
      const quarter = getQuarter(month);
      quarterlyData[category][quarter] += count;
    });
  });

  const prescriptiveSuggestions = Object.entries(quarterlyData).map(([category, quarters]) => {
    const maxQuarter = Object.entries(quarters).reduce((max, current) => current[1] > max[1] ? current : max);
    if (maxQuarter[1] === 0) {
      return `No significant maintenance activity for ${category}.`;
    }
    return `Schedule preventive maintenance for ${category} during ${maxQuarter[0]} (high volume: ${maxQuarter[1]} requests).`;
  });

  useEffect(() => {
    const fetchTenantGrowth = async () => {
      try {
        const usersRef = collection(firestore, "users");
        const snapshot = await getDocs(usersRef);

        const monthlyCounts = Array(12).fill(0);
        const currentYear = new Date().getFullYear();

        snapshot.forEach(doc => {
          const data = doc.data();
          // Support both created_at and dateCreated fields
          let createdAt = data.created_at || data.dateCreated;

          if (createdAt) {
            if (createdAt.toDate) {
              createdAt = createdAt.toDate();
            } else {
              createdAt = new Date(createdAt);
            }

            // Only count tenants created this year
            if (createdAt.getFullYear() === currentYear) {
              const month = createdAt.getMonth();
              monthlyCounts[month]++;
            }
          }
        });

        setTenantGrowthData({
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          datasets: [{
            label: "New Tenants",
            data: monthlyCounts,
            borderColor: "#A0C878",
            backgroundColor: "rgba(160, 200, 120, 0.1)",
            tension: 0.4,
            fill: true,
            pointBackgroundColor: "#A0C878",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          }]
        });
      } catch (error) {
        console.error("Error fetching tenant growth data:", error);
      }
    };

    fetchTenantGrowth();
  }, []);

  const maintenanceChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Airconditioning",
        data: maintenanceMonthlyData.Airconditioning,
        backgroundColor: "#A0C878",
        borderRadius: 8,
      },
      {
        label: "Plumbing",
        data: maintenanceMonthlyData.Plumbing,
        backgroundColor: "#2196F3",
        borderRadius: 8,
      },
      {
        label: "Electrical",
        data: maintenanceMonthlyData.Electrical,
        backgroundColor: "#FFC107",
        borderRadius: 8,
      },
      {
        label: "PestControl",
        data: maintenanceMonthlyData.PestControl,
        backgroundColor: "#9C27B0",
        borderRadius: 8,
      },
      {
        label: "Cleaning",
        data: maintenanceMonthlyData.Cleaning,
        backgroundColor: "#00BCD4",
        borderRadius: 8,
      },
      {
        label: "Others",
        data: maintenanceMonthlyData.Others,
        backgroundColor: "#795548",
        borderRadius: 8,
      },
    ],
  };

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activitiesRef = collection(firestore, 'activityLogs');
        const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        const activityList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActivities(activityList);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
    // Set up real-time listener for activities
    const activitiesRef = collection(firestore, 'activityLogs');
    const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activityList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActivities(activityList);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="dashboard-container">
      <QuickActionsPanel
        onAddAnnouncement={handleAddAnnouncement}
        onTrashCollection={handleTrashCollection}
        onAddTenant={handleAddTenant}
      />
      
      <div className="dashboard-grid">
        <div className="grid-item tenant-stats">
          <div className="tenant-card-container">
            <div className="tenant-left"><FaUsers className="tenant-icon" /></div>
            <div className="tenant-right">
              <h2 className="tenant-title">Active Tenant's User</h2>
              <div className="tenant-count">{tenantsCount}</div>
              <div className="tenant-divider"></div>
              <p className="tenant-month-update">+2 tenants for this month</p>
            </div>
          </div>
        </div>

        <div className="grid-item tenant-stats">
          <div className="tenant-card-container">
            <div className="tenant-left"><FaUsers className="tenant-icon" /></div>
            <div className="tenant-right">
              <h2 className="tenant-title">Guest Visited</h2>
              <div className="tenant-count">4</div>
              <div className="tenant-divider"></div>
              <p className="tenant-month-update">4 guests this month</p>
            </div>
          </div>
        </div>

        <div className="grid-item tenant-stats">
          <div className="tenant-card-container">
            <div className="tenant-left"><FaDoorOpen className="tenant-icon" /></div>
            <div className="tenant-right">
              <h2 className="tenant-title">Available Rooms</h2>
              <div className="tenant-count">{availableRooms}</div>
              <div className="tenant-divider"></div>
              <p className="tenant-month-update">{getRoomUpdateText()}</p>
            </div>
          </div>
        </div>

        <div className="grid-item tenant-stats">
          <div className="tenant-card-container">
            <div className="tenant-left"><FaTools className="tenant-icon" /></div>
            <div className="tenant-right">
              <h2 className="tenant-title">Maintenance Requests</h2>
              <div className="tenant-count">{maintenanceRequestsThisMonth}</div>
              <div className="tenant-divider"></div>
              <p className="tenant-month-update">
                +{maintenanceRequestsThisMonth} maintenance request{maintenanceRequestsThisMonth !== 1 ? 's' : ''} this month
              </p>
            </div>
          </div>
        </div>

        <div className="grid-item maintenance-chart">
        <div className="chart-container">
          <h2>Maintenance Tasks Overview</h2>
          <ReplacementAlerts />
          <Bar 
            data={maintenanceChartData}
            options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top",
                    labels: { font: { size: 14, family: "'Roboto', sans-serif" }, padding: 10 },
                  },
                  tooltip: {
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    cornerRadius: 4,
                    padding: 8,
                  },
                },
                scales: {
                  x: {
                    type: "category",
                    title: { display: true, text: "Month", font: { size: 14, family: "'Roboto', sans-serif" } },
                    grid: { display: false },
                  },
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Number of Fixing", font: { size: 14, family: "'Roboto', sans-serif" } },
                    grid: { color: "#E0E0E0" },
                  },
                },
              }}
            />
              <div style={{ marginTop: '20px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '10px', fontFamily: "'Roboto', sans-serif" }}>
                  MAINTENANCE RECOMMENDATIONS:
                </h3>
                {loadingAI ? (
                  <div style={{ display: 'flex', alignItems: 'center', fontFamily: "'Roboto', sans-serif" }}>
                    <div style={{ marginRight: '10px' }}>🔄 Analyzing maintenance data...</div>
                  </div>
                ) : (
                  <div style={{ 
                    fontFamily: "'Roboto', sans-serif", 
                    fontSize: '14px', 
                    color: '#555',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.6',
                    maxHeight: '600px',
                    overflowY: 'auto'
                  }}>
                    {aiRecommendations}
                  </div>
                )}
              </div>
            </div>
          </div>

        <div className="grid-item room-maintenance-overview">
  <div className="chart-container">
    <h2>Room-Based Maintenance Overview</h2>
    <div style={{ marginBottom: '20px' }}>
      <label htmlFor="floor-select" style={{ marginRight: '10px', fontFamily: "'Roboto', sans-serif" }}>
        Select Floor:
      </label>
      <select 
        id="floor-select"
        value={selectedFloor} 
        onChange={(e) => setSelectedFloor(parseInt(e.target.value))}
        style={{ 
          padding: '8px', 
          borderRadius: '4px', 
          border: '1px solid #ccc',
          fontFamily: "'Roboto', sans-serif"
        }}
      >
        {Object.keys(getAllFloorsAndRooms()).map(floor => (
          <option key={floor} value={floor}>Floor {floor}</option>
        ))}
      </select>
    </div>
    
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
      gap: '15px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      {generateRoomNumbers(selectedFloor).map(room => {
  const roomData = roomMaintenanceData[room] || { total: 0 };
  const hasIssues = roomData.total > 0;
  // Find if any category has 2 or more requests
  const highFrequencyCategory = Object.entries(roomData)
    .filter(([key, value]) => key !== 'total' && value >= 2)
    .sort(([,a], [,b]) => b - a)[0];
  // Needs attention if any category has 2+ or total issues >= 3
  const needsAttention = (highFrequencyCategory && highFrequencyCategory[1] >= 2) || roomData.total >= 3;
  return (
    <div 
      key={room}
      style={{
        padding: '15px',
        borderRadius: '8px',
        border: needsAttention ? '2px solid #e74c3c' : hasIssues ? '2px solid #ff6b6b' : '1px solid #e0e0e0',
        backgroundColor: needsAttention ? '#fdf2f2' : hasIssues ? '#fff5f5' : '#f9f9f9',
        fontFamily: "'Roboto', sans-serif"
      }}
    >
      <h4 style={{ margin: '0 0 10px 0', color: needsAttention ? '#c0392b' : hasIssues ? '#d63031' : '#2d3436' }}>
        Room {room}
      </h4>
      <div style={{ fontSize: '12px', color: '#636e72' }}>
        <div>Total Issues: {roomData.total}</div>
        {hasIssues && (
          <div style={{ marginTop: '8px' }}>
            {Object.entries(roomData).filter(([key, value]) => 
              key !== 'total' && value > 0
            ).map(([category, count]) => (
              <div key={category}>{category}: {count}</div>
            ))}
          </div>
        )}
      </div>
      {needsAttention && highFrequencyCategory && highFrequencyCategory[1] >= 2 && (
        <div style={{ 
          marginTop: '10px', 
          padding: '5px 8px', 
          backgroundColor: '#e74c3c', 
          color: 'white', 
          borderRadius: '4px', 
          fontSize: '10px',
          textAlign: 'center'
        }}>
          NEEDS ATTENTION ({highFrequencyCategory[0].toUpperCase()})
        </div>
      )}
      {needsAttention && (!highFrequencyCategory || highFrequencyCategory[1] < 2) && roomData.total >= 3 && (
        <div style={{ 
          marginTop: '10px', 
          padding: '5px 8px', 
          backgroundColor: '#ff6b6b', 
          color: 'white', 
          borderRadius: '4px', 
          fontSize: '10px',
          textAlign: 'center'
        }}>
          NEEDS ATTENTION
        </div>
      )}
    </div>
  );
})}
    </div>
    
    <div style={{ 
      marginTop: '20px', 
      padding: '15px', 
      backgroundColor: '#e8f4fd', 
      borderRadius: '8px',
      fontFamily: "'Roboto', sans-serif"
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Floor {selectedFloor} Summary:</h4>
      <div style={{ fontSize: '14px', color: '#2d3436' }}>
        <div>Rooms with issues: {generateRoomNumbers(selectedFloor).filter(room => 
          roomMaintenanceData[room]?.total > 0
        ).length} / {generateRoomNumbers(selectedFloor).length}</div>
        <div style={{ color: '#e74c3c', marginTop: '5px' }}>
          Rooms needing equipment replacement: {generateRoomNumbers(selectedFloor).filter(room => 
            roomMaintenanceData[room]?.total >= 3
          ).length}
        </div>
      </div>
    </div>
  </div>
</div>

        <div className="grid-item growth-chart">
          <div className="tenant-growth-container">
            <h2>Tenant Growth Overview</h2>
            <div style={{ height: "300px" }}>
              <Line 
                data={tenantGrowthData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                      labels: { font: { size: 14, family: "'Roboto', sans-serif" }, padding: 10 },
                    },
                    tooltip: {
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      titleColor: "#fff",
                      bodyColor: "#fff",
                      cornerRadius: 4,
                      padding: 8,
                    },
                  },
                  scales: {
                    x: {
                      type: "category",
                      title: { display: true, text: "Month", font: { size: 14, family: "'Roboto', sans-serif" } },
                      grid: { display: false },
                    },
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: "Number of New Tenants", font: { size: 14, family: "'Roboto', sans-serif" } },
                      grid: { color: "#E0E0E0" },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
