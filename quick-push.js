import { execSync } from 'child_process';

const customMsg = process.argv.slice(2).join(' ').trim();
const commitMsg = customMsg || `sync: update inventory system (${new Date().toISOString().slice(0, 19).replace('T', ' ')})`;

try {
  console.log('🚀 Verifying TypeScript...');
  execSync('bun run lint', { stdio: 'inherit' });

  console.log('📦 Staging changes...');
  execSync('git add -A', { stdio: 'inherit' });

  console.log(`📝 Committing: "${commitMsg}"...`);
  try {
    execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  } catch {
    console.log('ℹ️ No new changes to commit.');
  }

  console.log('⬆️ Pushing to GitHub...');
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✅ Successfully committed and pushed to GitHub!');
} catch (err) {
  console.error('❌ Fast push failed:', err.message);
  process.exit(1);
}
