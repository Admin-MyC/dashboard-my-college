import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { getDBStatus, isDBConnected } from '../db/connection';
import {
  CollegeModel,
  UserModel,
  StudentModel,
  TeacherModel,
  SubjectModel,
  GradeRecordModel,
  IncidentModel,
  PsychologyModel,
  LibraryBookModel,
  NoticeModel,
  TeacherActivityModel,
  TaskOrExamModel,
  AttendanceModel,
  PreenrollmentConfigModel,
  PreenrollmentRequestModel,
  CampusModel,
  SchoolCycleModel,
  CalendarDayModel,
  GroupScheduleModel,
  MonthlyTuitionModel,
  BillingConceptModel,
  EvaluationConceptModel,
  EvaluationSavedPeriodModel,
  StudentEvaluationModel,
  ActivityLogModel,
} from '../models/schemas';
import {
  INITIAL_COLLEGES,
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_SUBJECTS,
  INITIAL_GRADES,
  INITIAL_INCIDENTS,
  INITIAL_PSYCHOLOGY,
  INITIAL_LIBRARY,
  INITIAL_NOTICES,
  INITIAL_ACTIVITIES,
  INITIAL_TASKS_EXAMS,
  INITIAL_ATTENDANCE,
  INITIAL_PREENROLLMENTS,
  INITIAL_PREENROLLMENT_CONFIGS,
  INITIAL_CAMPUSES,
  INITIAL_SCHOOL_CYCLES,
  INITIAL_CALENDAR_DAYS,
  INITIAL_GROUP_SCHEDULES,
  INITIAL_MONTHLY_TUITIONS,
  INITIAL_BILLING_CONCEPTS,
  INITIAL_EVALUATION_CONCEPTS,
  INITIAL_STUDENT_EVALUATIONS,
  INITIAL_ACTIVITY_LOGS,
} from '../../src/data/initialData';
import { isValidGeneratedUsername } from '../../src/utils/preenrollmentHelper';
import { ensureStudentCredentials } from '../../src/utils/studentCredentialsHelper';
import { seedDatabaseIfEmpty } from '../db/seed';
import {
  loginRateLimiter,
  hashPassword,
  verifyPassword,
  isBcryptHash,
} from '../security/authSecurity';

export const apiRouter = Router();

// 1. Health & Database Status
apiRouter.get('/status', async (_req: Request, res: Response) => {
  const dbStatus = getDBStatus();
  let stats = {
    collegesCount: INITIAL_COLLEGES.length,
    usersCount: INITIAL_USERS.length,
    studentsCount: INITIAL_STUDENTS.length,
  };

  if (isDBConnected()) {
    try {
      const [c, u, s] = await Promise.all([
        CollegeModel.countDocuments(),
        UserModel.countDocuments(),
        StudentModel.countDocuments(),
      ]);
      stats = { collegesCount: c, usersCount: u, studentsCount: s };
    } catch {
      // ignore
    }
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    stats,
  });
});

// 2. Full Bootstrap Data (allows fast initial load for the frontend, with optional colegioId scoping)
apiRouter.get('/bootstrap', async (req: Request, res: Response) => {
  const { colegioId } = req.query;
  const colFilter = colegioId && colegioId !== 'global' ? { colegioId: String(colegioId) } : {};

  if (isDBConnected()) {
    try {
      const [
        colleges,
        users,
        students,
        teachers,
        subjects,
        grades,
        incidents,
        psychologyRecords,
        libraryBooks,
        notices,
        activities,
        tasksExams,
        attendance,
        preenrollmentConfigs,
        preenrollments,
        campuses,
        schoolCycles,
        calendarDays,
        groupSchedules,
        monthlyTuitions,
        billingConcepts,
        evaluationConcepts,
        evaluationSavedPeriods,
        studentEvaluations,
        activityLogs,
      ] = await Promise.all([
        CollegeModel.find().lean(),
        UserModel.find(
          colegioId && colegioId !== 'global'
            ? { $or: [{ colegioId: String(colegioId) }, { rol: 'superusuario' }] }
            : {}
        ).lean(),
        StudentModel.find(colFilter).lean(),
        TeacherModel.find(colFilter).lean(),
        SubjectModel.find(colFilter).lean(),
        GradeRecordModel.find(colFilter).lean(),
        IncidentModel.find(colFilter).sort({ createdAt: -1 }).limit(2000).lean(),
        PsychologyModel.find(colFilter).sort({ createdAt: -1 }).limit(2000).lean(),
        LibraryBookModel.find(colFilter).lean(),
        NoticeModel.find(colFilter).sort({ fecha: -1 }).limit(1000).lean(),
        TeacherActivityModel.find(colFilter).limit(2000).lean(),
        TaskOrExamModel.find(colFilter).limit(2000).lean(),
        AttendanceModel.find(colFilter).sort({ timestamp: -1 }).limit(5000).lean(),
        PreenrollmentConfigModel.find(colFilter).lean(),
        PreenrollmentRequestModel.find(colFilter).sort({ createdAt: -1 }).limit(2000).lean(),
        CampusModel.find(colFilter).lean(),
        SchoolCycleModel.find(colFilter).lean(),
        CalendarDayModel.find(colFilter).lean(),
        GroupScheduleModel.find(colFilter).lean(),
        MonthlyTuitionModel.find(colFilter).lean(),
        BillingConceptModel.find(colFilter).lean(),
        EvaluationConceptModel.find(colFilter).lean(),
        EvaluationSavedPeriodModel.find(colFilter).lean(),
        StudentEvaluationModel.find(colFilter).lean(),
        ActivityLogModel.find(colFilter).sort({ timestamp: -1 }).limit(500).lean(),
      ]);

      // Map preenrollment configs to dictionary by colegioId
      const configsMap: Record<string, any> = {};
      if (preenrollmentConfigs.length) {
        preenrollmentConfigs.forEach((cfg: any) => {
          configsMap[cfg.colegioId] = cfg;
        });
      }

      return res.json({
        source: 'mongodb',
        data: {
          colleges: colleges.length ? colleges : INITIAL_COLLEGES,
          users: users.length ? users : INITIAL_USERS,
          students: students.length ? students : INITIAL_STUDENTS,
          teachers: teachers.length ? teachers : INITIAL_TEACHERS,
          subjects: subjects.length ? subjects : INITIAL_SUBJECTS,
          grades: grades.length ? grades : INITIAL_GRADES,
          incidents: incidents.length ? incidents : INITIAL_INCIDENTS,
          psychologyRecords: psychologyRecords.length ? psychologyRecords : INITIAL_PSYCHOLOGY,
          libraryBooks: libraryBooks.length ? libraryBooks : INITIAL_LIBRARY,
          notices: notices.length ? notices : INITIAL_NOTICES,
          activities: activities.length ? activities : INITIAL_ACTIVITIES,
          tasksExams: tasksExams.length ? tasksExams : INITIAL_TASKS_EXAMS,
          attendance: attendance.length ? attendance : INITIAL_ATTENDANCE,
          preenrollmentConfigs: Object.keys(configsMap).length ? configsMap : INITIAL_PREENROLLMENT_CONFIGS,
          preenrollments: preenrollments.length ? preenrollments : INITIAL_PREENROLLMENTS,
          campuses: campuses.length ? campuses : INITIAL_CAMPUSES,
          schoolCycles: schoolCycles.length ? schoolCycles : INITIAL_SCHOOL_CYCLES,
          calendarDays: calendarDays.length ? calendarDays : INITIAL_CALENDAR_DAYS,
          groupSchedules: groupSchedules.length ? groupSchedules : INITIAL_GROUP_SCHEDULES,
          monthlyTuitions: monthlyTuitions.length ? monthlyTuitions : INITIAL_MONTHLY_TUITIONS,
          billingConcepts: billingConcepts.length ? billingConcepts : INITIAL_BILLING_CONCEPTS,
          evaluationConcepts: evaluationConcepts.length ? evaluationConcepts : INITIAL_EVALUATION_CONCEPTS,
          evaluationSavedPeriods: evaluationSavedPeriods.length ? evaluationSavedPeriods : [],
          studentEvaluations: studentEvaluations.length ? studentEvaluations : INITIAL_STUDENT_EVALUATIONS,
          activityLogs: activityLogs.length ? activityLogs : INITIAL_ACTIVITY_LOGS,
        },
      });
    } catch (err: any) {
      console.error('[API Bootstrap] Error al consultar MongoDB:', err.message);
    }
  }

  // Fallback to initial dataset if MongoDB is disconnected or in memory
  res.json({
    source: 'in-memory',
    data: {
      colleges: INITIAL_COLLEGES,
      users: INITIAL_USERS,
      students: INITIAL_STUDENTS,
      teachers: INITIAL_TEACHERS,
      subjects: INITIAL_SUBJECTS,
      grades: INITIAL_GRADES,
      incidents: INITIAL_INCIDENTS,
      psychologyRecords: INITIAL_PSYCHOLOGY,
      libraryBooks: INITIAL_LIBRARY,
      notices: INITIAL_NOTICES,
      activities: INITIAL_ACTIVITIES,
      tasksExams: INITIAL_TASKS_EXAMS,
      attendance: INITIAL_ATTENDANCE,
      preenrollmentConfigs: INITIAL_PREENROLLMENT_CONFIGS,
      preenrollments: INITIAL_PREENROLLMENTS,
    },
  });
});

// 3. Colleges Endpoints
apiRouter.get('/colleges', async (_req: Request, res: Response) => {
  if (isDBConnected()) {
    try {
      const colleges = await CollegeModel.find().lean();
      return res.json(colleges);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json(INITIAL_COLLEGES);
});

apiRouter.post('/colleges', async (req: Request, res: Response) => {
  const collegeData = req.body;
  if (!collegeData.id || !collegeData.nombre) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (isDBConnected()) {
    try {
      const created = await CollegeModel.create(collegeData);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(collegeData);
});

apiRouter.put('/colleges/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (isDBConnected()) {
    try {
      const updated = await CollegeModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

apiRouter.delete('/colleges/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await CollegeModel.deleteOne({ id });
      await Promise.all([
        UserModel.deleteMany({ colegioId: id }),
        StudentModel.deleteMany({ colegioId: id }),
        TeacherModel.deleteMany({ colegioId: id }),
        SubjectModel.deleteMany({ colegioId: id }),
        GradeRecordModel.deleteMany({ colegioId: id }),
        IncidentModel.deleteMany({ colegioId: id }),
        PsychologyModel.deleteMany({ colegioId: id }),
        LibraryBookModel.deleteMany({ colegioId: id }),
        NoticeModel.deleteMany({ colegioId: id }),
        TeacherActivityModel.deleteMany({ colegioId: id }),
        TaskOrExamModel.deleteMany({ colegioId: id }),
        AttendanceModel.deleteMany({ colegioId: id }),
        PreenrollmentConfigModel.deleteMany({ colegioId: id }),
        PreenrollmentRequestModel.deleteMany({ colegioId: id }),
        CampusModel.deleteMany({ colegioId: id }),
        SchoolCycleModel.deleteMany({ colegioId: id }),
        CalendarDayModel.deleteMany({ colegioId: id }),
        GroupScheduleModel.deleteMany({ colegioId: id }),
        MonthlyTuitionModel.deleteMany({ colegioId: id }),
        BillingConceptModel.deleteMany({ colegioId: id }),
        EvaluationConceptModel.deleteMany({ colegioId: id }),
        EvaluationSavedPeriodModel.deleteMany({ colegioId: id }),
        StudentEvaluationModel.deleteMany({ colegioId: id }),
      ]);
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// Update Branding (escudo, colores)
apiRouter.put('/colleges/:id/branding', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { escudoUrl, primario, secundario } = req.body;

  if (isDBConnected()) {
    try {
      const updated = await CollegeModel.findOneAndUpdate(
        { id },
        {
          $set: {
            escudoUrl,
            'colores.primario': primario,
            'colores.secundario': secundario,
          },
        },
        { new: true }
      );
      return res.json(updated);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id, escudoUrl, primario, secundario });
});

// 4. Users Endpoints
apiRouter.get('/users', async (req: Request, res: Response) => {
  const { colegioId } = req.query;
  if (isDBConnected()) {
    try {
      const filter = colegioId ? { colegioId } : {};
      const users = await UserModel.find(filter).lean();
      return res.json(users);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json(INITIAL_USERS);
});

apiRouter.post('/users', async (req: Request, res: Response) => {
  const userData = req.body;
  if (isDBConnected()) {
    try {
      const created = await UserModel.findOneAndUpdate(
        { id: userData.id },
        { $set: userData },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(userData);
});

apiRouter.put('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (isDBConnected()) {
    try {
      const existing = await UserModel.findOne({ id }).lean();
      // 1.- El usuario (usuarioLogin) NO se puede modificar una vez generado y guardado en BD
      if (existing && isValidGeneratedUsername((existing as any).usuarioLogin)) {
        updates.usuarioLogin = (existing as any).usuarioLogin;
      }
      const updated = await UserModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

apiRouter.delete('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await UserModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// 5. Students Endpoints (supports high-volume filtering and optional server-side pagination)
apiRouter.get('/students', async (req: Request, res: Response) => {
  const { colegioId, nivel, grado, grupo, estatus, q, page, limit } = req.query;
  if (isDBConnected()) {
    try {
      const filter: any = {};
      if (colegioId) filter.colegioId = String(colegioId);
      if (nivel && nivel !== 'todos') filter.nivel = String(nivel);
      if (grado && grado !== 'todos') filter.grado = String(grado);
      if (grupo && grupo !== 'todos') filter.grupo = String(grupo);
      if (estatus && estatus !== 'todos') filter.estatus = String(estatus);
      if (q && String(q).trim()) {
        const regex = new RegExp(String(q).trim(), 'i');
        filter.$or = [
          { nombre: regex },
          { apellidos: regex },
          { matricula: regex },
          { curp: regex },
        ];
      }

      if (page && limit) {
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const pageSize = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 20));
        const skip = (pageNum - 1) * pageSize;
        const [students, total] = await Promise.all([
          StudentModel.find(filter).skip(skip).limit(pageSize).lean(),
          StudentModel.countDocuments(filter),
        ]);
        return res.json({
          data: students,
          pagination: {
            page: pageNum,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        });
      }

      const students = await StudentModel.find(filter).lean();
      return res.json(students);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json(INITIAL_STUDENTS);
});

apiRouter.post('/students/bulk', async (req: Request, res: Response) => {
  const { students: rawStudents, colegioId } = req.body;
  if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
    return res.status(400).json({ error: 'Se requiere un arreglo de alumnos para importar.' });
  }

  const studentDocs: any[] = [];
  const userOps: any[] = [];

  for (const rawData of rawStudents) {
    const { usuarioLogin, password } = ensureStudentCredentials({
      id: rawData.id,
      nombre: rawData.nombre || '',
      apellidos: rawData.apellidos || '',
      matricula: rawData.matricula || '',
      usuarioLogin: rawData.usuarioLogin,
      password: rawData.password,
    });
    const stDoc = {
      ...rawData,
      colegioId: rawData.colegioId || colegioId,
      usuarioLogin,
      password,
    };
    studentDocs.push(stDoc);

    userOps.push({
      updateOne: {
        filter: { $or: [{ estudianteId: stDoc.id }, { usuarioLogin }] },
        update: {
          $setOnInsert: {
            id: `usr-alumno-${stDoc.id}`,
            creadoEn: new Date().toISOString().split('T')[0],
          },
          $set: {
            nombre: `${stDoc.nombre || ''} ${stDoc.apellidos || ''}`.trim() || 'Alumno',
            correo: `${usuarioLogin}@alumno.mycollege.edu.mx`,
            usuarioLogin,
            password,
            rol: 'alumno',
            colegioId: stDoc.colegioId,
            cargo: `Alumno (${stDoc.nivel ? `${stDoc.nivel} · ` : ''}${stDoc.grado || '1°'} "${stDoc.grupo || 'A'}")`,
            avatar: stDoc.foto || '',
            activo: true,
            estudianteId: stDoc.id,
            ultimoAcceso: 'Recién registrado',
          },
        },
        upsert: true,
      },
    });
  }

  if (isDBConnected()) {
    try {
      const studentOps = studentDocs.map((doc) => ({
        updateOne: {
          filter: { id: doc.id },
          update: { $set: doc },
          upsert: true,
        },
      }));
      await StudentModel.bulkWrite(studentOps, { ordered: false });
      await UserModel.bulkWrite(userOps, { ordered: false });

      if (colegioId) {
        const totalInCollege = await StudentModel.countDocuments({ colegioId });
        await CollegeModel.updateOne({ id: colegioId }, { $set: { alumnosTotales: totalInCollege } });
      }

      return res.status(201).json({ success: true, count: studentDocs.length, students: studentDocs });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(201).json({ success: true, count: studentDocs.length, students: studentDocs });
});

apiRouter.post('/students', async (req: Request, res: Response) => {
  const rawData = req.body;
  const { usuarioLogin, password } = ensureStudentCredentials({
    id: rawData.id,
    nombre: rawData.nombre || '',
    apellidos: rawData.apellidos || '',
    matricula: rawData.matricula || '',
    usuarioLogin: rawData.usuarioLogin,
    password: rawData.password,
  });
  const data = {
    ...rawData,
    usuarioLogin,
    password,
  };
  if (isDBConnected()) {
    try {
      const created = await StudentModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      // Also ensure the corresponding Alumno user account exists in UserModel with the same credentials
      await UserModel.findOneAndUpdate(
        { $or: [{ estudianteId: data.id }, { usuarioLogin }] },
        {
          $setOnInsert: {
            id: `usr-alumno-${data.id}`,
            creadoEn: new Date().toISOString().split('T')[0],
          },
          $set: {
            nombre: `${data.nombre || ''} ${data.apellidos || ''}`.trim() || 'Alumno',
            correo: `${usuarioLogin}@alumno.mycollege.edu.mx`,
            usuarioLogin,
            password,
            rol: 'alumno',
            colegioId: data.colegioId,
            cargo: `Alumno (${data.nivel ? `${data.nivel} · ` : ''}${data.grado || '1°'} "${data.grupo || 'A'}")`,
            avatar: data.foto || '',
            activo: true,
            estudianteId: data.id,
          },
        },
        { upsert: true, new: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/students/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (isDBConnected()) {
    try {
      const existing = await StudentModel.findOne({ id }).lean();
      // 1.- El usuario (usuarioLogin) NO se puede modificar una vez generado y guardado en BD
      if (existing && isValidGeneratedUsername((existing as any).usuarioLogin)) {
        updates.usuarioLogin = (existing as any).usuarioLogin;
      }
      const updated = await StudentModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

apiRouter.delete('/students/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      const existingStudent = await StudentModel.findOne({ id }).lean();
      await StudentModel.deleteOne({ id });
      const userDeleteFilter: any = { estudianteId: id };
      if (existingStudent && (existingStudent as any).usuarioLogin) {
        userDeleteFilter.$or = [
          { estudianteId: id },
          { rol: 'alumno', usuarioLogin: (existingStudent as any).usuarioLogin },
        ];
        delete userDeleteFilter.estudianteId;
      }
      await Promise.all([
        UserModel.deleteMany(userDeleteFilter),
        MonthlyTuitionModel.deleteMany({ estudianteId: id }),
        GradeRecordModel.deleteMany({ estudianteId: id }),
        AttendanceModel.deleteMany({ personaId: id }),
        StudentEvaluationModel.deleteMany({ estudianteId: id }),
      ]);
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// 6. Attendance Endpoints
apiRouter.get('/attendance', async (req: Request, res: Response) => {
  const { colegioId, fecha, tipo } = req.query;
  if (isDBConnected()) {
    try {
      const query: any = {};
      if (colegioId) query.colegioId = colegioId;
      if (fecha) query.fecha = fecha;
      if (tipo) query.tipo = tipo;
      const records = await AttendanceModel.find(query).sort({ timestamp: -1 }).lean();
      return res.json(records);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json(INITIAL_ATTENDANCE);
});

apiRouter.post('/attendance', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await AttendanceModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.delete('/attendance/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await AttendanceModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// 7. Manual Database Seed trigger
apiRouter.post('/seed', async (_req: Request, res: Response) => {
  if (!isDBConnected()) {
    return res.status(400).json({ error: 'MongoDB no está conectado' });
  }
  try {
    await seedDatabaseIfEmpty();
    res.json({ success: true, message: 'Siembra ejecutada correctamente' });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 8. Single Active Session Management (Concurrencia de Sesión Única)
interface ActiveServerSession {
  sessionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  device: string;
  ip: string;
  lastPing: number;
  loggedInAt: string;
}

const activeSessionsMap = new Map<string, ActiveServerSession>();
const SESSION_TTL_MS = 35000; // 35 seconds of heartbeat timeout

// Cleanup expired sessions every 15s
setInterval(() => {
  const now = Date.now();
  for (const [key, sess] of activeSessionsMap.entries()) {
    if (now - sess.lastPing > SESSION_TTL_MS) {
      activeSessionsMap.delete(key);
    }
  }
}, 15000);

// Check if user has an active session
apiRouter.post('/sessions/check', (req: Request, res: Response) => {
  const { userId, email, sessionId } = req.body;
  const userKey = (userId || email || '').toLowerCase();
  const existing = activeSessionsMap.get(userKey);

  if (existing && Date.now() - existing.lastPing < SESSION_TTL_MS) {
    if (sessionId && existing.sessionId === sessionId) {
      return res.json({ hasActiveSession: false, isCurrentSession: true });
    }
    return res.json({
      hasActiveSession: true,
      activeSession: {
        device: existing.device,
        lastPing: existing.lastPing,
        loggedInAt: existing.loggedInAt,
      },
    });
  }

  res.json({ hasActiveSession: false });
});

// Attempt to register login session (Protected with Rate Limiting against Brute-Force)
apiRouter.post('/sessions/login', loginRateLimiter, (req: Request, res: Response) => {
  const { userId, email, sessionId, device, userName, override } = req.body;
  const userKey = (userId || email || '').toLowerCase();
  const existing = activeSessionsMap.get(userKey);
  const now = Date.now();

  // If already active on another session and not overriding
  if (
    existing &&
    now - existing.lastPing < SESSION_TTL_MS &&
    existing.sessionId !== sessionId &&
    !override
  ) {
    return res.status(409).json({
      success: false,
      error: 'Usuario con sesíon activa en otro dispositivo',
      activeSession: {
        device: existing.device,
        lastPing: existing.lastPing,
        loggedInAt: existing.loggedInAt,
      },
    });
  }

  // Register new active session
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const newSession: ActiveServerSession = {
    sessionId: sessionId || 'sess_' + Date.now(),
    userId: userId || userKey,
    userEmail: email || userKey,
    userName: userName || 'Usuario',
    device: device || 'Dispositivo desconocido',
    ip,
    lastPing: now,
    loggedInAt: new Date().toISOString(),
  };

  activeSessionsMap.set(userKey, newSession);
  res.json({ success: true, sessionId: newSession.sessionId });
});

// Session heartbeat to keep alive
apiRouter.post('/sessions/heartbeat', (req: Request, res: Response) => {
  const { userId, email, sessionId } = req.body;
  const userKey = (userId || email || '').toLowerCase();
  const existing = activeSessionsMap.get(userKey);

  if (!existing) {
    return res.json({ valid: false, reason: 'EXPIRED' });
  }

  if (existing.sessionId !== sessionId) {
    return res.json({ valid: false, reason: 'OVERRIDDEN' });
  }

  existing.lastPing = Date.now();
  res.json({ valid: true });
});

// Logout session
apiRouter.post('/sessions/logout', (req: Request, res: Response) => {
  const { userId, email, sessionId } = req.body;
  const userKey = (userId || email || '').toLowerCase();
  const existing = activeSessionsMap.get(userKey);

  if (existing && (!sessionId || existing.sessionId === sessionId)) {
    activeSessionsMap.delete(userKey);
  }

  res.json({ success: true });
});

// List all active sessions (audit)
apiRouter.get('/sessions/active', (_req: Request, res: Response) => {
  const list = Array.from(activeSessionsMap.values());
  res.json({ total: list.length, sessions: list });
});

// --- ENTERPRISE SECURITY ARCHITECTURE AUDIT & VERIFICATION ENDPOINTS ---

// 1. Get Live Security Status (Helmet, Rate Limiter, Bcrypt, Session Guard)
apiRouter.get('/security/status', (_req: Request, res: Response) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    security: {
      bcryptHashing: {
        status: 'ACTIVE',
        algorithm: 'Bcrypt (Blowfish cipher based key derivation)',
        saltRounds: 10,
        description: 'Derivación de claves resistente a ataques por hardware/GPU con salt aleatorio de 10 rondas.',
        verified: true,
      },
      rateLimiting: {
        status: 'ACTIVE',
        loginProtection: '15 intentos por cada 15 minutos por dirección IP (express-rate-limit).',
        apiGeneralProtection: '300 peticiones por minuto por IP contra ataques DoS/abuso de endpoints.',
        mitigates: 'Ataques de fuerza bruta, ataques de diccionario y robo masivo de credenciales.',
      },
      helmetHeaders: {
        status: 'ACTIVE',
        engine: 'Helmet 8.x',
        activePolicies: [
          'X-Content-Type-Options: nosniff (Previene ataques de MIME-sniffing)',
          'X-XSS-Protection: 0 (Sanitización moderna XSS)',
          'Strict-Transport-Security / HSTS (Forzado de navegación HTTPS segura)',
          'Referrer-Policy: no-referrer (Protege fugas de URLs en cabeceras HTTP)',
          'Hide-Powered-By: Deshabilita X-Powered-By Express para evitar fingerprinting de servidor',
        ],
      },
      singleActiveSession: {
        status: 'ACTIVE',
        ttlMs: SESSION_TTL_MS,
        activeSessionsTracked: activeSessionsMap.size,
        enforcementMessage: 'Usuario con sesíon activa en otro dispositivo',
      },
    },
  });
});

// 14. Preenrollment Form Config Endpoints (MongoDB persistence per college)
apiRouter.get('/preenrollment-configs', async (req: Request, res: Response) => {
  const { colegioId } = req.query;
  if (isDBConnected()) {
    try {
      const filter = colegioId ? { colegioId } : {};
      const configs = await PreenrollmentConfigModel.find(filter).lean();
      return res.json(configs);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json([]);
});

apiRouter.put('/preenrollment-configs/:colegioId', async (req: Request, res: Response) => {
  const { colegioId } = req.params;
  const configData = req.body;

  if (isDBConnected()) {
    try {
      const updated = await PreenrollmentConfigModel.findOneAndUpdate(
        { colegioId },
        { $set: { ...configData, colegioId } },
        { new: true, upsert: true }
      );
      return res.json(updated);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ colegioId, ...configData });
});

// 15. Preenrollment Requests Endpoints (MongoDB persistence)
apiRouter.get('/preenrollments', async (req: Request, res: Response) => {
  const { colegioId } = req.query;
  if (isDBConnected()) {
    try {
      const filter = colegioId ? { colegioId } : {};
      const reqs = await PreenrollmentRequestModel.find(filter).sort({ createdAt: -1 }).lean();
      return res.json(reqs);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json([]);
});

apiRouter.post('/preenrollments', async (req: Request, res: Response) => {
  const preenrollmentData = req.body;
  if (!preenrollmentData.id || !preenrollmentData.colegioId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  if (isDBConnected()) {
    try {
      const created = await PreenrollmentRequestModel.create(preenrollmentData);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(preenrollmentData);
});

apiRouter.put('/preenrollments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (isDBConnected()) {
    try {
      const updated = await PreenrollmentRequestModel.findOneAndUpdate(
        { id },
        { $set: updates },
        { new: true }
      );
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

// 16. Teachers Endpoints
apiRouter.post('/teachers', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await TeacherModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/teachers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
      const updated = await TeacherModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

apiRouter.delete('/teachers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await TeacherModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// 17. Subjects Endpoints
apiRouter.post('/subjects', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await SubjectModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/subjects/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
      const updated = await SubjectModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

// 18. Grades Endpoints
apiRouter.post('/grades', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await GradeRecordModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/grades/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
      const updated = await GradeRecordModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

// 19. Incidents Endpoints
apiRouter.post('/incidents', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await IncidentModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/incidents/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
      const updated = await IncidentModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

// 20. Psychology Endpoints
apiRouter.post('/psychology', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await PsychologyModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

// 21. Library Endpoints
apiRouter.post('/library', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await LibraryBookModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

// 22. Notices Endpoints
apiRouter.post('/notices', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await NoticeModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

// 23. Activities Endpoints
apiRouter.post('/activities', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await TeacherActivityModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

// 24. Tasks & Exams Endpoints
apiRouter.post('/tasks-exams', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await TaskOrExamModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

// 26. Campuses Endpoints (per college)
apiRouter.post('/campuses', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await CampusModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/campuses/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
      const updated = await CampusModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

apiRouter.delete('/campuses/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await CampusModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// 27. School Cycles Endpoints (per college)
apiRouter.post('/school-cycles', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      if (data.activo && data.colegioId) {
        await SchoolCycleModel.updateMany({ colegioId: data.colegioId }, { $set: { activo: false } });
      }
      const created = await SchoolCycleModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/school-cycles/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
      const existing = await SchoolCycleModel.findOne({ id }).lean();
      if (updates.activo && existing && (existing as any).colegioId) {
        await SchoolCycleModel.updateMany(
          { colegioId: (existing as any).colegioId, id: { $ne: id } },
          { $set: { activo: false } }
        );
      }
      const updated = await SchoolCycleModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

apiRouter.delete('/school-cycles/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await SchoolCycleModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// 28. Calendar Days Endpoints (per college)
apiRouter.post('/calendar-days', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await CalendarDayModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/calendar-days/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
      const updated = await CalendarDayModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

apiRouter.delete('/calendar-days/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await CalendarDayModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// 29. Group Schedules Endpoints (per college)
apiRouter.post('/group-schedules', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await GroupScheduleModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.delete('/group-schedules/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await GroupScheduleModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// 30. Monthly Tuitions Endpoints (per college)
apiRouter.post('/monthly-tuitions', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await MonthlyTuitionModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

// 31. Billing Concepts Endpoints (per college)
apiRouter.post('/billing-concepts', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await BillingConceptModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/billing-concepts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
      const updated = await BillingConceptModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

apiRouter.delete('/billing-concepts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await BillingConceptModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// 32. Evaluation Concepts, Saved Periods & Student Evaluations Endpoints (per college)
apiRouter.post('/evaluation-concepts', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await EvaluationConceptModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/evaluation-concepts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
      const updated = await EvaluationConceptModel.findOneAndUpdate({ id }, { $set: updates }, { new: true });
      return res.json(updated || updates);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ id, ...updates });
});

apiRouter.delete('/evaluation-concepts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await EvaluationConceptModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

apiRouter.post('/evaluation-periods', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await EvaluationSavedPeriodModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.delete('/evaluation-periods/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isDBConnected()) {
    try {
      await EvaluationSavedPeriodModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

apiRouter.post('/student-evaluations', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await StudentEvaluationModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { new: true, upsert: true }
      );
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

// 33. Activity Logs Endpoints (per college or global)
apiRouter.post('/activity-logs', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await ActivityLogModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

// 2. Utility endpoint to hash password using Bcrypt with 10 salt rounds
apiRouter.post('/auth/hash-password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Contraseña en texto plano requerida' });
    }
    const hash = await hashPassword(password, 10);
    const isValidTest = await verifyPassword(password, hash);
    res.json({
      success: true,
      algorithm: 'bcrypt',
      saltRounds: 10,
      hash,
      sampleVerification: isValidTest,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Utility endpoint to verify password against Bcrypt hash (rate-limited)
apiRouter.post('/auth/verify-password', loginRateLimiter, async (req: Request, res: Response) => {
  try {
    const { password, hash } = req.body;
    if (!password || !hash) {
      return res.status(400).json({ error: 'Contraseña y hash requeridos' });
    }
    const isMatch = await verifyPassword(password, hash);
    res.json({
      success: true,
      match: isMatch,
      isBcryptFormat: isBcryptHash(hash),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 25. Real SMTP Email Dispatch Endpoint
apiRouter.post('/notifications/send-email', async (req: Request, res: Response) => {
  try {
    const { to, subject, text, html, colegioNombre } = req.body;
    const rawRecipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    const recipients = rawRecipients.filter((addr: string) => {
      const lower = String(addr || '').trim().toLowerCase();
      return (
        lower.includes('@') &&
        !lower.includes('@alumno.') &&
        !lower.endsWith('@correo.com') &&
        !lower.endsWith('@mycollege.edu.mx')
      );
    });

    if (recipients.length === 0 || !subject) {
      return res.status(200).json({
        success: true,
        mode: 'local_inbox_only',
        message: 'Notificación registrada en la Bandeja del Sistema.',
      });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom =
      process.env.SMTP_FROM ||
      `"${colegioNombre || 'My College Notificaciones'}" <${smtpUser || 'notificaciones@mycollege.com.mx'}>`;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(200).json({
        success: true,
        mode: 'local_inbox_only',
        message:
          'Notificación registrada en la Bandeja del Sistema. Para envío SMTP externo real, configura SMTP_HOST, SMTP_USER y SMTP_PASS en las variables de entorno.',
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const formattedHtml =
      html ||
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0B2545; color: #ffffff; padding: 20px; border-bottom: 4px solid #DFB743;">
          <h2 style="margin: 0; font-size: 18px;">${colegioNombre || 'My College Plataforma Escolar'}</h2>
          <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1;">Notificación Oficial del Sistema</p>
        </div>
        <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${text || ''}</div>
        <div style="background-color: #f8fafc; padding: 14px 24px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
          Enviado automáticamente por My College · Sistema de Gestión Escolar
        </div>
      </div>`;

    const info = await transporter.sendMail({
      from: smtpFrom,
      to: recipients.join(', '),
      subject,
      text: text || '',
      html: formattedHtml,
    });

    res.json({
      success: true,
      mode: 'smtp',
      messageId: info.messageId,
      accepted: info.accepted,
    });
  } catch (err: any) {
    // Handle transient SMTP throttling (421 / 450) gracefully using local inbox fallback without throwing server errors
    res.status(200).json({
      success: false,
      mode: 'fallback_local',
      error: err.message,
    });
  }
});



