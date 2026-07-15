import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const checkedExtensions = /\.(?:css|js|json|jsx|mjs|ts|tsx|yaml|yml)$/;
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard'],
  { encoding: 'utf8' }
)
  .split(/\r?\n/)
  .filter((file) => checkedExtensions.test(file));

const errors = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (!source.endsWith('\n')) {
    errors.push(`${file}: missing final newline`);
  }
  source.split(/\r?\n/).forEach((line, index) => {
    if (/^\t/.test(line)) {
      errors.push(`${file}:${index + 1}: leading tab`);
    }
    if (/[ \t]+$/.test(line)) {
      errors.push(`${file}:${index + 1}: trailing whitespace`);
    }
  });
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
}
