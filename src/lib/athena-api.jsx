
// Get UpToDate API configuration
const getUpToDateConfig = () => {
  return {
    baseUrl: process.env.UPTODATE_API_BASE_URL || 'https://api.uptodate.com/v1',
    apiKey: process.env.UPTODATE_API_KEY || ''
  };
};

// Class for UpToDate API integration
class UpToDateAPI {
  constructor() {
    this.config = getUpToDateConfig();
  }
  
  async getBillingCodes(query) {
    try {
      const response = await fetch(`${this.config.baseUrl}/billing-codes/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`UpToDate API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching billing codes:', error);
      throw error;
    }
  }
}

// Get Athena API configuration
const getAthenaConfig = () => {
  return {
    baseUrl: process.env.ATHENA_API_BASE_URL || 'https://api.athenahealth.com/v1',
    clientId: process.env.ATHENA_CLIENT_ID || '',
    clientSecret: process.env.ATHENA_CLIENT_SECRET || ''
  };
};

// Class for Athena API integration
class AthenaAPI {
  constructor() {
    this.config = getAthenaConfig();
    this.token = null;
    this.tokenExpiry = null;
  }
  
  async getToken() {
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }
    
    try {
      const response = await fetch(`${this.config.baseUrl}/oauth2/v1/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.token = data.access_token;
      
      const expiresIn = (data.expires_in || 3600) - 300;
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
      
      return this.token;
    } catch (error) {
      console.error('Error getting Athena API token:', error);
      throw error;
    }
  }
  
  async request(endpoint, method = 'GET', data) {
    try {
      const token = await this.getToken();
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };
      
      if (method !== 'GET' && data) {
        headers['Content-Type'] = 'application/json';
      }
      
      const url = `${this.config.baseUrl}/${endpoint}`;
      
      const options = {
        method,
        headers
      };
      
      if (method !== 'GET' && data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Athena API error (${response.status}): ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error in Athena API request to ${endpoint}:`, error);
      throw error;
    }
  }
  
  async getPatient(patientId) {
    return this.request(`patients/${patientId}`);
  }
  
  async searchPatients(searchParams) {
    const queryParams = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
    
    return this.request(`patients/search?${queryParams.toString()}`);
  }
  
  async getAppointmentsForDate(date) {
    return this.request(`appointments/booked?appointmentdate=${date}`);
  }
  
  async getAppointmentDetails(appointmentId) {
    return this.request(`appointments/${appointmentId}`);
  }
  
  async getPatientMedicalHistory(patientId) {
    return this.request(`patients/${patientId}/medicalhistory`);
  }
  
  async getPatientMedications(patientId) {
    return this.request(`patients/${patientId}/medications`);
  }
  
  async getPatientAllergies(patientId) {
    return this.request(`patients/${patientId}/allergies`);
  }
  
  async getPatientLabResults(patientId) {
    return this.request(`patients/${patientId}/documents/labresults`);
  }
  
  async updateAppointment(appointmentId, appointmentData) {
    return this.request(`appointments/${appointmentId}`, 'PUT', appointmentData);
  }
  
  async cancelAppointment(appointmentId, reason) {
    return this.request(`appointments/${appointmentId}/cancel`, 'POST', { reason });
  }
  
  async addClinicalNotes(appointmentId, notes) {
    return this.request(`appointments/${appointmentId}/notes`, 'POST', { notes });
  }
}

// Export singleton instances
export const upToDateApi = new UpToDateAPI();
export const athenaApi = new AthenaAPI();
