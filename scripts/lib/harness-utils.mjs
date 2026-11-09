import { existsSync, readFileSync, statSync } from 'node:fs';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HARNESS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const FEATURE_LIST_SCHEMA_PATH = path.join(HARNESS_ROOT, 'scripts', 'feature-list.schema.json');
export const SUBSYSTEMS = ['instructions', 'state', 'verification', 'scope', 'lifecycle'];
export const CANONICAL_FEATURE_STATUSES = ['not-started', 'in-progress', 'blocked', 'done'];
export const CANONICAL_LAYERS = ['types', 'config', 'repo', 'service', 'runtime', 'ui'];
export const DEFAULT_LAYER_MAP = {
  types: ['types', 'schemas', 'interfaces', 'contracts', 'domain'],
  config: ['config', 'settings', 'constants'],
  repo: ['repo', 'repositories', 'db', 'data', 'adapters', 'clients', 'models'],
  service: ['service', 'services', 'usecases', 'core', 'logic'],
  runtime: ['runtime', 'server', 'cli', 'workers', 'jobs', 'api', 'middleware'],
  ui: ['ui', 'components', 'pages', 'views', 'app', 'routes', 'templates', 'screens']
};

const VALID_CONFIG_MODES = new Set(['auto', 'greenfield', 'brownfield', 'non-dev']);
const CANONICAL_LAYER_SET = new Set(CANONICAL_LAYERS);
const ALLOWED_CONFIG_ROOT_KEYS = new Set(['mode', 'activeStacks', 'layerMap', 'brownfield', 'python', 'nonDev']);
const ALLOWED_BROWNFIELD_KEYS = new Set(['enabled', 'allowUnmappedDirs', 'allowEmptyDirs', 'maxLegacyLayerViolations']);
const ALLOWED_PYTHON_KEYS = new Set(['requireVenvForPip', 'packageRoots', 'enforceAstChecks']);
const ALLOWED_NON_DEV_KEYS = new Set(['deliverableDirs', 'forbidPlaceholders', 'checkMarkdownLinks', 'minDeliverableWords']);
const DEFAULT_PACKAGE_ROOTS = ['src', 'app', 'backend'];
const DEFAULT_DELIVERABLE_DIRS = ['deliverables', 'content', 'research', 'reports'];
const RESERVED_CONFIG_DIRS = new Set([
  '.git', 'node_modules', '.venv', 'venv', 'env', 'dist', 'build', 'coverage',
  '.next', '.astro', '.svelte-kit', 'scripts', 'docs', 'memory', '.agents',
  'tests', 'test', '__pycache__', 'deliverables'
]);
const FORBIDDEN_SINGLE_LAYER_DIRS = new Set([...RESERVED_CONFIG_DIRS, 'src', 'backend', 'packages', 'apps']);

const ALLOWED_FEATURE_STATUSES = new Set(CANONICAL_FEATURE_STATUSES);
const ALLOWED_ROOT_KEYS = new Set(['project', 'features']);
const ALLOWED_FEATURE_KEYS = new Set([
  'id',
  'name',
  'title',
  'description',
  'area',
  'user_visible_behavior',
  'priority',
  'status',
  'dependencies',
  'required_files',
  'deprecated_files',
  'verification',
  'evidence',
  'notes'
]);
const FEATURE_ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
    } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
      args[key] = argv[i + 1];
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

export async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readText(filePath) {
  return readFile(filePath, 'utf8');
}

export async function readJson(filePath) {
  return JSON.parse(await readText(filePath));
}

export async function writeText(filePath, contents) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
}

function isPlainConfigObject(val) {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function cloneDefaultLayerMap() {
  return Object.fromEntries(CANONICAL_LAYERS.map((layer) => [layer, [...DEFAULT_LAYER_MAP[layer]]]));
}

function isSafeRelativeConfigDir(rawDir) {
  if (typeof rawDir !== 'string') return false;
  const trimmed = rawDir.trim();
  if (!trimmed || trimmed.includes('\0')) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('\\') || /^[a-zA-Z]:/.test(trimmed)) return false;
  const cleaned = trimmed.replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/^\/+|\/+$/g, '');
  if (!cleaned) return false;
  return !cleaned.split('/').some((seg) => !seg || seg === '.' || seg === '..');
}

function normalizeConfigDir(rawDir) {
  return rawDir.trim().replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/^\/+|\/+$/g, '');
}

function failConfig(error, why, fix) {
  return { ok: false, config: null, error, why, fix };
}

export function validateHarnessConfig(root = process.cwd(), inlineRaw = undefined) {
  const resolvedRoot = path.resolve(root);
  const cfgPath = path.join(resolvedRoot, 'harness.config.json');
  let rawText = '';

  if (inlineRaw !== undefined) {
    if (typeof inlineRaw !== 'string') {
      return failConfig(
        "El contenido proporcionado para 'harness.config.json' no es texto UTF-8 válido.",
        'La configuración Camaleón debe leerse de forma determinista y Fail-Closed.',
        "Asegúrate de que 'harness.config.json' sea un archivo JSON UTF-8 sin BOM y con saltos LF."
      );
    }
    if (inlineRaw.startsWith('\uFEFF')) {
      return failConfig(
        "Se detectó marca UTF-8 BOM (0xEF 0xBB 0xBF) en 'harness.config.json'.",
        "El invariante de portabilidad del arnés exige archivos JSON en UTF-8 puro sin BOM.",
        "Guarda 'harness.config.json' en codificación UTF-8 sin BOM y saltos de línea LF."
      );
    }
    if (inlineRaw.includes('\r')) {
      return failConfig(
        "Saltos de línea CRLF ('\\r') detectados en 'harness.config.json'.",
        'Todos los manifiestos y configuraciones del arnés exigen saltos de línea LF puros (0 CRLF).',
        "Normaliza 'harness.config.json' a LF puro eliminando todos los bytes '\\r' (0x0D)."
      );
    }
    rawText = inlineRaw;
  } else {
    if (!existsSync(cfgPath)) {
      const layerMap = cloneDefaultLayerMap();
      return {
        ok: true,
        config: {
          exists: false,
          mode: 'auto',
          activeStacks: [],
          layerMap,
          directLayerEntries: [],
          appExplicitlyMapped: false,
          collapsiblePackageRoots: [...DEFAULT_PACKAGE_ROOTS],
          brownfield: {
            enabled: false,
            allowUnmappedDirs: true,
            allowEmptyDirs: false,
            maxLegacyLayerViolations: 0
          },
          python: {
            requireVenvForPip: true,
            packageRoots: [...DEFAULT_PACKAGE_ROOTS],
            enforceAstChecks: true
          },
          nonDev: {
            deliverableDirs: [...DEFAULT_DELIVERABLE_DIRS],
            forbidPlaceholders: true,
            checkMarkdownLinks: true,
            minDeliverableWords: 15
          }
        },
        error: null,
        why: null,
        fix: null
      };
    }

    let st = null;
    try {
      st = statSync(cfgPath);
    } catch (err) {
      return failConfig(
        `No se pudo inspeccionar 'harness.config.json' (${err.message}).`,
        'El validador Fail-Closed requiere acceso de lectura determinista a harness.config.json.',
        "Verifica permisos y que 'harness.config.json' sea un archivo regular válido."
      );
    }
    if (!st.isFile()) {
      return failConfig(
        "La ruta 'harness.config.json' no es un archivo regular.",
        'harness.config.json debe ser un archivo JSON plano en la raíz del proyecto.',
        "Elimina el directorio o nodo inválido 'harness.config.json' y crea un archivo JSON válido."
      );
    }

    let rawBuf = null;
    try {
      rawBuf = readFileSync(cfgPath);
    } catch (err) {
      return failConfig(
        `No se pudo leer 'harness.config.json' (${err.message}).`,
        'El arnés aplica política Fail-Closed cuando la configuración no puede leerse.',
        "Verifica los permisos de lectura de 'harness.config.json'."
      );
    }

    if (rawBuf.length >= 3 && rawBuf[0] === 0xef && rawBuf[1] === 0xbb && rawBuf[2] === 0xbf) {
      return failConfig(
        "Se detectó marca UTF-8 BOM (0xEF 0xBB 0xBF) en 'harness.config.json'.",
        'El invariante de portabilidad multiplataforma prohíbe UTF-8 BOM en manifiestos y scripts del arnés.',
        "Guarda 'harness.config.json' en UTF-8 puro sin BOM."
      );
    }
    if (rawBuf.includes(0x0d)) {
      return failConfig(
        "Saltos de línea CRLF ('\\r') detectados en 'harness.config.json'.",
        'Los artefactos de configuración del arnés deben mantenerse en LF puro (0 CRLF).',
        "Convierte 'harness.config.json' a LF puro eliminando los bytes '\\r' (0x0D)."
      );
    }

    rawText = rawBuf.toString('utf8');
    if (rawText.startsWith('\uFEFF')) {
      return failConfig(
        "Se detectó carácter BOM ('\\uFEFF') al inicio de 'harness.config.json'.",
        'El invariante de portabilidad prohíbe BOM en archivos JSON del arnés.',
        "Elimina el carácter BOM inicial de 'harness.config.json'."
      );
    }
  }

  if (!rawText.trim()) {
    return failConfig(
      "El archivo 'harness.config.json' está vacío.",
      'Un archivo harness.config.json de 0 bytes o en blanco viola el contrato Fail-Closed de configuración.',
      "Escribe un objeto JSON válido en 'harness.config.json' o elimínalo para usar los valores por defecto."
    );
  }

  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    return failConfig(
      `JSON mal formado en 'harness.config.json' (${err.message}).`,
      'El arnés requiere un archivo harness.config.json sintácticamente válido bajo política Fail-Closed.',
      "Corrige la sintaxis JSON en 'harness.config.json' (comas, llaves o comillas dobles)."
    );
  }

  if (!isPlainConfigObject(parsed)) {
    return failConfig(
      "La raíz de 'harness.config.json' debe ser un objeto JSON plano.",
      'No se admiten arreglos, null ni valores primitivos como raíz de harness.config.json.',
      "Reemplaza la raíz de 'harness.config.json' por un objeto JSON con claves válidas."
    );
  }

  for (const key of Object.keys(parsed)) {
    if (!ALLOWED_CONFIG_ROOT_KEYS.has(key)) {
      return failConfig(
        `Clave raíz desconocida '${key}' en 'harness.config.json'.`,
        'El esquema estricto de harness.config.json rechaza propiedades desconocidas para impedir errores silenciosos.',
        `Elimina '${key}' de 'harness.config.json' (claves raíz permitidas: mode, activeStacks, layerMap, brownfield, python, nonDev).`
      );
    }
  }

  let mode = 'auto';
  if (parsed.mode !== undefined) {
    if (typeof parsed.mode !== 'string' || !VALID_CONFIG_MODES.has(parsed.mode)) {
      return failConfig(
        `Valor inválido para 'mode' en 'harness.config.json' (${JSON.stringify(parsed.mode)}).`,
        "El campo 'mode' solo admite exactamente 'auto', 'greenfield', 'brownfield' o 'non-dev'.",
        'Actualiza "mode" en harness.config.json a "auto", "greenfield", "brownfield" o "non-dev".'
      );
    }
    mode = parsed.mode;
  }

  let activeStacks = [];
  if (parsed.activeStacks !== undefined) {
    if (
      !Array.isArray(parsed.activeStacks)
      || !parsed.activeStacks.every((item) => typeof item === 'string' && item.trim().length > 0)
    ) {
      return failConfig(
        "El campo 'activeStacks' en 'harness.config.json' debe ser un arreglo de strings no vacíos.",
        'activeStacks enumera opcionalmente stacks activos sin entradas vacías ni tipos no textuales.',
        'Define "activeStacks" como [] o un arreglo de strings no vacíos (ej. ["node", "python"]).'
      );
    }
    activeStacks = parsed.activeStacks.map((item) => item.trim());
  }

  const mergedLayerMap = cloneDefaultLayerMap();
  const directLayerEntries = [];
  let appExplicitlyMapped = false;

  if (parsed.layerMap !== undefined) {
    if (!isPlainConfigObject(parsed.layerMap)) {
      return failConfig(
        "El bloque 'layerMap' en 'harness.config.json' debe ser un objeto JSON plano.",
        'layerMap mapea las 6 capas canónicas (types, config, repo, service, runtime, ui) a directorios del proyecto.',
        'Define "layerMap" como objeto JSON usando { "<capa>": ["dir1"] } o { "<dir>": "<capa>" }.'
      );
    }

    const explicitByLower = new Map();
    for (const [rawKey, rawVal] of Object.entries(parsed.layerMap)) {
      if (typeof rawKey !== 'string' || !rawKey.trim() || rawKey.includes('\0')) {
        return failConfig(
          "Clave vacía o inválida dentro de 'layerMap' en 'harness.config.json'.",
          'Todas las claves de layerMap deben ser nombres de capa canónicos o rutas relativas no vacías.',
          "Elimina o corrige las claves vacías en 'layerMap' dentro de 'harness.config.json'."
        );
      }
      const trimmedKey = rawKey.trim();

      if (Array.isArray(rawVal)) {
        if (!CANONICAL_LAYER_SET.has(trimmedKey)) {
          return failConfig(
            `Capa desconocida 'layerMap.${trimmedKey}' en 'harness.config.json'.`,
            'El formato canónico { "<capa>": ["dir1"] } solo acepta las 6 capas: types, config, repo, service, runtime y ui.',
            `Usa una de las 6 capas canónicas en lugar de '${trimmedKey}' o el formato invertido { "${trimmedKey}": "<capa>" }.`
          );
        }
        if (rawVal.length === 0 || !rawVal.every((item) => isSafeRelativeConfigDir(item))) {
          return failConfig(
            `Valor inválido o vacío en 'layerMap.${trimmedKey}' dentro de 'harness.config.json'.`,
            'Cada arreglo en layerMap debe contener al menos un nombre de directorio relativo no vacío y sin recorrido ".." ni rutas absolutas.',
            `Define 'layerMap.${trimmedKey}' como un arreglo no vacío de directorios válidos (ej. ["${trimmedKey}"]).`
          );
        }
        for (const item of rawVal) {
          const cleanAlias = normalizeConfigDir(item);
          const lowerAlias = cleanAlias.toLowerCase();
          if (CANONICAL_LAYER_SET.has(lowerAlias) && lowerAlias !== trimmedKey) {
            return failConfig(
              `Colisión ambigua en 'layerMap.${trimmedKey}': no se puede reasignar la capa canónica '${cleanAlias}' hacia '${trimmedKey}'.`,
              'Los 6 nombres canónicos (types, config, repo, service, runtime, ui) están reservados a su propia capa arquitectónica.',
              `Elimina '${cleanAlias}' de 'layerMap.${trimmedKey}' en 'harness.config.json'.`
            );
          }
          if (!cleanAlias.includes('/') && FORBIDDEN_SINGLE_LAYER_DIRS.has(lowerAlias)) {
            return failConfig(
              `Colisión ambigua en 'layerMap.${trimmedKey}': el directorio contenedor o reservado '${cleanAlias}' no puede mapearse como capa.`,
              'Mapear raíces contenedoras (src, backend, packages, apps) o carpetas del arnés (scripts, tests, docs) ciega el escáner de subcapas.',
              `Mapea subdirectorios de dominio específicos en lugar de '${cleanAlias}' dentro de 'harness.config.json'.`
            );
          }
          const prev = explicitByLower.get(lowerAlias);
          if (prev && prev.layer !== trimmedKey) {
            return failConfig(
              `Colisión ambigua en 'layerMap': el directorio '${cleanAlias}' está asignado tanto a '${prev.layer}' como a '${trimmedKey}'.`,
              'Un mismo directorio no puede pertenecer simultáneamente a dos capas arquitectónicas distintas.',
              `Asigna '${cleanAlias}' a una única capa canónica dentro de 'layerMap'.`
            );
          }
          explicitByLower.set(lowerAlias, { alias: cleanAlias, layer: trimmedKey });
          if (lowerAlias === 'app' && trimmedKey !== 'ui') {
            appExplicitlyMapped = true;
          }
        }
      } else if (typeof rawVal === 'string') {
        if (!isSafeRelativeConfigDir(trimmedKey)) {
          return failConfig(
            `Directorio inválido 'layerMap.${trimmedKey}' en 'harness.config.json'.`,
            'Las claves de directorio en el formato invertido de layerMap deben ser rutas relativas seguras y no vacías.',
            `Corrige '${trimmedKey}' en 'layerMap' usando un nombre de directorio relativo válido.`
          );
        }
        const targetLayer = rawVal.trim();
        if (!CANONICAL_LAYER_SET.has(targetLayer)) {
          return failConfig(
            `Capa destino inválida '${rawVal}' para 'layerMap.${trimmedKey}' en 'harness.config.json'.`,
            'El formato invertido { "<dir>": "<capa>" } solo admite como destino types, config, repo, service, runtime o ui.',
            `Cambia el valor de 'layerMap.${trimmedKey}' a una de las 6 capas canónicas.`
          );
        }
        const cleanDir = normalizeConfigDir(trimmedKey);
        const lowerDir = cleanDir.toLowerCase();
        if (CANONICAL_LAYER_SET.has(lowerDir) && lowerDir !== targetLayer) {
          return failConfig(
            `Colisión ambigua en 'layerMap': no se puede reasignar la capa canónica '${cleanDir}' hacia '${targetLayer}'.`,
            'Los 6 nombres canónicos (types, config, repo, service, runtime, ui) están reservados a su propia capa arquitectónica.',
            `Elimina o corrige '${cleanDir}' dentro de 'layerMap' en 'harness.config.json'.`
          );
        }
        if (!cleanDir.includes('/') && FORBIDDEN_SINGLE_LAYER_DIRS.has(lowerDir)) {
          return failConfig(
            `Colisión ambigua en 'layerMap': el directorio contenedor o reservado '${cleanDir}' no puede mapearse como capa.`,
            'Mapear raíces contenedoras (src, backend, packages, apps) o carpetas del arnés ciega la resolución de capas reales.',
            `Elimina '${cleanDir}' de 'layerMap' y mapea las carpetas internas de negocio.`
          );
        }
        const prev = explicitByLower.get(lowerDir);
        if (prev && prev.layer !== targetLayer) {
          return failConfig(
            `Colisión ambigua en 'layerMap': el directorio '${cleanDir}' está asignado tanto a '${prev.layer}' como a '${targetLayer}'.`,
            'Un mismo directorio no puede pertenecer simultáneamente a dos capas arquitectónicas distintas.',
            `Asigna '${cleanDir}' a una única capa canónica dentro de 'layerMap'.`
          );
        }
        explicitByLower.set(lowerDir, { alias: cleanDir, layer: targetLayer });
        directLayerEntries.push([cleanDir, targetLayer]);
        if (lowerDir === 'app' && targetLayer !== 'ui') {
          appExplicitlyMapped = true;
        }
      } else {
        return failConfig(
          `Tipo inválido en 'layerMap.${trimmedKey}' dentro de 'harness.config.json'.`,
          'Cada entrada de layerMap debe ser un arreglo no vacío de strings ({ "<capa>": ["dir1"] }) o un string de capa canónica ({ "<dir>": "<capa>" }).',
          `Corrige el tipo de 'layerMap.${trimmedKey}' en 'harness.config.json'.`
        );
      }
    }

    for (const [lowerAlias, { alias, layer }] of explicitByLower.entries()) {
      for (const other of CANONICAL_LAYERS) {
        if (other !== layer) {
          mergedLayerMap[other] = mergedLayerMap[other].filter((item) => item.toLowerCase() !== lowerAlias);
        }
      }
      if (!mergedLayerMap[layer].some((item) => item.toLowerCase() === lowerAlias)) {
        mergedLayerMap[layer].push(alias);
      }
    }
  }

  const brownfield = {
    enabled: false,
    allowUnmappedDirs: true,
    allowEmptyDirs: false,
    maxLegacyLayerViolations: 0
  };
  if (parsed.brownfield !== undefined) {
    if (!isPlainConfigObject(parsed.brownfield)) {
      return failConfig(
        "El bloque 'brownfield' en 'harness.config.json' debe ser un objeto JSON plano.",
        'brownfield agrupa las banderas de adopción gradual en repositorios heredados.',
        'Define "brownfield" como objeto JSON con enabled, allowUnmappedDirs, allowEmptyDirs y maxLegacyLayerViolations.'
      );
    }
    for (const key of Object.keys(parsed.brownfield)) {
      if (!ALLOWED_BROWNFIELD_KEYS.has(key)) {
        return failConfig(
          `Clave desconocida 'brownfield.${key}' en 'harness.config.json'.`,
          'El bloque brownfield solo admite enabled, allowUnmappedDirs, allowEmptyDirs y maxLegacyLayerViolations.',
          `Elimina '${key}' de 'brownfield' en 'harness.config.json'.`
        );
      }
    }
    for (const boolKey of ['enabled', 'allowUnmappedDirs', 'allowEmptyDirs']) {
      if (parsed.brownfield[boolKey] !== undefined) {
        if (typeof parsed.brownfield[boolKey] !== 'boolean') {
          return failConfig(
            `El campo 'brownfield.${boolKey}' en 'harness.config.json' debe ser booleano (true o false).`,
            'No se admiten strings como "false" ni números en banderas booleanas de configuración.',
            `Cambia 'brownfield.${boolKey}' a true o false sin comillas en 'harness.config.json'.`
          );
        }
        brownfield[boolKey] = parsed.brownfield[boolKey];
      }
    }
    if (parsed.brownfield.maxLegacyLayerViolations !== undefined) {
      const maxViol = parsed.brownfield.maxLegacyLayerViolations;
      if (!Number.isInteger(maxViol) || maxViol < 0) {
        return failConfig(
          "El campo 'brownfield.maxLegacyLayerViolations' en 'harness.config.json' debe ser un entero >= 0.",
          'El tope del trinquete brownfield requiere un número entero no negativo exacto.',
          'Configura "maxLegacyLayerViolations" con un entero >= 0 (ej. 0) en harness.config.json.'
        );
      }
      brownfield.maxLegacyLayerViolations = maxViol;
    }
  }

  const python = {
    requireVenvForPip: true,
    packageRoots: [...DEFAULT_PACKAGE_ROOTS],
    enforceAstChecks: true
  };
  if (parsed.python !== undefined) {
    if (!isPlainConfigObject(parsed.python)) {
      return failConfig(
        "El bloque 'python' en 'harness.config.json' debe ser un objeto JSON plano.",
        'python configura requireVenvForPip, packageRoots y enforceAstChecks.',
        'Define "python" como un objeto JSON plano en harness.config.json.'
      );
    }
    for (const key of Object.keys(parsed.python)) {
      if (!ALLOWED_PYTHON_KEYS.has(key)) {
        return failConfig(
          `Clave desconocida 'python.${key}' en 'harness.config.json'.`,
          'El bloque python solo admite requireVenvForPip, packageRoots y enforceAstChecks.',
          `Elimina '${key}' de 'python' en 'harness.config.json'.`
        );
      }
    }
    for (const boolKey of ['requireVenvForPip', 'enforceAstChecks']) {
      if (parsed.python[boolKey] !== undefined) {
        if (typeof parsed.python[boolKey] !== 'boolean') {
          return failConfig(
            `El campo 'python.${boolKey}' en 'harness.config.json' debe ser booleano (true o false).`,
            'No se admiten strings ni otros tipos en banderas booleanas del bloque python.',
            `Corrige 'python.${boolKey}' a true o false en 'harness.config.json'.`
          );
        }
        python[boolKey] = parsed.python[boolKey];
      }
    }
    if (parsed.python.packageRoots !== undefined) {
      if (
        !Array.isArray(parsed.python.packageRoots)
        || parsed.python.packageRoots.length === 0
        || !parsed.python.packageRoots.every((item) => isSafeRelativeConfigDir(item))
      ) {
        return failConfig(
          "El campo 'python.packageRoots' en 'harness.config.json' debe ser un arreglo no vacío de directorios relativos no vacíos.",
          'packageRoots no admite arreglos vacíos, entradas vacías, rutas absolutas ni segmentos "..".',
          'Configura "packageRoots" como un arreglo de strings no vacíos (ej. ["src", "app", "backend"]).'
        );
      }
      for (const rawRoot of parsed.python.packageRoots) {
        const cleanRoot = normalizeConfigDir(rawRoot);
        if (RESERVED_CONFIG_DIRS.has(cleanRoot.toLowerCase())) {
          return failConfig(
            `Raíz reservada inválida '${rawRoot}' en 'python.packageRoots' dentro de 'harness.config.json'.`,
            'Las carpetas internas del arnés o entornos (.venv, scripts, tests, docs, node_modules) no pueden declararse como packageRoots.',
            `Retira '${rawRoot}' de 'python.packageRoots' en 'harness.config.json'.`
          );
        }
      }
      python.packageRoots = parsed.python.packageRoots.map((item) => normalizeConfigDir(item));
    }
  }

  const resolvedSegToLayer = new Map();
  for (const canon of CANONICAL_LAYERS) {
    resolvedSegToLayer.set(canon, canon);
    for (const alias of mergedLayerMap[canon]) {
      resolvedSegToLayer.set(alias.toLowerCase(), canon);
    }
  }
  for (const pr of python.packageRoots) {
    const lowPr = pr.toLowerCase();
    if (resolvedSegToLayer.has(lowPr)) {
      const mappedLayer = resolvedSegToLayer.get(lowPr);
      const isStandardAppDefault = lowPr === 'app' && mappedLayer === 'ui' && !appExplicitlyMapped;
      if (!isStandardAppDefault) {
        return failConfig(
          `Colisión ambigua en 'harness.config.json': '${pr}' figura simultáneamente en 'python.packageRoots' y como carpeta mapeada a la capa '${mappedLayer}' en 'layerMap'.`,
          'Declarar una carpeta mapeada de capa como packageRoot ciega o distorsiona la detección del flujo direccional de 6 capas.',
          `Usa raíces contenedoras separadas en 'python.packageRoots' (ej. src, backend) y deja '${pr}' únicamente en 'layerMap'.`
        );
      }
    }
  }

  const nonDev = {
    deliverableDirs: [...DEFAULT_DELIVERABLE_DIRS],
    forbidPlaceholders: true,
    checkMarkdownLinks: true,
    minDeliverableWords: 15
  };
  if (parsed.nonDev !== undefined) {
    if (!isPlainConfigObject(parsed.nonDev)) {
      return failConfig(
        "El bloque 'nonDev' en 'harness.config.json' debe ser un objeto JSON plano.",
        'nonDev gobierna la validación de entregables documentales.',
        'Define "nonDev" como un objeto JSON plano en harness.config.json.'
      );
    }
    for (const key of Object.keys(parsed.nonDev)) {
      if (!ALLOWED_NON_DEV_KEYS.has(key)) {
        return failConfig(
          `Clave desconocida 'nonDev.${key}' en 'harness.config.json'.`,
          'El bloque nonDev solo admite deliverableDirs, forbidPlaceholders, checkMarkdownLinks y minDeliverableWords.',
          `Elimina '${key}' de 'nonDev' en 'harness.config.json'.`
        );
      }
    }
    if (parsed.nonDev.deliverableDirs !== undefined) {
      if (
        !Array.isArray(parsed.nonDev.deliverableDirs)
        || parsed.nonDev.deliverableDirs.length === 0
        || !parsed.nonDev.deliverableDirs.every((item) => isSafeRelativeConfigDir(item))
      ) {
        return failConfig(
          "El campo 'nonDev.deliverableDirs' en 'harness.config.json' debe ser un arreglo no vacío de directorios relativos no vacíos.",
          'deliverableDirs no admite arreglos vacíos, strings vacíos, tipos no textuales ni rutas fuera del repositorio.',
          'Configura "deliverableDirs" como un arreglo de strings no vacíos (ej. ["deliverables", "reports"]).'
        );
      }
      nonDev.deliverableDirs = parsed.nonDev.deliverableDirs.map((item) => normalizeConfigDir(item));
    }
    for (const boolKey of ['forbidPlaceholders', 'checkMarkdownLinks']) {
      if (parsed.nonDev[boolKey] !== undefined) {
        if (typeof parsed.nonDev[boolKey] !== 'boolean') {
          return failConfig(
            `El campo 'nonDev.${boolKey}' en 'harness.config.json' debe ser booleano (true o false).`,
            'Las reglas de calidad documental exigen valores booleanos estrictos.',
            `Actualiza 'nonDev.${boolKey}' a true o false en 'harness.config.json'.`
          );
        }
        nonDev[boolKey] = parsed.nonDev[boolKey];
      }
    }
    if (parsed.nonDev.minDeliverableWords !== undefined) {
      const minWords = parsed.nonDev.minDeliverableWords;
      if (!Number.isInteger(minWords) || minWords < 0) {
        return failConfig(
          "El campo 'nonDev.minDeliverableWords' en 'harness.config.json' debe ser un entero >= 0.",
          'minDeliverableWords representa el mínimo exacto no negativo de palabras reales por entregable.',
          'Configura "minDeliverableWords" con un entero >= 0 (ej. 15) en harness.config.json.'
        );
      }
      nonDev.minDeliverableWords = minWords;
    }
  }

  const mappedLowerDirs = new Set(CANONICAL_LAYERS);
  for (const canon of CANONICAL_LAYERS) {
    for (const alias of mergedLayerMap[canon]) {
      mappedLowerDirs.add(alias.toLowerCase());
    }
  }

  const collapsiblePackageRoots = python.packageRoots.filter((pkgRoot) => {
    const low = pkgRoot.toLowerCase();
    if (low === 'app' && !appExplicitlyMapped) return true;
    return !mappedLowerDirs.has(low);
  });

  return {
    ok: true,
    config: {
      exists: true,
      mode,
      activeStacks,
      layerMap: mergedLayerMap,
      directLayerEntries,
      appExplicitlyMapped,
      collapsiblePackageRoots,
      brownfield,
      python,
      nonDev
    },
    error: null,
    why: null,
    fix: null
  };
}

export function scoreHarness(files, root = process.cwd()) {
  const byPath = new Map(files.map((file) => [file.path, file.content]));
  const allText = files.map((file) => `${file.path}\n${file.content}`).join('\n\n');
  const agents = byPath.has('AGENTS.md') ? (byPath.get('AGENTS.md') || '') : (byPath.get('CLAUDE.md') || '');
  const featureList = byPath.has('feature_list.json') ? (byPath.get('feature_list.json') || '') : (byPath.get('feature-list.json') || '');
  const progress = byPath.get('progress.md') || '';
  const init = byPath.get('init.sh') || '';
  const handoff = byPath.get('session-handoff.md') || '';
  const handoffOrProgress = byPath.has('session-handoff.md') ? handoff : progress;
  const cfgValidation = byPath.has('harness.config.json')
    ? validateHarnessConfig(root, byPath.get('harness.config.json'))
    : validateHarnessConfig(root);
  const isNonDev = cfgValidation.ok && cfgValidation.config.mode === 'non-dev';

  const startupNeedles = isNonDev
    ? ['Startup Workflow', 'Before writing code', 'Before modifying', 'Antes de modificar']
    : ['Startup Workflow', 'Before writing code'];
  const testNeedles = isNonDev
    ? ['test', 'pytest', 'vitest', 'cargo test', 'go test', 'dotnet test', '--min-score', 'verify', 'verificación']
    : ['test', 'pytest', 'vitest', 'cargo test', 'go test', 'dotnet test'];
  const staticNeedles = isNonDev
    ? ['build', 'type', 'lint', 'compile', 'check-architecture.sh', 'architecture']
    : ['build', 'type', 'lint', 'compile'];

  const checks = {
    instructions: [
      hasFile(byPath, ['AGENTS.md', 'CLAUDE.md'], 'Agent instruction file exists'),
      structuredHas(agents, startupNeedles, 'Startup workflow documented'),
      structuredHas(agents, ['Definition of Done', 'done only when'], 'Definition of done documented'),
      structuredHas(agents, ['Verification Commands', './init.sh', 'test', 'verify'], 'Verification commands discoverable'),
      structuredHas(agents, ['feature_list.json', 'progress.md'], 'State artifacts routed from instructions')
    ],
    state: [
      hasFile(byPath, ['feature_list.json', 'feature-list.json'], 'Feature tracker exists'),
      stateAndConfigCheck(featureList, root, cfgValidation, 'Feature tracker has structured tasks, enforces Pass-State Gating, and verifies physical deliverables on disk'),
      hasFile(byPath, ['progress.md'], 'Progress log exists'),
      structuredHas(progress, ['Current State', 'What', 'Next'], 'Progress log supports restart'),
      structuredHas(handoffOrProgress, ['Blockers', 'Files', 'Next Session'], 'Handoff captures blockers/files/next step')
    ],
    verification: [
      hasFile(byPath, ['init.sh'], 'Verification entrypoint exists'),
      textHas(init, ['set -e', 'set -euo pipefail'], 'Verification fails fast'),
      textHas(init + agents, testNeedles, 'Test command documented'),
      textHas(init + agents, staticNeedles, 'Static/build check documented'),
      textHas(allText, ['Evidence', 'Verification Evidence', 'command and output'], 'Verification evidence is recorded')
    ],
    scope: [
      wipLimitCheck(agents, featureList, 'One-feature-at-a-time rule exists and WIP <= 1 enforced in feature_list.json'),
      dagDependencyCheck(featureList, 'Feature dependencies are tracked and strict sequential DAG order is respected (no skipping tasks)'),
      explicitStatusCheck(agents, featureList, 'Feature status is explicit'),
      structuredHas(agents, ['Stay in scope', 'scope'], 'Scope boundary documented'),
      structuredHas(agents, ['Definition of Done'], 'Completion gate limits scope closure')
    ],
    lifecycle: [
      hasFile(byPath, ['init.sh'], 'Startup script exists'),
      structuredHas(agents, ['End of Session', 'Before ending'], 'End-of-session procedure exists'),
      hasFile(byPath, ['session-handoff.md'], 'Session handoff template exists'),
      structuredHas(progress + '\n' + handoff, ['Last Updated', 'Current Objective', 'Recommended Next Step'], 'Session restart markers exist'),
      textHas(agents + init, ['restartable', 'clean', 'Next steps'], 'Clean restart path documented')
    ]
  };

  const subsystems = Object.fromEntries(Object.entries(checks).map(([name, subsystemChecks]) => {
    const passed = subsystemChecks.filter((check) => check.pass).length;
    const score = Math.max(1, Math.round((passed / subsystemChecks.length) * 5));
    return [name, {
      score,
      passed,
      total: subsystemChecks.length,
      checks: subsystemChecks
    }];
  }));

  const total = Object.values(subsystems).reduce((sum, item) => sum + item.score, 0);
  const overall = Math.round((total / (SUBSYSTEMS.length * 5)) * 100);
  const ranked = Object.entries(subsystems).sort((a, b) => a[1].score - b[1].score);
  const bottleneck = ranked[0][1].score === 5 ? null : ranked[0][0];
  return cfgValidation.ok
    ? { overall, bottleneck, subsystems }
    : {
      overall,
      bottleneck,
      subsystems,
      configError: {
        error: cfgValidation.error,
        why: cfgValidation.why,
        fix: cfgValidation.fix
      }
    };
}

function stateAndConfigCheck(featureListText, root, cfgValidation, message) {
  if (!cfgValidation.ok) {
    return { pass: false, message: `${message} (ERROR en harness.config.json: ${cfgValidation.error})` };
  }
  return jsonFeatureList(featureListText, root, message);
}

function hasFile(byPath, names, message) {
  return {
    pass: names.some((name) => byPath.has(name) && (byPath.get(name) || '').trim().length > 0),
    message
  };
}

function textHas(text, needles, message) {
  const lower = text.toLowerCase();
  return { pass: needles.some((needle) => lower.includes(needle.toLowerCase())), message };
}

function structuredText(markdown) {
  const kept = [];
  let inFence = false;
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (/^(```|~~~)/.test(line)) { inFence = !inFence; continue; }
    if (inFence) { kept.push(line); continue; }
    if (!line) continue;
    const isHeading = /^#{1,6}\s/.test(line);
    const isList = /^([-*+]|\d+\.)\s/.test(line);
    const isTable = line.startsWith('|');
    const isBoldLead = /^\*\*[^*]+\*\*/.test(line);
    if (isHeading || isList || isTable || isBoldLead) kept.push(line);
  }
  return kept.join('\n');
}

function structuredHas(markdown, needles, message) {
  return textHas(structuredText(markdown), needles, message);
}

export function findDependencyCycle(features) {
  if (!Array.isArray(features)) return null;
  const depsById = new Map();
  for (const f of features) {
    if (f && typeof f.id === 'string' && f.id.trim().length > 0) {
      depsById.set(f.id, Array.isArray(f.dependencies) ? f.dependencies : []);
    }
  }
  const color = new Map(); // 0 = unvisited, 1 = visiting, 2 = visited
  const trail = [];

  function dfs(nodeId) {
    color.set(nodeId, 1);
    trail.push(nodeId);
    for (const depId of depsById.get(nodeId) || []) {
      if (!depsById.has(depId)) continue;
      const state = color.get(depId) || 0;
      if (state === 1) {
        const idx = trail.indexOf(depId);
        return [...trail.slice(idx >= 0 ? idx : 0), depId];
      }
      if (state === 0) {
        const cycle = dfs(depId);
        if (cycle) return cycle;
      }
    }
    trail.pop();
    color.set(nodeId, 2);
    return null;
  }

  for (const id of depsById.keys()) {
    if ((color.get(id) || 0) === 0) {
      const cycle = dfs(id);
      if (cycle) return cycle;
    }
  }
  return null;
}

function isSafeRepoRelativePath(resolvedRoot, relPath) {
  if (typeof relPath !== 'string' || relPath.trim().length === 0 || relPath.includes('\0')) {
    return false;
  }
  if (path.isAbsolute(relPath) || path.posix.isAbsolute(relPath) || path.win32.isAbsolute(relPath) || /^[a-zA-Z]:/.test(relPath)) {
    return false;
  }
  const full = path.resolve(resolvedRoot, relPath);
  const rel = path.relative(resolvedRoot, full);
  return Boolean(rel) && rel !== '.' && rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\') && !path.isAbsolute(rel);
}

function canonicalizeRepoRelPath(resolvedRoot, relPath) {
  return path.relative(resolvedRoot, path.resolve(resolvedRoot, relPath)).replace(/\\/g, '/');
}

function computeDagLineage(features) {
  const byId = new Map(features.map((f) => [f.id, f]));
  const ancestorsById = new Map();
  const descendantsById = new Map(features.map((f) => [f.id, new Set()]));

  function getAncestors(id, visited = new Set()) {
    if (ancestorsById.has(id)) return ancestorsById.get(id);
    const anc = new Set();
    const feat = byId.get(id);
    if (feat && Array.isArray(feat.dependencies)) {
      for (const depId of feat.dependencies) {
        if (!byId.has(depId) || visited.has(depId)) continue;
        visited.add(depId);
        anc.add(depId);
        for (const transId of getAncestors(depId, visited)) {
          anc.add(transId);
        }
      }
    }
    ancestorsById.set(id, anc);
    return anc;
  }

  for (const f of features) {
    const ancs = getAncestors(f.id);
    for (const ancId of ancs) {
      descendantsById.get(ancId)?.add(f.id);
    }
  }

  return { byId, ancestorsById, descendantsById };
}

export function validateFeatureListObject(parsed, root = process.cwd()) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, reason: 'feature_list.json root must be a JSON object' };
  }
  if (!Object.keys(parsed).every((k) => ALLOWED_ROOT_KEYS.has(k))) {
    return { valid: false, reason: 'feature_list.json contains unsupported root properties' };
  }
  if (parsed.project !== undefined && (typeof parsed.project !== 'string' || parsed.project.trim().length === 0)) {
    return { valid: false, reason: 'project field must be a non-empty string when present' };
  }
  if (!Array.isArray(parsed.features) || parsed.features.length === 0) {
    return { valid: false, reason: 'feature_list.json must contain at least 1 feature' };
  }

  const resolvedRoot = path.resolve(root);
  const seenIds = new Set();
  for (const f of parsed.features) {
    if (!f || typeof f !== 'object' || Array.isArray(f) || typeof f.id !== 'string' || !FEATURE_ID_RE.test(f.id)) {
      return { valid: false, reason: 'every feature must define a lowercase kebab-case id (e.g. feat-001)' };
    }
    if (!Object.keys(f).every((k) => ALLOWED_FEATURE_KEYS.has(k))) {
      return { valid: false, reason: `feature '${f.id}' contains unsupported properties` };
    }
    if (seenIds.has(f.id)) {
      return { valid: false, reason: `duplicate feature id '${f.id}'` };
    }
    seenIds.add(f.id);
  }

  for (const feature of parsed.features) {
    const hasBaseFields = typeof feature.name === 'string'
      && feature.name.trim().length > 0
      && (feature.title === undefined || (typeof feature.title === 'string' && feature.title.trim().length > 0))
      && typeof feature.description === 'string'
      && feature.description.trim().length > 0
      && typeof feature.status === 'string'
      && ALLOWED_FEATURE_STATUSES.has(feature.status)
      && Array.isArray(feature.dependencies)
      && feature.dependencies.every((depId) => typeof depId === 'string' && depId !== feature.id && seenIds.has(depId))
      && Array.isArray(feature.required_files)
      && feature.required_files.length > 0
      && feature.required_files.every((relPath) => isSafeRepoRelativePath(resolvedRoot, relPath))
      && Array.isArray(feature.verification)
      && feature.verification.length > 0
      && feature.verification.every((step) => typeof step === 'string' && step.trim().length > 0);
    if (!hasBaseFields) {
      return { valid: false, reason: `feature '${feature.id}' is missing required fields, uses an invalid status, escapes repo root in required_files, or references an unknown dependency` };
    }

    if (feature.deprecated_files !== undefined) {
      if (
        !Array.isArray(feature.deprecated_files)
        || !feature.deprecated_files.every((relPath) => isSafeRepoRelativePath(resolvedRoot, relPath))
      ) {
        return { valid: false, reason: `feature '${feature.id}' deprecated_files must be an array of safe repo-relative file paths` };
      }
      const seenDep = new Set();
      for (const relPath of feature.deprecated_files) {
        const canon = canonicalizeRepoRelPath(resolvedRoot, relPath);
        if (seenDep.has(canon)) {
          return { valid: false, reason: `feature '${feature.id}' contains duplicate path '${relPath}' in deprecated_files` };
        }
        seenDep.add(canon);
      }
    }

    if (feature.area !== undefined && (typeof feature.area !== 'string' || feature.area.trim().length === 0)) {
      return { valid: false, reason: `feature '${feature.id}' area must be a non-empty string when provided` };
    }
    if (feature.user_visible_behavior !== undefined && (typeof feature.user_visible_behavior !== 'string' || feature.user_visible_behavior.trim().length === 0)) {
      return { valid: false, reason: `feature '${feature.id}' user_visible_behavior must be a non-empty string when provided` };
    }
    if (feature.notes !== undefined && typeof feature.notes !== 'string') {
      return { valid: false, reason: `feature '${feature.id}' notes must be a string when provided` };
    }
    if (feature.priority !== undefined) {
      const validPriority = (typeof feature.priority === 'string' && feature.priority.trim().length > 0)
        || Number.isInteger(feature.priority);
      if (!validPriority) {
        return { valid: false, reason: `feature '${feature.id}' priority must be a non-empty string or integer` };
      }
    }

    const isDone = feature.status === 'done';
    const hasEvidenceIfDone = !isDone || (typeof feature.evidence === 'string' && feature.evidence.trim().length >= 10);
    if (!hasEvidenceIfDone) {
      return { valid: false, reason: `feature '${feature.id}' is marked done without executable verification evidence (min 10 chars)` };
    }
  }

  const cycle = findDependencyCycle(parsed.features);
  if (cycle) {
    return { valid: false, reason: `circular dependency detected in DAG: ${cycle.join(' -> ')}` };
  }

  const { byId, ancestorsById, descendantsById } = computeDagLineage(parsed.features);
  const reqCanonById = new Map();
  const depCanonById = new Map();
  for (const feature of parsed.features) {
    reqCanonById.set(
      feature.id,
      new Set(feature.required_files.map((relPath) => canonicalizeRepoRelPath(resolvedRoot, relPath)))
    );
    depCanonById.set(
      feature.id,
      new Set((feature.deprecated_files || []).map((relPath) => canonicalizeRepoRelPath(resolvedRoot, relPath)))
    );
  }

  // Candados Anti-Trampa #1 y #2 para deprecated_files
  for (const feature of parsed.features) {
    if (!Array.isArray(feature.deprecated_files) || feature.deprecated_files.length === 0) continue;
    const ownRequired = reqCanonById.get(feature.id);
    const ancestors = ancestorsById.get(feature.id) || new Set();

    for (const relPath of feature.deprecated_files) {
      const canon = canonicalizeRepoRelPath(resolvedRoot, relPath);
      if (ownRequired.has(canon)) {
        return {
          valid: false,
          reason: `feature '${feature.id}' cannot list '${relPath}' in both required_files and deprecated_files (self-deprecation forbidden)`
        };
      }
      const introducedByAncestor = [...ancestors].some((ancId) => reqCanonById.get(ancId)?.has(canon));
      if (!introducedByAncestor) {
        return {
          valid: false,
          reason: `feature '${feature.id}' cannot deprecate '${relPath}' because no ancestor in its dependency DAG declared it in required_files`
        };
      }
    }
  }

  // Resolución Temporal de Existencia en Disco (Pass-State Gating Evolutivo) y Candado Anti-Zombi Inverso
  for (const feature of parsed.features) {
    if (feature.status !== 'done') continue;
    const descendants = descendantsById.get(feature.id) || new Set();

    for (const relPath of feature.required_files) {
      const canon = canonicalizeRepoRelPath(resolvedRoot, relPath);
      const deprecatedByActiveOrDoneDescendant = [...descendants].some((descId) => {
        const desc = byId.get(descId);
        if (!desc || (desc.status !== 'in-progress' && desc.status !== 'done')) return false;
        if (!depCanonById.get(descId)?.has(canon)) return false;
        const laterDescendants = descendantsById.get(descId) || new Set();
        const reRequiredLater = [...laterDescendants].some((laterId) => {
          const later = byId.get(laterId);
          return later && (later.status === 'in-progress' || later.status === 'done') && reqCanonById.get(laterId)?.has(canon);
        });
        return !reRequiredLater;
      });

      if (deprecatedByActiveOrDoneDescendant) continue;

      const full = path.resolve(resolvedRoot, relPath);
      let fileOk = false;
      try {
        fileOk = existsSync(full) && statSync(full).isFile() && statSync(full).size > 0;
      } catch {
        fileOk = false;
      }
      if (!fileOk) {
        return { valid: false, reason: `feature '${feature.id}' is marked done with missing, non-file, or empty required_files on disk (${relPath})` };
      }
    }

    if (Array.isArray(feature.deprecated_files)) {
      for (const relPath of feature.deprecated_files) {
        const canon = canonicalizeRepoRelPath(resolvedRoot, relPath);
        const reRequiredLater = [...descendants].some((laterId) => {
          const later = byId.get(laterId);
          return later && (later.status === 'in-progress' || later.status === 'done') && reqCanonById.get(laterId)?.has(canon);
        });
        if (reRequiredLater) continue;

        const full = path.resolve(resolvedRoot, relPath);
        if (existsSync(full)) {
          return {
            valid: false,
            reason: `feature '${feature.id}' is marked done but deprecated file '${relPath}' still exists on disk (zombie file)`
          };
        }
      }
    }
  }

  return { valid: true, reason: null };
}

function jsonFeatureList(text, root, message) {
  try {
    const parsed = JSON.parse(text);
    const check = validateFeatureListObject(parsed, root);
    if (!check.valid) {
      return { pass: false, message: `${message} (ERROR: ${check.reason})` };
    }
    return { pass: true, message };
  } catch {
    return { pass: false, message };
  }
}

function explicitStatusCheck(agentsMarkdown, featureListText, message) {
  if (!textHas(agentsMarkdown + featureListText, ['status'], message).pass) {
    return { pass: false, message };
  }
  if (!featureListText) {
    return { pass: false, message };
  }
  try {
    const parsed = JSON.parse(featureListText);
    if (!Array.isArray(parsed.features) || parsed.features.length === 0) {
      return { pass: false, message };
    }
    const allStatusesValid = parsed.features.every(
      (feature) => typeof feature.status === 'string' && ALLOWED_FEATURE_STATUSES.has(feature.status)
    );
    return { pass: allStatusesValid, message };
  } catch {
    return { pass: false, message };
  }
}

export function dagDependencyCheck(featureListText, message) {
  try {
    const parsed = JSON.parse(featureListText);
    if (!Array.isArray(parsed.features) || parsed.features.length === 0) {
      return { pass: false, message };
    }
    const seenIds = new Set();
    for (const f of parsed.features) {
      if (!f || typeof f.id !== 'string' || f.id.trim().length === 0 || seenIds.has(f.id)) {
        return { pass: false, message };
      }
      seenIds.add(f.id);
    }
    for (const f of parsed.features) {
      if (!Array.isArray(f.dependencies) || !f.dependencies.every((d) => typeof d === 'string' && d !== f.id && seenIds.has(d))) {
        return { pass: false, message };
      }
    }
    if (findDependencyCycle(parsed.features)) {
      return { pass: false, message };
    }
    const statusById = new Map(parsed.features.map((f) => [f.id, f.status]));
    const dagRespected = parsed.features.every((feature) => {
      const isStartedOrDone = feature.status === 'in-progress'
        || feature.status === 'in_progress'
        || feature.status === 'active'
        || feature.status === 'done'
        || feature.status === 'passing';
      if (!isStartedOrDone) return true;
      return feature.dependencies.every((depId) => {
        const depStatus = statusById.get(depId);
        return depStatus === 'done' || depStatus === 'passing';
      });
    });
    return { pass: dagRespected, message };
  } catch {
    return { pass: false, message };
  }
}

function wipLimitCheck(agentsMarkdown, featureListText, message) {
  const hasRule = structuredHas(agentsMarkdown, ['One feature at a time', 'one-feature-at-a-time'], message).pass;
  if (!hasRule) return { pass: false, message };
  if (!featureListText) return { pass: true, message };
  try {
    const parsed = JSON.parse(featureListText);
    if (!Array.isArray(parsed.features)) return { pass: false, message };
    const activeCount = parsed.features.filter((f) =>
      f.status === 'in-progress' || f.status === 'in_progress' || f.status === 'active'
    ).length;
    return { pass: activeCount <= 1, message };
  } catch {
    return { pass: false, message };
  }
}

export async function loadHarnessFiles(root) {
  const candidates = [
    'AGENTS.md',
    'CLAUDE.md',
    'feature_list.json',
    'feature-list.json',
    'progress.md',
    'session-handoff.md',
    'init.sh'
  ];
  const files = [];
  for (const candidate of candidates) {
    const fullPath = path.join(root, candidate);
    if (await exists(fullPath)) {
      files.push({ path: candidate, content: await readText(fullPath) });
    }
  }
  return files;
}

export function formatScoreReport(result, root = '.') {
  const lines = [
    `Harness validation for ${root}`,
    `Overall: ${result.overall}/100`,
    `Bottleneck: ${result.bottleneck ?? 'none — all subsystems at full score'}`,
    ''
  ];

  for (const [name, subsystem] of Object.entries(result.subsystems)) {
    lines.push(`${name}: ${subsystem.score}/5 (${subsystem.passed}/${subsystem.total})`);
    for (const check of subsystem.checks) {
      lines.push(`  ${check.pass ? 'PASS' : 'FAIL'} ${check.message}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export function htmlReport(result, title = 'Harness Assessment') {
  const rows = Object.entries(result.subsystems).map(([name, subsystem]) => {
    const checks = subsystem.checks.map((check) =>
      `<li class="${check.pass ? 'pass' : 'fail'}">${check.pass ? 'PASS' : 'FAIL'} ${escapeHtml(check.message)}</li>`
    ).join('');
    return `<section>
      <h2>${escapeHtml(name)} <span>${subsystem.score}/5</span></h2>
      <ul>${checks}</ul>
    </section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #172026; background: #f7f8fa; }
    main { max-width: 960px; margin: 0 auto; }
    header { margin-bottom: 24px; }
    h1 { margin: 0 0 8px; font-size: 32px; }
    .summary { display: flex; gap: 16px; flex-wrap: wrap; margin: 20px 0; }
    .metric { background: white; border: 1px solid #d9dee5; border-radius: 8px; padding: 16px 18px; min-width: 180px; }
    .metric strong { display: block; font-size: 28px; margin-top: 4px; }
    section { background: white; border: 1px solid #d9dee5; border-radius: 8px; margin: 14px 0; padding: 16px 18px; }
    h2 { margin: 0 0 10px; font-size: 20px; display: flex; justify-content: space-between; }
    ul { margin: 0; padding-left: 20px; }
    li { margin: 6px 0; }
    .pass { color: #126c43; }
    .fail { color: #a23020; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${escapeHtml(title)}</h1>
      <p>Reporte de validación de los 5 subsistemas del arnés.</p>
      <div class="summary">
        <div class="metric">Puntaje Total<strong>${result.overall}/100</strong></div>
        <div class="metric">Cuello de Botella<strong>${escapeHtml(result.bottleneck ?? 'ninguno')}</strong></div>
      </div>
    </header>
    ${rows}
  </main>
</body>
</html>
`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
