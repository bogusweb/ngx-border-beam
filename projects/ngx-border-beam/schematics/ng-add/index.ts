import type { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

interface NgAddOptions {
  project?: string;
}

/**
 * `ng add ngx-border-beam` entry point.
 *
 * The library ships a single standalone component with zero global styles,
 * zero assets and zero required providers, so there is nothing to wire up in
 * the workspace - the CLI has already added the package to dependencies.
 * The schematic just prints a getting-started snippet.
 */
export function ngAdd(options: NgAddOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const project = options.project ? ` (project: ${options.project})` : '';
    context.logger.info(`ngx-border-beam is ready${project}. No further setup is needed.`);
    context.logger.info('');
    context.logger.info('Import the standalone component and wrap your content:');
    context.logger.info('');
    context.logger.info(`  import { NgxBorderBeam } from 'ngx-border-beam';`);
    context.logger.info('');
    context.logger.info('  @Component({');
    context.logger.info('    imports: [NgxBorderBeam],');
    context.logger.info('    template: `');
    context.logger.info('      <ngx-border-beam size="md" colorVariant="colorful">');
    context.logger.info('        <your-card>Content</your-card>');
    context.logger.info('      </ngx-border-beam>');
    context.logger.info('    `,');
    context.logger.info('  })');
    context.logger.info('');
    context.logger.info('Docs: https://github.com/Jakubantalik/border-beam (original by Jakub Antalik)');
    return tree;
  };
}
