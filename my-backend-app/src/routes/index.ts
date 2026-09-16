import { Router } from 'express';
import { CourseController, IndexController } from '../controllers';
import { CourseStore, defaultSeedCourses } from '../models/course';

/**
 * Builds the API router. Dependencies (store, controllers) are composed here
 * once, keeping controllers and models free of routing concerns.
 */
export function createApiRouter(): Router {
  const router = Router();

  const store = new CourseStore(defaultSeedCourses);
  const indexController = new IndexController();
  const courseController = new CourseController(store);

  router.get('/', (req, res) => indexController.getWelcome(req, res));
  router.get('/health', (req, res) => indexController.getHealth(req, res));

  router.get('/courses', (req, res) => courseController.list(req, res));
  router.get('/courses/:id', (req, res, next) => courseController.getById(req, res, next));
  router.post('/courses', (req, res, next) => courseController.create(req, res, next));

  return router;
}
