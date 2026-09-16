import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Request, Response } from 'express';

function readPackageVersion(): string {
  try {
    const raw = readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8');
    return (JSON.parse(raw) as { version?: string }).version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

// Read once at startup, not per request.
const packageVersion = readPackageVersion();

/** Root + health controllers (welcome banner and liveness probe). */
export class IndexController {
  getWelcome(_req: Request, res: Response): void {
    res.json({
      name: 'App Mobile College API',
      version: packageVersion,
      status: 'ok',
      endpoints: {
        health: 'GET /api/health',
        courses: 'GET /api/courses',
        courseById: 'GET /api/courses/:id',
        createCourse: 'POST /api/courses',
      },
    });
  }

  getHealth(_req: Request, res: Response): void {
    res.json({
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }
}
