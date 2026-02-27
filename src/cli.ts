import { Command } from 'commander';
import { analyzeDocDrift } from './analyzer';
import pc from 'picocolors';

export function createCommand() {
  const program = new Command('doc-drift')
    .description(
      'Scan for documentation drift (outdated comments, mismatched signatures)'
    )
    .option('--include <patterns...>', 'File patterns to include')
    .option('--exclude <patterns...>', 'File patterns to exclude')
    .option(
      '--stale-months <number>',
      'Months before a comment is considered potentially outdated',
      '6'
    )
    .action(async (options) => {
      console.log(pc.cyan('Analyzing documentation drift...'));
      const report = await analyzeDocDrift({
        rootDir: process.cwd(),
        include: options.include,
        exclude: options.exclude,
        staleMonths: parseInt(options.staleMonths, 10),
      });

      console.log(pc.bold('Doc Drift Analysis Results:'));
      console.log(
        `Rating: ${report.summary.rating.toUpperCase()} (Score: ${report.summary.score})`
      );
      if (report.issues.length > 0) {
        console.log(pc.red(`\nFound ${report.issues.length} drift issues.`));
      } else {
        console.log(pc.green('\nNo documentation drift detected.'));
      }
    });

  return program;
}

if (require.main === module) {
  createCommand()
    .parseAsync(process.argv)
    .catch((err) => {
      console.error(pc.red(err.message));
      process.exit(1);
    });
}
