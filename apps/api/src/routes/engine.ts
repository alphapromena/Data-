/**
 * /api/v1/engine/run — triggers the Python scan engine as a child process.
 * The engine reads from the target data source, profiles it, and returns
 * structured JSON that the API then persists to scan_results + dmi_scores.
 */
import { spawn, type SpawnOptions } from 'child_process';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HttpError } from '../middleware/error.js';
import { dmiScoresService } from '../services/dmi_scores.service.js';
import { scanResultsService } from '../services/scan_results.service.js';
import { scansService } from '../services/scans.service.js';

const runSchema = z.object({
  scan_id: z.string().uuid(),
  dsn: z.string().min(1),           // postgres://user:pass@host:5432/dbname
  tables: z.array(z.string()).optional(),
});

export const engineRouter = Router();

engineRouter.post(
  '/run',
  asyncHandler(async (req, res) => {
    const { scan_id, dsn, tables } = runSchema.parse(req.body);

    // Mark scan as running
    await scansService.update(scan_id, {
      status: 'running',
      started_at: new Date().toISOString(),
    });

    // Build CLI args
    const args = ['--dsn', dsn, '--scan-id', scan_id];
    if (tables && tables.length > 0) {
      args.push('--tables', ...tables);
    }

    const parts = env.SCAN_ENGINE_CMD.split(' ');
    const cmd = parts[0] as string;
    const baseArgs = parts.slice(1);
    const spawnOpts: SpawnOptions = {
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    };
    const child = spawn(cmd, [...baseArgs, ...args], spawnOpts);

    let stdout = '';
    let stderr = '';
    (child.stdout as NodeJS.ReadableStream).on('data', (d: Buffer) => { stdout += d.toString(); });
    (child.stderr as NodeJS.ReadableStream).on('data', (d: Buffer) => { stderr += d.toString(); });

    child.on('close', async (code: number | null) => {
      if (code !== 0) {
        await scansService.update(scan_id, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: stderr.slice(0, 2000),
        });
        return;
      }

      try {
        const result = JSON.parse(stdout) as {
          datasets: Array<{
            dataset_name: string;
            row_count: number;
            column_count: number;
            completeness_pct: number;
            duplicate_pct: number;
            null_pct: number;
            consistency_score: number;
            accuracy_score: number;
            compliance_flags: string[];
            column_profile: Record<string, unknown>;
          }>;
          dmi: {
            overall_score: number;
            completeness_score: number;
            consistency_score: number;
            accuracy_score: number;
            duplication_score: number;
            compliance_score: number;
            grade: string;
          };
          client_id: string;
        };

        // Persist per-dataset results
        for (const ds of result.datasets) {
          await scanResultsService.create({ scan_id, ...ds });
        }

        // Persist DMI roll-up
        await dmiScoresService.create({
          scan_id,
          client_id: result.client_id,
          ...result.dmi,
        });

        // Mark scan complete
        await scansService.update(scan_id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
        });
      } catch (err) {
        await scansService.update(scan_id, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: `Failed to parse engine output: ${String(err)}`,
        });
      }
    });

    // Respond immediately — scan runs async
    res.status(202).json({
      message: 'Scan engine triggered',
      scan_id,
      status: 'running',
    });
  }),
);
