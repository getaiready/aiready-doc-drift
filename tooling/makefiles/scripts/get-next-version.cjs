const semver = require('semver');
const fs = require('fs');
const path = require('path');

/**
 * determineNextVersion(appDir, lastTagVersion, type)
 * @param appDir - Path to app folder (containing package.json)
 * @param lastTagVersion - Version from git tag (e.g., 0.3.36)
 * @param type - patch, minor, or major
 */
function determineNextVersion(appDir, lastTagVersion, type) {
  const pkgPath = path.join(appDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`Error: package.json not found at ${pkgPath}`);
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const current = pkg.version;

  // 1. Calculate what a bump from LAST_TAG would be.
  // If lastTagVersion is 0.0.0 (no tag), we treat it as potentially needing a bump from current?
  // But usually we want to bump from the last version that was officially released.
  const target = semver.inc(lastTagVersion, type);

  // 2. Decide if we need to bump.
  // If current is already >= target, we don't need a new bump; it probably already happened.
  if (semver.gte(current, target)) {
    // Current is already sufficient.
    process.stdout.write(current);
  } else {
    // Current is behind, we need to bump.
    process.stdout.write('BUMP');
  }
}

// Args: <APP_DIR> <LAST_TAG_VERSION> <TYPE>
const [appDir, lastTagVersion, type] = process.argv.slice(2);
if (!appDir || !lastTagVersion || !type) {
  console.error(
    'Usage: node get-next-version.js <APP_DIR> <LAST_TAG_VERSION> <TYPE>'
  );
  process.exit(1);
}

determineNextVersion(appDir, lastTagVersion, type);
