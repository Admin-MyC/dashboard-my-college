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

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const apiClient = {
  // Fetch system & MongoDB status
  async getStatus(): Promise<SystemStatusResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(`${API_BASE}/status`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // Direct Database User Login Authentication (Queries MongoDB Atlas)
  async login(
    usuarioLogin: string,
    password: string,
    overrideSession = false,
    device?: string,
    sessionId?: string
  ): Promise<{
    success: boolean;
    user?: any;
    sessionId?: string;
    error?: string;
    code?: string;
    activeSession?: any;
  }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioLogin, password, overrideSession, device, sessionId }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        return {
          success: false,
          code: 'INVALID_SERVER_RESPONSE',
          error: 'No se pudo contactar el servicio de autenticación en la base de datos.',
        };
      }
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        code: 'NETWORK_ERROR',
        error: 'Error de conexión con el servidor de la base de datos.',
      };
    }
  },

  // Bootstrap initial dataset (supports optional colegioId scoping for high-volume speed)
  async getBootstrapData(colegioId?: string | null): Promise<any | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const url = colegioId
        ? `${API_BASE}/bootstrap?colegioId=${encodeURIComponent(colegioId)}`
        : `${API_BASE}/bootstrap`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  // College actions
  async updateCollege(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/colleges/${id}`, {
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
      const res = await fetch(`${API_BASE}/colleges/${id}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escudoUrl, primario, secundario }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateCollegeReportCardDesign(
    id: string,
    disenoBoleta: any,
    periodicidadEvaluacion?: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/colleges/${id}/report-card-design`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disenoBoleta, periodicidadEvaluacion }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async createCollege(college: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/colleges`, {
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
      const res = await fetch(`${API_BASE}/colleges/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async saveCollegeDeletionKey(
    id: string,
    payload: {
      claveBajaCodigo: string;
      claveBajaExpiraEn: number;
      claveBajaGeneradaPor?: string;
    }
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/colleges/${id}/deletion-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getCollegeDeletionKey(
    id: string
  ): Promise<{ claveBajaCodigo: string; claveBajaExpiraEn: number; claveBajaGeneradaPor?: string } | null> {
    try {
      const res = await fetch(`${API_BASE}/colleges/${id}/deletion-key`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async getSupportAccessRequests(): Promise<Record<string, any> | null> {
    try {
      const res = await fetch(`${API_BASE}/support-access-requests`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createSupportAccessRequest(payload: any): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/support-access-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async respondSupportAccessRequest(
    colegioId: string,
    status: 'accepted' | 'rejected'
  ): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/support-access-requests/${colegioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async clearSupportAccessRequest(colegioId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/support-access-requests/${colegioId}`, {
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
      const res = await fetch(`${API_BASE}/users`, {
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
      const res = await fetch(`${API_BASE}/users/${id}`, {
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
      const res = await fetch(`${API_BASE}/users/${id}`, {
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
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async createStudentsBulk(students: any[], colegioId?: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/students/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students, colegioId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateStudent(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/students/${id}`, {
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
      const res = await fetch(`${API_BASE}/students/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Preenrollment Form Config actions
  async updatePreenrollmentConfig(colegioId: string, config: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/preenrollment-configs/${colegioId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Preenrollment Request actions
  async createPreenrollment(data: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/preenrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updatePreenrollment(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/preenrollments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Teacher actions
  async createTeacher(teacher: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacher),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateTeacher(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/teachers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteTeacher(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/teachers/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Subject actions
  async createSubject(subject: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subject),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Grade actions
  async createGrade(grade: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grade),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateGrade(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/grades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteGrade(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/grades/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Incident actions
  async createIncident(incident: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateIncident(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteIncident(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/incidents/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Psychology actions
  async createPsychology(record: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/psychology`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deletePsychology(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/psychology/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updatePsychology(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/psychology/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Library actions
  async createLibraryBook(book: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteLibraryBook(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/library/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Notice actions
  async createNotice(notice: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notice),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateNotice(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/notices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteNotice(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/notices/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Activity actions
  async createActivity(activity: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateActivity(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteActivity(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Tasks & Exams actions
  async createTaskOrExam(item: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/tasks-exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateTaskOrExam(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/tasks-exams/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteTaskOrExam(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/tasks-exams/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Attendance actions
  async createAttendance(record: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateAttendance(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/attendance/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteAttendance(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/attendance/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateSubject(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/subjects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteSubject(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/subjects/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Campuses (per college)
  async createCampus(campus: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/campuses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campus),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateCampus(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/campuses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteCampus(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/campuses/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // School Cycles (per college)
  async createSchoolCycle(cycle: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/school-cycles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cycle),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateSchoolCycle(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/school-cycles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteSchoolCycle(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/school-cycles/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Calendar Days (per college)
  async createCalendarDay(day: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/calendar-days`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(day),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateCalendarDay(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/calendar-days/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteCalendarDay(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/calendar-days/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Group Schedules (per college)
  async saveGroupSchedule(schedule: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/group-schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteGroupSchedule(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/group-schedules/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Monthly Tuitions (per college)
  async saveMonthlyTuition(record: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/monthly-tuitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Billing Concepts (per college)
  async createBillingConcept(concept: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/billing-concepts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(concept),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateBillingConcept(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/billing-concepts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteBillingConcept(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/billing-concepts/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Student Discounts (Descuentos y Becas per college)
  async createStudentDiscount(discount: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/student-discounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discount),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateStudentDiscount(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/student-discounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteStudentDiscount(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/student-discounts/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Evaluation Concepts, Saved Periods & Student Evaluations (per college)
  async createEvaluationConcept(concept: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/evaluation-concepts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(concept),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateEvaluationConcept(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/evaluation-concepts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteEvaluationConcept(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/evaluation-concepts/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async saveEvaluationPeriod(period: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/evaluation-periods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(period),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteEvaluationPeriod(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/evaluation-periods/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async saveStudentEvaluation(entry: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/student-evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteStudentEvaluation(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/student-evaluations/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Activity Logs
  async createActivityLog(log: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/activity-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Cafeteria Products
  async getCafeteriaProducts(colegioId?: string): Promise<any[] | null> {
    try {
      const url = colegioId ? `${API_BASE}/cafeteria/products?colegioId=${encodeURIComponent(colegioId)}` : `${API_BASE}/cafeteria/products`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createCafeteriaProduct(product: any): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/cafeteria/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateCafeteriaProduct(id: string, updates: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/cafeteria/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteCafeteriaProduct(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/cafeteria/products/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Cafeteria Orders
  async getCafeteriaOrders(params?: { colegioId?: string; tutorId?: string; estudianteId?: string }): Promise<any[] | null> {
    try {
      const query = new URLSearchParams();
      if (params?.colegioId) query.set('colegioId', params.colegioId);
      if (params?.tutorId) query.set('tutorId', params.tutorId);
      if (params?.estudianteId) query.set('estudianteId', params.estudianteId);
      const url = `${API_BASE}/cafeteria/orders${query.toString() ? `?${query.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async createCafeteriaOrder(order: any): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE}/cafeteria/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateCafeteriaOrderStatus(id: string, estado: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/cafeteria/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deliverCafeteriaOrder(params: {
    orderId: string;
    qrCodeRaw?: string;
    scannedStudentId?: string;
    scannedMatricula?: string;
    scannedCurp?: string;
    entregadoPor?: string;
  }): Promise<{ success: boolean; validMatch?: boolean; message?: string; order?: any }> {
    try {
      const res = await fetch(`${API_BASE}/cafeteria/orders/${params.orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },
};
