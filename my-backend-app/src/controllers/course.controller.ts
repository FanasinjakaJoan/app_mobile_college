import { NextFunction, Request, Response } from 'express';
import { CourseStore, NewCourse } from '../models/course';

const MAX_TEXT_LENGTH = 120;
const MIN_CREDITS = 1;
const MAX_CREDITS = 12;

interface FieldError {
  field: string;
  message: string;
}

interface ErrorBody {
  error: {
    message: string;
    details?: FieldError[];
  };
}

function fail(res: Response, status: number, body: ErrorBody): void {
  res.status(status).json(body);
}

/** Pure, side-effect-free payload validation (input hardening). */
export function validateCoursePayload(body: unknown): { errors: FieldError[]; value: NewCourse | null } {
  const errors: FieldError[] = [];

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {
      errors: [{ field: 'body', message: 'Request body must be a JSON object.' }],
      value: null,
    };
  }

  const record = body as Record<string, unknown>;

  const readText = (field: keyof NewCourse): string => {
    const raw = record[field];
    if (typeof raw !== 'string' || raw.trim() === '') {
      errors.push({ field, message: `"${field}" is required and must be a non-empty string.` });
      return '';
    }
    const value = raw.trim();
    if (value.length > MAX_TEXT_LENGTH) {
      errors.push({ field, message: `"${field}" must be at most ${MAX_TEXT_LENGTH} characters.` });
    }
    return value;
  };

  const code = readText('code');
  const title = readText('title');
  const professor = readText('professor');
  const schedule = readText('schedule');

  let credits = 0;
  const rawCredits = record.credits;
  if (typeof rawCredits === 'number' && Number.isInteger(rawCredits)) {
    credits = rawCredits;
  } else if (typeof rawCredits === 'string' && rawCredits.trim() !== '' && Number.isInteger(Number(rawCredits))) {
    credits = Number(rawCredits);
  } else {
    errors.push({ field: 'credits', message: '"credits" is required and must be an integer.' });
  }
  if (errors.every((e) => e.field !== 'credits') && (credits < MIN_CREDITS || credits > MAX_CREDITS)) {
    errors.push({ field: 'credits', message: `"credits" must be between ${MIN_CREDITS} and ${MAX_CREDITS}.` });
  }

  if (errors.length > 0) {
    return { errors, value: null };
  }
  return { errors, value: { code, title, professor, credits, schedule } };
}

/** HTTP handlers for the `/courses` resource. */
export class CourseController {
  constructor(private readonly store: CourseStore) {}

  list(_req: Request, res: Response): void {
    const data = this.store.findAll();
    res.json({ count: data.length, data });
  }

  getById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        fail(res, 400, { error: { message: 'Course id must be a positive integer.' } });
        return;
      }
      const course = this.store.findById(id);
      if (!course) {
        fail(res, 404, { error: { message: `Course ${id} was not found.` } });
        return;
      }
      res.json({ data: course });
    } catch (err) {
      next(err);
    }
  }

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const { errors, value } = validateCoursePayload(req.body);
      if (value === null) {
        fail(res, 400, { error: { message: 'Invalid course payload.', details: errors } });
        return;
      }
      const course = this.store.add(value);
      res.status(201).location(`/api/courses/${course.id}`).json({ data: course });
    } catch (err) {
      next(err);
    }
  }
}
