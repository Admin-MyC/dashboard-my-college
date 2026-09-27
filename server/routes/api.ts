import { Router, Request, Response } from 'express';
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
} from '../../src/data/initialData';
import { seedDatabaseIfEmpty } from '../db/seed';

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

// 2. Full Bootstrap Data (allows fast initial load for the frontend)
apiRouter.get('/bootstrap', async (_req: Request, res: Response) => {
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
      ] = await Promise.all([
        CollegeModel.find().lean(),
        UserModel.find().lean(),
        StudentModel.find().lean(),
        TeacherModel.find().lean(),
        SubjectModel.find().lean(),
        GradeRecordModel.find().lean(),
        IncidentModel.find().lean(),
        PsychologyModel.find().lean(),
        LibraryBookModel.find().lean(),
        NoticeModel.find().lean(),
        TeacherActivityModel.find().lean(),
        TaskOrExamModel.find().lean(),
      ]);

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
        StudentModel.deleteMany({ colegioId: id }),
        TeacherModel.deleteMany({ colegioId: id }),
        SubjectModel.deleteMany({ colegioId: id }),
        GradeRecordModel.deleteMany({ colegioId: id }),
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
      const created = await UserModel.create(userData);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(userData);
});

apiRouter.put('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
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

// 5. Students Endpoints
apiRouter.get('/students', async (req: Request, res: Response) => {
  const { colegioId } = req.query;
  if (isDBConnected()) {
    try {
      const filter = colegioId ? { colegioId } : {};
      const students = await StudentModel.find(filter).lean();
      return res.json(students);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json(INITIAL_STUDENTS);
});

apiRouter.post('/students', async (req: Request, res: Response) => {
  const data = req.body;
  if (isDBConnected()) {
    try {
      const created = await StudentModel.create(data);
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.status(201).json(data);
});

apiRouter.put('/students/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  if (isDBConnected()) {
    try {
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
      await StudentModel.deleteOne({ id });
      return res.json({ success: true, id });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, id });
});

// 6. Manual Database Seed trigger
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
