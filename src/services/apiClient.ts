// Frontend API client to talk to the backend Express / MongoDB API
export interface DatabaseStatus {
  connected: boolean;
  state: string;
  dbName: string | null;
  host: string | null;
  error: string | null;
}

export interface SystemStatusResponse {
  status: string;
  uptime: number;
  timestamp: string;
  database: DatabaseStatus;
  stats: {
    collegesCount: number;
    usersCount: number;
    studentsCount: number;
  };
}

export const apiClient = {
  // Fetch system & MongoDB status
  async getStatus(): Promise<SystemStatusResponse | null> {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Bootstrap initial dataset
  async getBootstrapData(): Promise<any | null> {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // College actions
  async updateCollege(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`/api/colleges/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateCollegeBranding(
    id: string,
    escudoUrl: string,
    primario: string,
    secundario: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`/api/colleges/${id}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escudoUrl, primario, secundario }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async createCollege(college: any): Promise<boolean> {
    try {
      const res = await fetch('/api/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(college),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteCollege(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/colleges/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // User actions
  async createUser(user: any): Promise<boolean> {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateUser(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Student actions
  async createStudent(student: any): Promise<boolean> {
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateStudent(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteStudent(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
