import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://experessgo-backend-1.onrender.com/api';

// Offline fallback recommendations (shown when backend is unreachable)
const FALLBACK_RECOMMENDATIONS = [
  {
    id: 1,
    source: 'Addis Ababa',
    destination: 'Hawassa',
    reason: 'Top Rated Destination',
    next_bus: '08:30 AM',
    price: '550 ETB',
  },
  {
    id: 2,
    source: 'Addis Ababa',
    destination: 'Adama',
    reason: 'Most Booked Route',
    next_bus: '11:00 AM',
    price: '350 ETB',
  },
  {
    id: 3,
    source: 'Bahir Dar',
    destination: 'Addis Ababa',
    reason: 'Weekend Special',
    next_bus: '06:00 AM',
    price: '650 ETB',
  },
];

const OFFLINE_CHAT_RESPONSE =
  "I'm currently in offline mode — the server is warming up. " +
  'You can still search for buses using the search bar above. ' +
  'Popular routes: Addis Ababa → Adama (350 ETB), Addis Ababa → Hawassa (550 ETB), Bahir Dar → Addis Ababa (650 ETB).';

const aiService = {
  getRecommendations: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ai/recommendations/`, {
        timeout: 8000,
      });
      return response.data;
    } catch (error) {
      console.warn('AI Recommendations unreachable, using fallback:', error.message);
      // Return static fallback so the page always renders
      return FALLBACK_RECOMMENDATIONS;
    }
  },

  chat: async (message) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/ai/chat/`,
        { message },
        { 
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
      return response.data; // { response: "..." }
    } catch (error) {
      if (error.response?.status === 405) {
        console.error("Method Not Allowed: Check if the endpoint expects POST.");
      } else {
        console.warn('AI Chat unreachable, using offline fallback:', error.message);
      }
      // Return a friendly offline message instead of throwing
      return { response: OFFLINE_CHAT_RESPONSE };
    }
  },
};

export default aiService;
