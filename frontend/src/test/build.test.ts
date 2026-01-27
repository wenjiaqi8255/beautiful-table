import { describe, it, expect } from 'vitest';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(execFile);

describe('Frontend Build Verification', () => {
  it('should successfully build the frontend project', async () => {
    // This test verifies that the project can be built
    const result = await execAsync('npm', ['run', 'build'], {
      cwd: '/Users/wenjiaqi/Downloads/beautiful-table/frontend'
    });
    // Build should succeed without errors
    expect(result).toBeDefined();
  }, 15000);

  it('should have TypeScript compilation succeed', async () => {
    // Run TypeScript compiler check
    const result = await execAsync('npx', ['tsc', '--noEmit'], {
      cwd: '/Users/wenjiaqi/Downloads/beautiful-table/frontend',
      shell: true
    });
    // TypeScript should compile without errors
    expect(result).toBeDefined();
  }, 15000);
});
