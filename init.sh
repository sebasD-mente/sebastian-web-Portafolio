#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# Comandos personalizables por proyecto (opcionales; si están vacíos se usa autodetección multi-stack aditiva).
# Configura RUN_START_COMMAND=1 para lanzar START_CMD automáticamente tras superar las 3 puertas.
INSTALL_CMD="${INSTALL_CMD:-}"
VERIFY_CMD="${VERIFY_CMD:-}"
START_CMD="${START_CMD:-}"
RUN_START_COMMAND="${RUN_START_COMMAND:-0}"

has_pkg_script() {
  local script_name="$1"
  node -e "const s = require('./package.json').scripts || {}; process.exit(Object.prototype.hasOwnProperty.call(s, process.argv[1]) && s[process.argv[1]] ? 0 : 1);" "$script_name" >/dev/null 2>&1
}

run_pm_script() {
  local pm="$1"
  local script_name="$2"
  if [ "$pm" = "npm" ]; then
    npm run "$script_name"
  else
    "$pm" run "$script_name"
  fi
}

PY_CMD=()
find_python_cmd() {
  PY_CMD=()
  local cand
  for cand in ".venv/Scripts/python.exe" ".venv/bin/python" "venv/Scripts/python.exe" "venv/bin/python" "python3" "python"; do
    if [[ "$cand" == */* ]]; then
      [ -f "$cand" ] || continue
    else
      command -v "$cand" >/dev/null 2>&1 || continue
    fi
    if "$cand" -c "import sys; assert sys.version_info[0] >= 3" >/dev/null 2>&1; then
      PY_CMD=("$cand")
      return 0
    fi
  done
  if command -v py >/dev/null 2>&1 && py -3 -c "import sys; assert sys.version_info[0] >= 3" >/dev/null 2>&1; then
    PY_CMD=("py" "-3")
    return 0
  fi
  return 1
}

bootstrap_python_venv() {
  if [ -z "$INSTALL_CMD" ] && [ "${HARNESS_SKIP_INSTALL:-0}" != "1" ] && { [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; } && [ ! -d ".venv" ] && [ ! -d "venv" ]; then
    if find_python_cmd; then
      echo "=== Creando entorno virtual aislado (.venv) automáticamente ==="
      "${PY_CMD[@]}" -m venv .venv
      if [ -f ".venv/Scripts/python.exe" ]; then
        PY_CMD=(".venv/Scripts/python.exe")
      elif [ -f ".venv/bin/python" ]; then
        PY_CMD=(".venv/bin/python")
      fi

      if [ -f "requirements.txt" ]; then
        if grep -Eq '^[[:space:]]*[^#[:space:]]' "requirements.txt"; then
          echo "=== Instalando dependencias de requirements.txt en .venv ==="
          "${PY_CMD[@]}" -m pip install -r requirements.txt
        fi
      elif [ -f "pyproject.toml" ] && grep -Eq '^[[:space:]]*\[build-system\]' "pyproject.toml"; then
        echo "=== Instalando paquete editable (-e .) desde pyproject.toml en .venv ==="
        "${PY_CMD[@]}" -m pip install -e .
      fi
    fi
  fi
}

echo "=== 1. Confirmando Directorio de Trabajo ==="
echo "Ruta actual: $PWD"
bootstrap_python_venv

echo "=== 2. [PUERTA 1: ESTÁTICA] Archivos Críticos, Sintaxis y Límites Arquitectónicos (6 Capas) ==="
for file in "AGENTS.md" "feature_list.json" "progress.md" "session-handoff.md" "clean-state-checklist.md" "memory/INDEX.md" "ARCHITECTURE.md" "scripts/check-architecture.sh" "scripts/feature-list.schema.json" ".gitignore"; do
  if [ ! -f "$file" ]; then
    echo "ERROR: Falta el archivo crítico '$file' en el repositorio."
    echo "POR QUÉ: El agente no puede operar ni verificar límites arquitectónicos sin su sistema de registro completo."
    echo "SOLUCIÓN (FIX): Restaura o crea el archivo '$file' siguiendo la especificación de AGENTS.md y ARCHITECTURE.md antes de continuar."
    exit 1
  fi
done
echo "OK: Todos los archivos críticos del arnés están presentes."

bash scripts/check-architecture.sh

echo "=== 3. [PUERTA 2: COMPORTAMIENTO] Validación de los 5 Subsistemas, Regla WIP=1, DAG y Pass-State Gating ==="
if command -v node >/dev/null 2>&1 && [ -f "scripts/validate-harness.mjs" ]; then
  node scripts/validate-harness.mjs --min-score 100
else
  echo "ERROR: No se encontró Node.js o 'scripts/validate-harness.mjs'."
  echo "POR QUÉ: La Puerta 2 requiere evaluar el comportamiento de los 5 subsistemas del arnés con puntaje 100/100."
  echo "SOLUCIÓN (FIX): Verifica que Node.js esté instalado en PATH y que 'scripts/validate-harness.mjs' exista."
  exit 1
fi

echo "=== 4. [PUERTA 3: SISTEMA COMPLETO] Sincronización y Flujo End-to-End del Proyecto (Build / Lint / Test) ==="
if [ -f "scripts/check-deliverables.mjs" ]; then
  node scripts/check-deliverables.mjs
fi

if [ -n "$INSTALL_CMD" ]; then
  echo "=== Sincronizando dependencias personalizadas ($INSTALL_CMD) ==="
  bash -c "$INSTALL_CMD"
fi

STACKS_RAN=0

if [ -n "$VERIFY_CMD" ]; then
  echo "=== Ejecutando verificación personalizada ($VERIFY_CMD) ==="
  bash -c "$VERIFY_CMD"
  STACKS_RAN=$((STACKS_RAN + 1))
else
  # 1. Stack Node / Web (independiente y aditivo)
  if [ -f "package.json" ]; then
    STACKS_RAN=$((STACKS_RAN + 1))
    echo "=== Ejecutando verificación Node / Web (package.json) ==="
    if [ -f "pnpm-lock.yaml" ]; then
      PM="pnpm"
    elif [ -f "yarn.lock" ]; then
      PM="yarn"
    elif [ -f "bun.lock" ] || [ -f "bun.lockb" ]; then
      PM="bun"
    else
      PM="npm"
    fi

    if [ -z "$INSTALL_CMD" ] && [ "${HARNESS_SKIP_INSTALL:-0}" != "1" ]; then
      if [ ! -d "node_modules" ] || [ "${HARNESS_FORCE_INSTALL:-0}" = "1" ]; then
        echo "=== Instalando dependencias con $PM ==="
        if [ "$PM" = "npm" ]; then
          npm install
        else
          "$PM" install
        fi
      else
        echo "=== Dependencias detectadas en node_modules/ (usa HARNESS_FORCE_INSTALL=1 para reinstalar) ==="
      fi
    fi

    if has_pkg_script "check"; then
      run_pm_script "$PM" "check"
    fi
    if has_pkg_script "typecheck"; then
      run_pm_script "$PM" "typecheck"
    elif has_pkg_script "type-check"; then
      run_pm_script "$PM" "type-check"
    fi
    if has_pkg_script "lint"; then
      run_pm_script "$PM" "lint"
    fi
    if has_pkg_script "test"; then
      if [ "$PM" = "npm" ]; then
        npm test
      else
        "$PM" test
      fi
    fi
    if has_pkg_script "build"; then
      run_pm_script "$PM" "build"
    fi

    if [ -z "$START_CMD" ]; then
      if has_pkg_script "dev"; then
        START_CMD="$PM run dev"
      elif has_pkg_script "start"; then
        START_CMD="$PM start"
      fi
    fi
  fi

  # 2. Stack Python (independiente y aditivo: manifiestos o archivos .py reales)
  py_file_detected="$(find . -maxdepth 6 -type f -name "*.py" \
    -not -path "./.git/*" \
    -not -path "./node_modules/*" \
    -not -path "./.venv/*" \
    -not -path "./venv/*" \
    -not -path "./env/*" \
    -not -path "./dist/*" \
    -not -path "./build/*" \
    -not -path "*/__pycache__/*" \
    -not -path "./.pytest_cache/*" \
    -not -path "./.mypy_cache/*" \
    -not -path "./.ruff_cache/*" \
    2>/dev/null | head -n 1 || true)"

  if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ] || [ -f "Pipfile" ] || [ -n "$py_file_detected" ]; then
    STACKS_RAN=$((STACKS_RAN + 1))
    echo "=== Ejecutando verificación Python ==="
    if ! find_python_cmd; then
      echo "ERROR: No se encontró un intérprete de Python 3 funcional (.venv, venv, python3, python o py -3)."
      echo "POR QUÉ: Se detectaron archivos o manifiestos Python, pero ningún binario superó la validación de Python 3 real (ignorando stubs vacíos como Microsoft Store)."
      echo "SOLUCIÓN (FIX): Instala Python 3 real en PATH o crea el entorno virtual ('python -m venv .venv') antes de ejecutar 'bash ./init.sh'."
      exit 1
    fi

    # Auto-Bootstrap seguro de .venv si aún no existiera
    bootstrap_python_venv
    find_python_cmd

    if [ -f "scripts/check-python.mjs" ]; then
      node scripts/check-python.mjs --root "$ROOT_DIR"
    fi

    RUFF_BIN=""
    for rcand in ".venv/Scripts/ruff.exe" ".venv/bin/ruff" "venv/Scripts/ruff.exe" "venv/bin/ruff"; do
      if [ -f "$rcand" ]; then
        RUFF_BIN="$rcand"
        break
      fi
    done
    if [ -z "$RUFF_BIN" ] && { [ -f "ruff.toml" ] || [ -f ".ruff.toml" ] || { [ -f "pyproject.toml" ] && grep -Eq '^[[:space:]]*\[tool\.ruff(\]|\.)' "pyproject.toml"; }; } && command -v ruff >/dev/null 2>&1; then
      RUFF_BIN="ruff"
    fi
    if [ -n "$RUFF_BIN" ]; then
      "$RUFF_BIN" check .
    fi

    MYPY_CONFIGURED=0
    if [ -f "mypy.ini" ] || [ -f ".mypy.ini" ] || { [ -f "pyproject.toml" ] && grep -Eq '^[[:space:]]*\[tool\.mypy(\]|\.)' "pyproject.toml"; }; then
      MYPY_CONFIGURED=1
    fi
    if [ "$MYPY_CONFIGURED" -eq 1 ]; then
      for mcand in ".venv/Scripts/mypy.exe" ".venv/bin/mypy" "venv/Scripts/mypy.exe" "venv/bin/mypy"; do
        if [ -f "$mcand" ]; then
          "$mcand" .
          break
        fi
      done
    fi

    PYRIGHT_CONFIGURED=0
    if [ -f "pyrightconfig.json" ] || { [ -f "pyproject.toml" ] && grep -Eq '^[[:space:]]*\[tool\.pyright(\]|\.)' "pyproject.toml"; }; then
      PYRIGHT_CONFIGURED=1
    fi
    if [ "$PYRIGHT_CONFIGURED" -eq 1 ]; then
      for pcand in ".venv/Scripts/pyright.exe" ".venv/Scripts/pyright" ".venv/bin/pyright" "venv/Scripts/pyright.exe" "venv/bin/pyright"; do
        if [ -f "$pcand" ]; then
          "$pcand"
          break
        fi
      done
    fi

    if "${PY_CMD[@]}" -c "import pytest" >/dev/null 2>&1; then
      pytest_rc=0
      PYTHONPATH="${PYTHONPATH:-.}" "${PY_CMD[@]}" -m pytest || pytest_rc=$?
      if [ "$pytest_rc" -ne 0 ] && [ "$pytest_rc" -ne 5 ]; then
        exit "$pytest_rc"
      fi
    else
      py_test_detected="$(find . -maxdepth 6 -type f \( -name "test*.py" -o -name "*_test.py" \) \
        -not -path "./.git/*" \
        -not -path "./node_modules/*" \
        -not -path "./.venv/*" \
        -not -path "./venv/*" \
        -not -path "./env/*" \
        -not -path "./dist/*" \
        -not -path "./build/*" \
        -not -path "*/__pycache__/*" \
        2>/dev/null | head -n 1 || true)"
      if [ -n "$py_test_detected" ]; then
        if [ -d "tests" ] && [ -n "$(find ./tests -maxdepth 5 -type f \( -name "test*.py" -o -name "*_test.py" \) 2>/dev/null | head -n 1 || true)" ]; then
          PYTHONPATH="${PYTHONPATH:-.}" "${PY_CMD[@]}" -m unittest discover -s tests
        elif [ -d "test" ] && [ -n "$(find ./test -maxdepth 5 -type f \( -name "test*.py" -o -name "*_test.py" \) 2>/dev/null | head -n 1 || true)" ]; then
          PYTHONPATH="${PYTHONPATH:-.}" "${PY_CMD[@]}" -m unittest discover -s test
        else
          PYTHONPATH="${PYTHONPATH:-.}" "${PY_CMD[@]}" -m unittest discover
        fi
      fi
    fi

    "${PY_CMD[@]}" -m compileall -q -x '(^|[/\\])(\.?venv|env|node_modules|build|dist|__pycache__)([/\\]|$)' .
  fi

  # 3. Stacks adicionales aditivos (Go, Rust, Dart/Flutter, Maven, Gradle, .NET, PowerShell)
  if [ -f "go.mod" ]; then
    STACKS_RAN=$((STACKS_RAN + 1))
    echo "=== Ejecutando verificación Go ==="
    go test ./...
  fi

  if [ -f "Cargo.toml" ]; then
    STACKS_RAN=$((STACKS_RAN + 1))
    echo "=== Ejecutando verificación Rust ==="
    cargo test
  fi

  if [ -f "pubspec.yaml" ]; then
    STACKS_RAN=$((STACKS_RAN + 1))
    echo "=== Ejecutando verificación Dart / Flutter ==="
    if command -v dart >/dev/null 2>&1; then
      dart analyze
    fi
  fi

  if [ -f "pom.xml" ]; then
    STACKS_RAN=$((STACKS_RAN + 1))
    echo "=== Ejecutando verificación Maven ==="
    if [ -f "./mvnw" ]; then
      ./mvnw test
    else
      mvn test
    fi
  fi

  if [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    STACKS_RAN=$((STACKS_RAN + 1))
    echo "=== Ejecutando verificación Gradle ==="
    if [ -f "./gradlew" ]; then
      ./gradlew test
    else
      gradle test
    fi
  fi

  if compgen -G "*.csproj" >/dev/null || compgen -G "*.sln" >/dev/null; then
    STACKS_RAN=$((STACKS_RAN + 1))
    echo "=== Ejecutando verificación .NET ==="
    dotnet test
  fi

  if compgen -G "*.ps1" >/dev/null || compgen -G "scripts/*.ps1" >/dev/null; then
    STACKS_RAN=$((STACKS_RAN + 1))
    echo "=== Verificando sintaxis AST de scripts PowerShell (*.ps1) ==="
    PS_BIN=""
    if command -v pwsh >/dev/null 2>&1; then
      PS_BIN="pwsh"
    elif command -v powershell >/dev/null 2>&1; then
      PS_BIN="powershell"
    elif command -v powershell.exe >/dev/null 2>&1; then
      PS_BIN="powershell.exe"
    fi
    if [ -n "$PS_BIN" ]; then
      ps_files=()
      for psf in *.ps1 scripts/*.ps1; do
        if [ -f "$psf" ]; then
          ps_files+=("$psf")
        fi
      done
      if [ "${#ps_files[@]}" -gt 0 ]; then
        ps_ast_err="$(HARNESS_PS_FILES="$(printf '%s\n' "${ps_files[@]}")" "$PS_BIN" -NoProfile -NonInteractive -Command '
          [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
          $files = ($env:HARNESS_PS_FILES -split "\r?\n") | Where-Object { $_ -ne "" }
          foreach ($f in $files) {
            $full = (Resolve-Path -LiteralPath $f).Path
            $tokens = $null
            $errs = $null
            [void][System.Management.Automation.Language.Parser]::ParseFile($full, [ref]$tokens, [ref]$errs)
            if ($errs -and $errs.Count -gt 0) {
              $e = $errs[0]
              $msg = ($e.Message -replace "[\r\n|]+", " ").Trim()
              Write-Output "$f|$($e.Extent.StartLineNumber)|$msg"
              exit 0
            }
          }
        ' | tr -d '\r')"
        if [ -n "$ps_ast_err" ]; then
          IFS="|" read -r ps_err_file ps_err_line ps_err_msg <<< "$ps_ast_err"
          echo "ERROR: Error de sintaxis PowerShell en '$ps_err_file' (línea $ps_err_line): $ps_err_msg"
          echo "POR QUÉ: La Puerta 3 valida el AST de scripts .ps1 sin ejecutarlos para impedir fallos de parseo en producción."
          echo "SOLUCIÓN (FIX): Corrige la sintaxis en '$ps_err_file' cerca de la línea $ps_err_line y vuelve a ejecutar 'bash ./init.sh'."
          exit 1
        fi
      fi
    fi
  fi

  if [ "$STACKS_RAN" -eq 0 ]; then
    echo "OK: Sin manifiesto de aplicación adicional detectado (modo arnés base / modo conocimiento verificados; configura INSTALL_CMD, VERIFY_CMD o START_CMD cuando añadas runtime de aplicación)."
  fi
fi

echo "=== 5. Inicialización y Verificación en 3 Puertas Completadas (CLEAN STATE) ==="
echo "Next steps (Siguientes pasos obligatorios para el Agente):"
echo "  1. Lee 'progress.md' y 'session-handoff.md' para conocer el estado verificado actual."
echo "  2. Lee 'feature_list.json' y selecciona EXACTAMENTE UNA tarea no terminada (WIP=1)."
echo "  3. Implementa solo esa tarea dentro de su alcance."
echo "  4. Re-ejecuta 'bash ./init.sh' y registra el comando y salida en 'evidence' antes de declarar victoria."

if [ -n "$START_CMD" ]; then
  echo "Startup command: $START_CMD"
  if [ "$RUN_START_COMMAND" = "1" ]; then
    echo "=== Iniciando la aplicación (RUN_START_COMMAND=1) ==="
    exec bash -c "$START_CMD"
  fi
  echo "Configura RUN_START_COMMAND=1 si deseas que init.sh lance la aplicación directamente."
elif [ "$RUN_START_COMMAND" = "1" ]; then
  echo "ERROR: Se solicitó RUN_START_COMMAND=1 pero START_CMD está vacío."
  echo "POR QUÉ: init.sh requiere un comando de inicio explícito o autodetectado para lanzar la aplicación."
  echo "SOLUCIÓN (FIX): Define START_CMD (ej. START_CMD='npm run dev' RUN_START_COMMAND=1 bash ./init.sh) antes de activar RUN_START_COMMAND=1."
  exit 1
fi
