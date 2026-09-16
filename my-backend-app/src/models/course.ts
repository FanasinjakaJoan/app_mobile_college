/**
 * Course domain model + in-memory store.
 * The store is intentionally simple (a Map keyed by id) so the API works
 * out of the box without a database; swap it for a real persistence layer
 * without touching the controllers.
 */
export interface Course {
  id: number;
  code: string;
  title: string;
  professor: string;
  credits: number;
  schedule: string;
}

export type NewCourse = Omit<Course, 'id'>;

export class CourseStore {
  private nextId = 1;
  private readonly courses = new Map<number, Course>();

  constructor(seed: readonly NewCourse[] = []) {
    for (const course of seed) {
      this.add(course);
    }
  }

  add(input: NewCourse): Course {
    const course: Course = { id: this.nextId, ...input };
    this.nextId += 1;
    this.courses.set(course.id, course);
    return course;
  }

  findAll(): Course[] {
    return [...this.courses.values()];
  }

  findById(id: number): Course | undefined {
    return this.courses.get(id);
  }

  get size(): number {
    return this.courses.size;
  }
}

/** Demo data so the API is useful immediately after `npm run dev`. */
export const defaultSeedCourses: readonly NewCourse[] = [
  {
    code: 'INF-101',
    title: 'Introduction à la programmation',
    professor: 'Dr. R. Andrianina',
    credits: 6,
    schedule: 'Lundi 08:00 – 10:00 · Salle B12',
  },
  {
    code: 'INF-204',
    title: 'Développement mobile',
    professor: 'Mme H. Razafy',
    credits: 5,
    schedule: 'Mardi 10:15 – 12:15 · Lab Info 2',
  },
  {
    code: 'MAT-110',
    title: 'Analyse mathématique I',
    professor: 'Pr. J. Rakoto',
    credits: 6,
    schedule: 'Mercredi 08:00 – 10:00 · Amphi A',
  },
  {
    code: 'COM-120',
    title: 'Communication professionnelle',
    professor: 'Mme L. Rasoanaivo',
    credits: 3,
    schedule: 'Jeudi 14:00 – 16:00 · Salle C4',
  },
  {
    code: 'ANG-105',
    title: 'Anglais technique',
    professor: 'Mr. T. Williams',
    credits: 2,
    schedule: 'Vendredi 09:00 – 11:00 · Salle D1',
  },
];
