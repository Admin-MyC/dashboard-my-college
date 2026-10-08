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
  CampusModel,
  SchoolCycleModel,
  CalendarDayModel,
  GroupScheduleModel,
  MonthlyTuitionModel,
  BillingConceptModel,
  EvaluationConceptModel,
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
import { ensureStudentCredentials } from '../../src/utils/studentCredentialsHelper';
import { ensureUserCredentials } from '../../src/utils/preenrollmentHelper';

export async function seedDatabaseIfEmpty() {
  try {
    // Drop legacy unique index on User.correo if present so multiple college accounts can share an email
    try {
      await UserModel.collection.dropIndex('correo_1');
    } catch {
      // Index does not exist or is already non-unique
    }

    const collegesCount = await CollegeModel.countDocuments();
    if (collegesCount === 0) {
      console.log('[MongoDB Seed] Base de datos vacía. Sembrando datos iniciales institucionales...');
      await CollegeModel.insertMany(INITIAL_COLLEGES);
      await UserModel.insertMany(INITIAL_USERS);
      await StudentModel.insertMany(INITIAL_STUDENTS);
      await TeacherModel.insertMany(INITIAL_TEACHERS);
      await SubjectModel.insertMany(INITIAL_SUBJECTS);
      await GradeRecordModel.insertMany(INITIAL_GRADES);
      await IncidentModel.insertMany(INITIAL_INCIDENTS);
      await PsychologyModel.insertMany(INITIAL_PSYCHOLOGY);
      await LibraryBookModel.insertMany(INITIAL_LIBRARY);
      await NoticeModel.insertMany(INITIAL_NOTICES);
      await TeacherActivityModel.insertMany(INITIAL_ACTIVITIES);
      await TaskOrExamModel.insertMany(INITIAL_TASKS_EXAMS);
      await AttendanceModel.insertMany(INITIAL_ATTENDANCE);
      await CampusModel.insertMany(INITIAL_CAMPUSES);
      await SchoolCycleModel.insertMany(INITIAL_SCHOOL_CYCLES);
      await CalendarDayModel.insertMany(INITIAL_CALENDAR_DAYS);
      await GroupScheduleModel.insertMany(INITIAL_GROUP_SCHEDULES);
      await MonthlyTuitionModel.insertMany(INITIAL_MONTHLY_TUITIONS);
      await BillingConceptModel.insertMany(INITIAL_BILLING_CONCEPTS);
      await EvaluationConceptModel.insertMany(INITIAL_EVALUATION_CONCEPTS);
      await StudentEvaluationModel.insertMany(INITIAL_STUDENT_EVALUATIONS);
      await ActivityLogModel.insertMany(INITIAL_ACTIVITY_LOGS);
      console.log('[MongoDB Seed] ¡Siembra de datos iniciales completada exitosamente!');
    } else {
      console.log(`[MongoDB Seed] Base de datos activa con ${collegesCount} colegios registrados.`);
    }

    // 1. Backfill & persist credentials for all Users in MongoDB (once generated, never changes)
    const initialUserMap = new Map(INITIAL_USERS.map((iu) => [iu.id, iu]));
    const allUsers = await UserModel.find({}).lean();
    for (const u of allUsers) {
      const seedUser = initialUserMap.get(u.id);
      const { usuarioLogin, password, wasUpdated } = ensureUserCredentials(
        {
          id: u.id,
          nombre: u.nombre,
          usuarioLogin: u.usuarioLogin,
          password: u.password,
        },
        seedUser
      );

      if (wasUpdated || u.usuarioLogin !== usuarioLogin || u.password !== password) {
        await UserModel.updateOne(
          { id: u.id },
          { $set: { usuarioLogin, password } }
        );
      }
    }

    // 2. Backfill & normalize student credentials (usuario: 1ra letra nombre + apellido + 4 dígitos, password: 8+ alfanuméricos)
    const allStudents = await StudentModel.find({}).lean();
    for (const st of allStudents) {
      const { usuarioLogin, password, wasUpdated } = ensureStudentCredentials({
        id: st.id,
        nombre: st.nombre,
        apellidos: st.apellidos,
        matricula: st.matricula,
        usuarioLogin: st.usuarioLogin,
        password: st.password,
      });

      if (wasUpdated || st.usuarioLogin !== usuarioLogin || st.password !== password) {
        await StudentModel.updateOne(
          { id: st.id },
          { $set: { usuarioLogin, password } }
        );
      }

      // Ensure corresponding Alumno user exists and has matching credentials
      const existingStudentUser = await UserModel.findOne({
        $or: [{ estudianteId: st.id }, { usuarioLogin }],
      });

      if (!existingStudentUser) {
        await UserModel.create({
          id: `usr-alumno-${st.id}`,
          nombre: `${st.nombre} ${st.apellidos}`.trim(),
          correo: `${usuarioLogin}@alumno.mycollege.edu.mx`,
          usuarioLogin,
          password,
          rol: 'alumno',
          colegioId: st.colegioId,
          cargo: `Alumno (${st.grado} "${st.grupo}")`,
          avatar: st.foto || '',
          activo: true,
          creadoEn: new Date().toISOString().split('T')[0],
          estudianteId: st.id,
        });
      } else if (
        existingStudentUser.usuarioLogin !== usuarioLogin ||
        existingStudentUser.password !== password
      ) {
        await UserModel.updateOne(
          { id: existingStudentUser.id },
          { $set: { usuarioLogin, password, estudianteId: st.id } }
        );
      }
    }
  } catch (error: any) {
    console.error('[MongoDB Seed] Error durante la siembra de datos:', error.message || error);
  }
}
