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

export async function seedDatabaseIfEmpty() {
  try {
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
      console.log('[MongoDB Seed] ¡Siembra de datos iniciales completada exitosamente!');
    } else {
      console.log(`[MongoDB Seed] Base de datos activa con ${collegesCount} colegios registrados.`);
    }
  } catch (error: any) {
    console.error('[MongoDB Seed] Error durante la siembra de datos:', error.message || error);
  }
}
