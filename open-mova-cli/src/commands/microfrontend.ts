import { join, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import type { Command } from 'commander';
import { createMicrofrontend, inspectExistingMicrofrontend } from '../application/microfrontend.js';
import {
  addMicrofrontend,
  readApplicationConfiguration,
  requireApplicationRoot,
  writeApplicationConfiguration,
} from '../application/configuration.js';
import { synchronizeShellConfiguration } from '../application/shell-configuration.js';
import { normalizeName } from '../utils/names.js';
import { listShellVersions } from '../application/shell-repository.js';
import {
  applyMicrofrontendUpdate,
  createMicrofrontendUpdatePlan,
} from '../application/microfrontend-update.js';
import { buildLocalMicrofrontend } from '../application/microfrontend-build.js';
import { writeMicrofrontendDeploymentDescriptor } from '../application/deployment-artifact.js';
import { terminal } from '../ui/terminal.js';

interface CreateMicrofrontendCommandOptions {
  readonly directory?: string;
  readonly route?: string;
  readonly port?: number;
  readonly productionRemoteEntry?: string;
  readonly templateVersion?: string;
  readonly demo?: boolean;
  readonly routesOnly?: boolean;
  readonly componentOnly?: boolean;
  readonly componentName?: string;
}

interface AddMicrofrontendCommandOptions {
  readonly name?: string;
  readonly route?: string;
  readonly remote?: string;
  readonly remoteEntry?: string;
  readonly port?: number;
  readonly productionRemoteEntry?: string;
  readonly coreVersion?: string;
  readonly component?: readonly string[];
}

interface UpdateMicrofrontendCommandOptions {
  readonly check?: boolean;
  readonly to?: string;
}

export function registerMicrofrontendCommands(program: Command): void {
  const microfrontend = program
    .command('mf')
    .description('Crea y registra microfrontales de una aplicación Open Mova');

  microfrontend
    .command('create <name>')
    .description('Crea un microfrontal local y lo registra en la aplicación')
    .option('-d, --directory <path>', 'ruta relativa a la raíz de la aplicación')
    .option('--route <path>', 'ruta pública en la shell')
    .option('--port <number>', 'puerto de desarrollo', parsePort)
    .option('--production-remote-entry <url>', 'URL HTTPS del remoto publicado')
    .option('--template-version <tag>', 'tag del proyecto de microfrontal')
    .option('--demo', 'usar el perfil con ejemplos en vez del mínimo')
    .option('--routes-only', 'generar únicamente rutas')
    .option('--component-only', 'generar únicamente un componente')
    .option('--component-name <name>', 'nombre y alias del componente generado (por defecto: main)')
    .action((name: string, options: CreateMicrofrontendCommandOptions) => {
      if (options.routesOnly && options.componentOnly) {
        throw new Error('Elige --routes-only o --component-only, no ambos.');
      }
      if (options.componentOnly && options.route) {
        throw new Error('--route no se puede usar con --component-only.');
      }
      if (options.routesOnly && options.componentName) {
        throw new Error('--component-name requiere generar un componente.');
      }
      if (options.demo && (options.routesOnly || options.componentOnly || options.componentName)) {
        throw new Error('--demo no se puede combinar con las opciones del perfil mínimo.');
      }
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const normalizedName = normalizeName(name, 'El nombre del microfrontal');
      const templateVersion =
        options.templateVersion ??
        (options.demo ? configuration.shell?.version : undefined) ??
        listShellVersions()[0];
      if (!templateVersion) {
        throw new Error('No hay tags estables disponibles para crear el microfrontal.');
      }
      if (options.demo && configuration.shell?.version !== templateVersion) {
        throw new Error(
          'El perfil demo debe usar el mismo tag que la shell para mantener compatible el contrato nativo.',
        );
      }
      const microfrontendConfiguration = createMicrofrontend(applicationRoot, configuration, {
        name: normalizedName,
        directory: options.directory ?? join('mfs', normalizedName),
        route: options.route,
        port: options.port,
        productionRemoteEntry: options.productionRemoteEntry,
        templateVersion,
        profile: options.demo
          ? 'demo'
          : options.routesOnly
            ? 'starter-routes'
            : options.componentOnly
              ? 'starter-component'
              : 'starter-both',
        componentName: options.componentName,
      });
      const updatedConfiguration = addMicrofrontend(configuration, microfrontendConfiguration);

      writeApplicationConfiguration(applicationRoot, updatedConfiguration);
      synchronizeShellConfiguration(applicationRoot, updatedConfiguration);

      terminal.heading('Microfrontal creado');
      terminal.success(`"${microfrontendConfiguration.name}" está registrado en la aplicación.`);
      if (microfrontendConfiguration.route) {
        terminal.keyValue('Ruta pública', `/${microfrontendConfiguration.route}`);
      }
      if (microfrontendConfiguration.components) {
        terminal.keyValue(
          'Componentes',
          Object.keys(microfrontendConfiguration.components)
            .map((alias) => `${microfrontendConfiguration.name}.${alias}`)
            .join(', '),
        );
      }
      terminal.keyValue(
        'Directorio',
        microfrontendConfiguration.sourcePath ?? 'sin directorio local',
      );
    });

  microfrontend
    .command('add [source-path]')
    .description('Registra un microfrontal local o uno ya desplegado')
    .option('--name <name>', 'nombre del microfrontal')
    .option('--route <path>', 'ruta pública en la shell')
    .option('--remote <name>', 'nombre definido en federation.config.js')
    .option('--remote-entry <url>', 'URL del remoteEntry.json')
    .option('--port <number>', 'puerto de desarrollo para un proyecto local', parsePort)
    .option('--production-remote-entry <url>', 'URL HTTPS del remoto publicado')
    .option('--core-version <range>', 'rango requerido de @open-mova/core')
    .option(
      '--component <alias=module>',
      'componente expuesto; se puede repetir',
      collectComponent,
      [],
    )
    .action((sourcePath: string | undefined, options: AddMicrofrontendCommandOptions) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const microfrontendConfiguration = inspectExistingMicrofrontend(applicationRoot, {
        sourcePath,
        name: options.name,
        route: options.route,
        remoteName: options.remote,
        remoteEntry: options.remoteEntry,
        port: options.port,
        productionRemoteEntry: options.productionRemoteEntry,
        coreVersion: options.coreVersion,
        ...(options.component?.length ? { components: parseComponents(options.component) } : {}),
      });
      if (microfrontendConfiguration.sourcePath) {
        const projectRoot = resolve(applicationRoot, microfrontendConfiguration.sourcePath);
        for (const module of [
          ...(microfrontendConfiguration.route ? ['./Routes'] : []),
          ...Object.values(microfrontendConfiguration.components ?? {}),
        ]) {
          assertLocalExposure(projectRoot, module);
        }
      }
      const updatedConfiguration = addMicrofrontend(configuration, microfrontendConfiguration);

      writeApplicationConfiguration(applicationRoot, updatedConfiguration);
      synchronizeShellConfiguration(applicationRoot, updatedConfiguration);

      terminal.heading('Microfrontal registrado');
      terminal.success(`"${microfrontendConfiguration.name}" está disponible en la aplicación.`);
      if (microfrontendConfiguration.route) {
        terminal.keyValue('Ruta pública', `/${microfrontendConfiguration.route}`);
      } else {
        terminal.keyValue(
          'Componentes',
          Object.keys(microfrontendConfiguration.components ?? {}).join(', '),
        );
      }
    });

  const component = microfrontend.command('component').description('Registra componentes de un MF');
  component
    .command('add <mf> <alias>')
    .requiredOption('--module <module>', 'módulo expuesto en federation.config.js')
    .description('Añade un componente expuesto a un MF ya registrado')
    .action((name: string, alias: string, options: { module: string }) => {
      parseComponent(`${alias}=${options.module}`);
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const index = configuration.microfrontends.findIndex((entry) => entry.name === name);
      if (index < 0) throw new Error(`No existe un MF llamado "${name}".`);
      const current = configuration.microfrontends[index]!;
      if (current.components?.[alias]) {
        throw new Error(`El MF ${name} ya registra el componente ${alias}.`);
      }
      if (current.sourcePath) {
        assertLocalExposure(resolve(applicationRoot, current.sourcePath), options.module);
      }
      const microfrontends = [...configuration.microfrontends];
      microfrontends[index] = {
        ...current,
        components: { ...current.components, [alias]: options.module },
      };
      const updated = { ...configuration, microfrontends };
      writeApplicationConfiguration(applicationRoot, updated);
      synchronizeShellConfiguration(applicationRoot, updated);
      terminal.success(`Componente "${name}.${alias}" registrado.`);
    });

  microfrontend
    .command('update <name>')
    .description('Actualiza un microfrontal creado desde la plantilla de Open Mova')
    .option('--check', 'mostrar los cambios sin modificar archivos')
    .option('--to <tag>', 'versión de destino, por ejemplo v0.2.1')
    .action((name: string, options: UpdateMicrofrontendCommandOptions) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const normalizedName = normalizeName(name, 'El nombre del microfrontal');
      const plan = createMicrofrontendUpdatePlan(
        applicationRoot,
        configuration,
        normalizedName,
        options.to,
      );

      terminal.heading('Actualización de microfrontal');
      terminal.keyValue('Plantilla actual', plan.currentVersion);
      terminal.keyValue('Plantilla destino', plan.target.version);
      for (const change of plan.changes) terminal.item(change, 'accent');
      if (plan.conflicts.length > 0) {
        terminal.section('Conflictos que no se sobrescribirán');
        for (const conflict of plan.conflicts) terminal.item(conflict, 'warning');
      }
      if (options.check) return;
      if (plan.conflicts.length > 0) {
        throw new Error('Resuelve los conflictos antes de actualizar el microfrontal.');
      }
      if (plan.changes.length === 0) {
        terminal.success('El microfrontal ya está actualizado.');
        return;
      }

      applyMicrofrontendUpdate(applicationRoot, configuration, plan);
      terminal.success(`Microfrontal "${normalizedName}" actualizado a ${plan.target.version}.`);
      if (plan.removePackageLock) {
        terminal.warning(`Ejecuta npm install en ${plan.projectRoot}.`);
      }
    });

  microfrontend
    .command('build <name>')
    .description('Compila un microfrontal local sin compilar la shell')
    .action((name: string) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const normalizedName = normalizeName(name, 'El nombre del microfrontal');
      const build = buildLocalMicrofrontend(applicationRoot, configuration, normalizedName);

      terminal.success(
        `Microfrontal "${build.configuration.name}" compilado en ${build.outputDirectory}.`,
      );
    });

  microfrontend
    .command('deploy <name>')
    .description('Genera un artefacto de MF para el CI del proveedor, sin publicarlo')
    .action((name: string) => {
      const applicationRoot = requireApplicationRoot(process.cwd());
      const configuration = readApplicationConfiguration(applicationRoot);
      const normalizedName = normalizeName(name, 'El nombre del microfrontal');
      const build = buildLocalMicrofrontend(applicationRoot, configuration, normalizedName);
      const descriptor = writeMicrofrontendDeploymentDescriptor(build);

      terminal.heading('Artefacto de microfrontal');
      terminal.success(`Listo en ${build.outputDirectory}.`);
      terminal.info(
        `Publica todo ese directorio y conserva ${descriptor.remoteEntry} y sus assets.`,
      );
      terminal.item('El CLI no realiza el despliegue ni selecciona el proveedor de hosting.');
    });
}

function collectComponent(value: string, previous: readonly string[]): readonly string[] {
  return [...previous, value];
}

function parseComponents(values: readonly string[]): Record<string, string> {
  const components: Record<string, string> = {};
  for (const value of values) {
    const [alias, module] = parseComponent(value);
    if (alias in components) throw new Error(`El alias ${alias} está duplicado.`);
    components[alias] = module;
  }
  return components;
}

function parseComponent(value: string): readonly [string, string] {
  const index = value.indexOf('=');
  const alias = value.slice(0, index);
  const module = value.slice(index + 1);
  if (
    index < 1 ||
    !/^[a-z][a-z0-9-]*$/.test(alias) ||
    !/^\.\/[A-Za-z][A-Za-z0-9/_-]*$/.test(module)
  ) {
    throw new Error('Usa --component alias=./Modulo con un alias y módulo válidos.');
  }
  return [alias, module];
}

function assertLocalExposure(directory: string, module: string): void {
  const source = readFileSync(join(directory, 'federation.config.js'), 'utf8');
  if (!source.includes(`'${module}':`) && !source.includes(`"${module}":`)) {
    throw new Error(`El proyecto ${directory} no expone ${module} en federation.config.js.`);
  }
}

function parsePort(value: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('El puerto debe ser un número entero entre 1 y 65535.');
  }

  return port;
}
