/* ════════════════════════════════════════════════════
   PyMaestro — app.js
   Interactive Python Learning Guide
════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────
const state = {
  currentPage: 'home',
  completedPages: JSON.parse(localStorage.getItem('pymaestro-completed') || '[]'),
  quizAnswers: JSON.parse(localStorage.getItem('pymaestro-quiz') || '{}'),
  lightMode: localStorage.getItem('pymaestro-theme') === 'light',
};

// All pages in order
const PAGE_ORDER = [
  'home',
  'p1-intro','p1-variables','p1-control','p1-funciones','p1-listas','p1-proyecto','p1-quiz',
  'p2-poo','p2-modulos','p2-archivos','p2-errores','p2-decoradores','p2-proyecto','p2-quiz',
  'p3-async','p3-testing','p3-patrones','p3-performance','p3-proyecto','p3-quiz',
  'recursos-cheatsheet','recursos-trucos'
];

const TRACKABLE_PAGES = PAGE_ORDER.filter(p => p !== 'home');

// ── Syntax Highlighter ─────────────────────────────
function highlight(code) {
  return code
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    // comments
    .replace(/(#.+)/g,'<span class="cm">$1</span>')
    // strings
    .replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')/g,'<span class="str">$1</span>')
    // decorators
    .replace(/(@\w+)/g,'<span class="dec">$1</span>')
    // keywords
    .replace(/\b(def|class|return|import|from|if|elif|else|for|while|in|not|and|or|True|False|None|try|except|finally|with|as|raise|pass|break|continue|yield|lambda|global|nonlocal|async|await|is)\b/g,'<span class="kw">$1</span>')
    // builtins
    .replace(/\b(print|len|range|type|int|float|str|list|dict|set|tuple|bool|input|open|super|zip|map|filter|enumerate|sorted|reversed|sum|min|max|abs|round|isinstance|hasattr|getattr|setattr|vars|dir)\b/g,'<span class="builtin">$1</span>')
    // class names (after class keyword)
    .replace(/(<span class="kw">class<\/span>) (\w+)/g,'$1 <span class="cl">$2</span>')
    // function defs
    .replace(/(<span class="kw">def<\/span>) (\w+)/g,'$1 <span class="fn">$2</span>')
    // numbers
    .replace(/\b(\d+\.?\d*)\b/g,'<span class="num">$1</span>');
}

function codeCard(title, code, output = '') {
  const id = 'cc' + Math.random().toString(36).slice(2,8);
  const highlighted = highlight(code);
  const outAttr = output ? `data-output="${output.replace(/"/g,'&quot;')}"` : '';
  return `
  <div class="code-card">
    <div class="code-card-header">
      <span class="code-card-title">📄 ${title}</span>
      <div class="code-card-actions">
        <button class="btn-sm run" onclick="openCodeModal('${title}', \`${code.replace(/`/g,'\\`')}\`, \`${output.replace(/`/g,'\\`')}\`)">▶ Ver y Ejecutar</button>
        <button class="btn-sm" onclick="copyText(\`${code.replace(/`/g,'\\`')}\`)">📋 Copiar</button>
      </div>
    </div>
    <div class="code-card-body"><pre>${highlighted}</pre></div>
  </div>`;
}

function tipBox(type, icon, title, text) {
  return `
  <div class="tip-box ${type}">
    <span class="tip-icon">${icon}</span>
    <div class="tip-content">
      <div class="tip-title">${title}</div>
      <div class="tip-text">${text}</div>
    </div>
  </div>`;
}

// ── Pages Content ──────────────────────────────────

const PAGES = {

  // ═══════════════════════════════
  //  HOME
  // ═══════════════════════════════
  home: () => `
  <div class="page-hero" style="text-align:center; padding: 24px 0 12px;">
    <div style="font-size:5rem; margin-bottom:16px; animation: snakePulse 3s infinite;">🐍</div>
    <h1 class="page-title" style="font-size:2.6rem; text-align:center; -webkit-text-fill-color:unset; background: linear-gradient(135deg, #3b82f6 20%, #fbbf24 80%); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">
      PyMaestro
    </h1>
    <p class="page-subtitle" style="text-align:center; margin:0 auto 28px; font-size:1.05rem;">
      La guía interactiva definitiva para dominar Python.<br>
      Aprende construyendo un proyecto real en <strong>3 fases progresivas</strong>.
    </p>
  </div>

  <div class="stats-banner">
    <div class="stat-item">
      <div class="stat-value">20</div>
      <div class="stat-label">Módulos</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">60+</div>
      <div class="stat-label">Ejemplos</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">3</div>
      <div class="stat-label">Proyectos</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" id="homeProgress">0%</div>
      <div class="stat-label">Tu progreso</div>
    </div>
  </div>

  <div class="home-grid">
    <div class="home-card phase1" onclick="navigateTo('p1-intro')">
      <span class="home-card-icon">🌱</span>
      <div class="home-card-title">Fase 1: Principiante</div>
      <div class="home-card-desc">Variables, control de flujo, funciones y colecciones. Construye tu primer gestor de tareas por consola.</div>
      <div class="home-card-meta">
        <span>6 módulos · ~4 horas</span>
        <span style="color:var(--accent-phase1); font-weight:700;">EMPEZAR →</span>
      </div>
    </div>

    <div class="home-card phase2" onclick="navigateTo('p2-poo')">
      <span class="home-card-icon">⚙️</span>
      <div class="home-card-title">Fase 2: Intermedio</div>
      <div class="home-card-desc">POO, módulos, archivos JSON, manejo de errores y decoradores. Evoluciona tu proyecto a una API REST.</div>
      <div class="home-card-meta">
        <span>6 módulos · ~6 horas</span>
        <span style="color:var(--accent-phase2); font-weight:700;">EXPLORAR →</span>
      </div>
    </div>

    <div class="home-card phase3" onclick="navigateTo('p3-async')">
      <span class="home-card-icon">🚀</span>
      <div class="home-card-title">Fase 3: Profesional</div>
      <div class="home-card-desc">Async/Await, Testing, Patrones de diseño y Performance. Completa una aplicación de producción real.</div>
      <div class="home-card-meta">
        <span>6 módulos · ~8 horas</span>
        <span style="color:var(--accent-phase3); font-weight:700;">DOMINAR →</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🗺️ Hoja de Ruta del Proyecto</div>
    <div class="content-text" style="margin-bottom:20px;">
      <p>A lo largo de las 3 fases construirás un <strong>Sistema de Gestión de Inventario</strong> completo, evolucionando desde un script básico de consola hasta una aplicación web lista para producción.</p>
    </div>
    <div class="roadmap">
      <div class="roadmap-item">
        <div class="roadmap-connector">
          <div class="roadmap-dot"></div>
          <div class="roadmap-line"></div>
        </div>
        <div class="roadmap-content">
          <div class="roadmap-title">📦 Fase 1 — CLI Manager <span class="tag green" style="margin-left:8px">Principiante</span></div>
          <div class="roadmap-desc">Script de consola con listas, funciones y entrada de datos del usuario.</div>
        </div>
      </div>
      <div class="roadmap-item">
        <div class="roadmap-connector">
          <div class="roadmap-dot"></div>
          <div class="roadmap-line"></div>
        </div>
        <div class="roadmap-content">
          <div class="roadmap-title">🌐 Fase 2 — REST API <span class="tag amber" style="margin-left:8px">Intermedio</span></div>
          <div class="roadmap-desc">Refactorizado con POO, persistencia JSON y endpoints HTTP con Flask.</div>
        </div>
      </div>
      <div class="roadmap-item">
        <div class="roadmap-connector">
          <div class="roadmap-dot"></div>
          <div class="roadmap-line"></div>
        </div>
        <div class="roadmap-content">
          <div class="roadmap-title">⚡ Fase 3 — App Completa <span class="tag purple" style="margin-left:8px">Profesional</span></div>
          <div class="roadmap-desc">Async, tests automatizados, patrones SOLID y despliegue en la nube.</div>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">💡 ¿Cómo usar esta guía?</div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-content">
          <div class="step-title">Lee los conceptos</div>
          <div class="step-desc">Cada módulo explica los fundamentos con ejemplos claros y comparaciones.</div>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-content">
          <div class="step-title">Ejecuta el código</div>
          <div class="step-desc">Haz clic en <strong>▶ Ver y Ejecutar</strong> para ver el código completo y su salida simulada.</div>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-content">
          <div class="step-title">Completa el quiz</div>
          <div class="step-desc">Al final de cada fase hay un quiz interactivo para validar lo aprendido.</div>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-content">
          <div class="step-title">Construye el proyecto</div>
          <div class="step-desc">Implementa el proyecto de la fase antes de avanzar — así consolidas el conocimiento real.</div>
        </div>
      </div>
    </div>
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 1: INTRODUCCIÓN
  // ═══════════════════════════════
  'p1-intro': () => `
  <div class="page-hero">
    <div class="phase-badge p1">🌱 Fase 1 · Principiante</div>
    <h1 class="page-title">Introducción a Python</h1>
    <p class="page-subtitle">Python es el lenguaje más versátil del mundo. Usado en IA, web, automatización, ciencia de datos y más. Vamos a entender por qué.</p>
  </div>

  <div class="section">
    <div class="section-title">🤔 ¿Por qué Python?</div>
    <div class="concept-grid">
      <div class="concept-card">
        <span class="concept-icon">🧘</span>
        <div class="concept-name">Legibilidad</div>
        <div class="concept-desc">Sintaxis limpia, casi como pseudocódigo</div>
      </div>
      <div class="concept-card">
        <span class="concept-icon">🌍</span>
        <div class="concept-name">Versatilidad</div>
        <div class="concept-desc">Web, IA, datos, automatización...</div>
      </div>
      <div class="concept-card">
        <span class="concept-icon">📦</span>
        <div class="concept-name">Ecosistema</div>
        <div class="concept-desc">+400,000 paquetes en PyPI</div>
      </div>
      <div class="concept-card">
        <span class="concept-icon">💼</span>
        <div class="concept-name">Demanda</div>
        <div class="concept-desc">#1 en empleos tech 2024</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">⚙️ Instalación y Configuración</div>
    <div class="content-text">
      <p>Antes de escribir código necesitas configurar tu entorno de desarrollo.</p>
    </div>
    <div class="steps-list">
      <div class="step-item">
        <div class="step-num">1</div>
        <div class="step-content">
          <div class="step-title">Instala Python 3.11+</div>
          <div class="step-desc">Descarga desde <strong>python.org/downloads</strong>. Marca "Add Python to PATH" durante la instalación en Windows.</div>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div class="step-content">
          <div class="step-title">Instala VS Code</div>
          <div class="step-desc">Descarga VS Code y la extensión oficial de Python (ms-python.python). También puedes usar PyCharm.</div>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div class="step-content">
          <div class="step-title">Crea un entorno virtual</div>
          <div class="step-desc">Siempre trabaja en un entorno aislado para cada proyecto.</div>
        </div>
      </div>
      <div class="step-item">
        <div class="step-num">4</div>
        <div class="step-content">
          <div class="step-title">¡Hola, Mundo!</div>
          <div class="step-desc">Verifica que todo funciona ejecutando tu primer programa.</div>
        </div>
      </div>
    </div>
    ${codeCard('setup.sh — Entorno Virtual',
`# Crear entorno virtual
python -m venv venv

# Activar (Windows)
venv\\Scripts\\activate

# Activar (Mac/Linux)
source venv/bin/activate

# Verificar versión
python --version   # Python 3.11.x

# Primer programa
python -c "print('¡Hola, PyMaestro!')"`,
`Python 3.11.5
¡Hola, PyMaestro!`)}
  </div>

  <div class="section">
    <div class="section-title">🐍 Tu Primer Script</div>
    ${codeCard('hola_mundo.py',
`# Mi primer programa en Python
# Los comentarios comienzan con #

nombre = input("¿Cómo te llamas? ")
print(f"¡Hola, {nombre}! Bienvenido a Python 🐍")

# Python es dinámicamente tipado
edad = 25                    # int
altura = 1.75                # float
activo = True                # bool
ciudad = "Bogotá"            # str

print(f"Tengo {edad} años y mido {altura}m")
print(f"¿Activo? {activo} | Ciudad: {ciudad}")`,
`¿Cómo te llamas? Carlos
¡Hola, Carlos! Bienvenido a Python 🐍
Tengo 25 años y mido 1.75m
¿Activo? True | Ciudad: Bogotá`)}

    ${tipBox('tip','💡','TIP — f-strings','Las f-strings (format strings) son la forma más elegante de interpolar variables: <code>f"Hola {variable}"</code>. Disponibles desde Python 3.6+')}
    ${tipBox('trick','⚡','TRUCO — Python REPL','Escribe <code>python</code> en tu terminal para abrir el intérprete interactivo (REPL). Ideal para probar expresiones rápidamente sin crear un archivo.')}
  </div>

  <div class="section">
    <div class="section-title">📊 Python vs Otros Lenguajes</div>
    <table class="data-table">
      <thead><tr><th>Característica</th><th>Python</th><th>Java</th><th>JavaScript</th></tr></thead>
      <tbody>
        <tr><td>Tipado</td><td>Dinámico</td><td>Estático</td><td>Dinámico</td></tr>
        <tr><td>Sintaxis</td><td>Minimalista</td><td>Verbosa</td><td>Media</td></tr>
        <tr><td>Curva de aprendizaje</td><td>Baja 🎯</td><td>Alta</td><td>Media</td></tr>
        <tr><td>Uso principal</td><td>IA, Data, Web</td><td>Enterprise</td><td>Frontend/Backend</td></tr>
        <tr><td>Performance</td><td>Media</td><td>Alta</td><td>Alta (V8)</td></tr>
      </tbody>
    </table>
  </div>

  ${tipBox('note','✅','Completa esta sección','Cuando termines de leer, haz clic en <strong>Siguiente →</strong> para continuar con Variables y Tipos de Datos. Marca el módulo como completado con el botón de progreso.')}
  `,

  // ═══════════════════════════════
  //  FASE 1: VARIABLES
  // ═══════════════════════════════
  'p1-variables': () => `
  <div class="page-hero">
    <div class="phase-badge p1">🌱 Fase 1 · Principiante</div>
    <h1 class="page-title">Variables y Tipos de Datos</h1>
    <p class="page-subtitle">El sistema de tipos de Python es poderoso y flexible. Comprenderlo a fondo es la base de todo lo demás.</p>
  </div>

  <div class="section">
    <div class="section-title">📦 Tipos Primitivos</div>
    <div class="concept-grid">
      <div class="concept-card"><span class="concept-icon">🔢</span><div class="concept-name">int</div><div class="concept-desc">42, -7, 1_000_000</div></div>
      <div class="concept-card"><span class="concept-icon">🌊</span><div class="concept-name">float</div><div class="concept-desc">3.14, -0.5, 1.2e10</div></div>
      <div class="concept-card"><span class="concept-icon">🔤</span><div class="concept-name">str</div><div class="concept-desc">"texto", 'cadena'</div></div>
      <div class="concept-card"><span class="concept-icon">✅</span><div class="concept-name">bool</div><div class="concept-desc">True, False</div></div>
      <div class="concept-card"><span class="concept-icon">∅</span><div class="concept-name">None</div><div class="concept-desc">Ausencia de valor</div></div>
      <div class="concept-card"><span class="concept-icon">🔢+🔢</span><div class="concept-name">complex</div><div class="concept-desc">3+4j (números complejos)</div></div>
    </div>

    ${codeCard('tipos_basicos.py',
`# ── Enteros ──────────────────────────────────────
x = 42
grande = 1_000_000     # Separadores de miles ✓
binario = 0b1010       # Binario → 10
hexadecimal = 0xFF     # Hex → 255

print(type(x))         # <class 'int'>

# ── Flotantes ────────────────────────────────────
pi = 3.14159
cientifico = 1.5e-3    # 0.0015
from decimal import Decimal
dinero = Decimal('19.99')  # Evita errores de punto flotante

# ── Cadenas ──────────────────────────────────────
nombre = "Python"
multi = """
Esto es una
cadena multilínea
"""

# Métodos útiles
print(nombre.upper())          # PYTHON
print(nombre.center(20, '-'))  # -------Python-------
print("  hola  ".strip())      # hola
print(",".join(["a","b","c"])) # a,b,c

# ── Booleanos ────────────────────────────────────
es_valido = True
# Valores falsy: 0, "", [], {}, None, False
print(bool(0))      # False
print(bool("hola")) # True`,
`<class 'int'>
PYTHON
-------Python-------
hola
a,b,c
False
True`)}
  </div>

  <div class="section">
    <div class="section-title">🔤 Strings en Profundidad</div>
    ${codeCard('strings_pro.py',
`# ── f-strings avanzadas ──────────────────────────
nombre = "Ana"
precio = 1234.5678
items = 7

# Formato numérico
print(f"Precio: ${precio:,.2f}")    # $1,234.57
print(f"Items: {items:03d}")        # 007
print(f"{'Centrado':^20}")          # Centrado con espacios

# Expresiones dentro de f-strings
print(f"Cuadrado de 5: {5**2}")    # 25
print(f"Mayúsculas: {nombre.upper()}")  # ANA

# ── Operaciones de strings ───────────────────────
texto = "Python es increíble"
print(texto[0:6])       # Python  (slicing)
print(texto[-9:])       # ncreíble
print(texto[::-1])      # elbeírcni se nohtyP (inverso)

# ── Multiline y raw strings ─────────────────────
ruta = r"C:\\Users\\PC\\Desktop"  # Raw string
consulta = """
    SELECT *
    FROM usuarios
    WHERE activo = 1
"""
print(ruta)`,
`Precio: $1,234.57
Items: 007
      Centrado      
Cuadrado de 5: 25
Mayúsculas: ANA
Python
ncreíble
elbeírcni se nohtyP
C:\\Users\\PC\\Desktop`)}

    ${tipBox('trick','🎯','TRUCO — Slicing Poderoso','<code>texto[inicio:fin:paso]</code> — El paso <code>-1</code> invierte la cadena. <code>texto[::2]</code> toma un carácter de cada dos. Es una de las features más poderosas de Python.')}
  </div>

  <div class="section">
    <div class="section-title">🔄 Conversión de Tipos (Casting)</div>
    ${codeCard('casting.py',
`# Conversión explícita
x = "42"
num = int(x)           # str → int
flt = float(x)         # str → float
texto = str(100)       # int → str
lista = list("abc")    # str → list: ['a','b','c']

# ── Verificar tipo ───────────────────────────────
print(isinstance(num, int))          # True
print(isinstance(num, (int, float))) # True (múltiples tipos)
print(type(num).__name__)            # int

# ── Input siempre es str ─────────────────────────
# edad_str = input("Tu edad: ")   # retorna str
# edad = int(edad_str)            # convertir

# ── Conversión segura ────────────────────────────
def safe_int(valor, default=0):
    try:
        return int(valor)
    except (ValueError, TypeError):
        return default

print(safe_int("123"))    # 123
print(safe_int("abc"))    # 0 (default)
print(safe_int(None))     # 0 (default)`,
`True
True
int
123
0
0`)}
  </div>

  <div class="section">
    <div class="section-title">💡 Trucos de Variables</div>
    ${codeCard('trucos_variables.py',
`# ── Asignación múltiple ──────────────────────────
a, b, c = 1, 2, 3
x = y = z = 0          # Misma referencia

# ── Swap elegante ────────────────────────────────
a, b = b, a            # Sin variable temporal ✨

# ── Desempaquetado ───────────────────────────────
primero, *resto = [1, 2, 3, 4, 5]
print(primero)  # 1
print(resto)    # [2, 3, 4, 5]

*inicio, ultimo = [1, 2, 3, 4, 5]
print(inicio)   # [1, 2, 3, 4]
print(ultimo)   # 5

# ── Walrus operator := (Python 3.8+) ────────────
datos = [1, -2, 3, -4, 8]
if (n := len(datos)) > 3:
    print(f"Lista tiene {n} elementos, procesando...")

# ── Variables privadas por convención ───────────
_interno = "solo para uso interno"
__muy_privado = "name mangling"
CONSTANTE = 3.14159    # Convención: MAYÚSCULAS`,
`1
[2, 3, 4, 5]
[1, 2, 3, 4]
5
Lista tiene 5 elementos, procesando...`)}

    ${tipBox('pro','🔥','PRO — Walrus Operator','El operador <code>:=</code> asigna y evalúa al mismo tiempo. Útil en bucles while y condicionales para evitar repetir cálculos costosos.')}
    ${tipBox('tip','💡','CONVENCIÓN — PEP 8','Usa <code>snake_case</code> para variables y funciones, <code>PascalCase</code> para clases y <code>UPPER_CASE</code> para constantes. El código con PEP 8 es universalmente legible.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 1: CONTROL DE FLUJO
  // ═══════════════════════════════
  'p1-control': () => `
  <div class="page-hero">
    <div class="phase-badge p1">🌱 Fase 1 · Principiante</div>
    <h1 class="page-title">Control de Flujo</h1>
    <p class="page-subtitle">Las estructuras de control determinan el camino de ejecución de tu programa. Domínalas para escribir lógica elegante.</p>
  </div>

  <div class="section">
    <div class="section-title">🔀 Condicionales if / elif / else</div>
    ${codeCard('condicionales.py',
`# ── Básico ───────────────────────────────────────
temperatura = 28

if temperatura > 35:
    print("🔥 Hace mucho calor")
elif temperatura > 25:
    print("☀️ Clima agradable")
elif temperatura > 15:
    print("🌤️ Fresco")
else:
    print("❄️ Hace frío")

# ── Operadores de comparación ────────────────────
# ==  !=  >  <  >=  <=
# and, or, not
# in, not in
# is, is not

nombre = "Python"
if nombre in ["Python", "Go", "Rust"]:
    print(f"{nombre} es un lenguaje moderno")

# ── Ternario (One-liner) ─────────────────────────
edad = 20
estado = "adulto" if edad >= 18 else "menor"
print(f"Es {estado}")

# ── match-case (Python 3.10+) ────────────────────
comando = "ayuda"
match comando:
    case "iniciar":
        print("Iniciando sistema...")
    case "detener":
        print("Deteniendo...")
    case "ayuda" | "help":
        print("Comandos: iniciar, detener, ayuda")
    case _:
        print(f"Comando desconocido: {comando}")`,
`☀️ Clima agradable
Python es un lenguaje moderno
Es adulto
Comandos: iniciar, detener, ayuda`)}

    ${tipBox('trick','⚡','TRUCO — Match-Case','El <code>match-case</code> es el switch de Python pero mucho más poderoso. Puede hacer coincidencia de patrones estructurales, desestructurar objetos y listas, y tiene guards con <code>if</code>.')}
  </div>

  <div class="section">
    <div class="section-title">🔁 Bucles for y while</div>
    ${codeCard('bucles.py',
`# ── for con range ────────────────────────────────
for i in range(5):
    print(i, end=" ")  # 0 1 2 3 4
print()

for i in range(1, 10, 2):  # inicio, fin, paso
    print(i, end=" ")  # 1 3 5 7 9
print()

# ── for con enumerate ────────────────────────────
frutas = ["mango", "pera", "uva"]
for idx, fruta in enumerate(frutas, start=1):
    print(f"{idx}. {fruta}")

# ── for con zip ──────────────────────────────────
nombres = ["Ana", "Luis", "Mia"]
edades = [25, 30, 22]
for nombre, edad in zip(nombres, edades):
    print(f"{nombre}: {edad} años")

# ── while ────────────────────────────────────────
contador = 0
while contador < 5:
    print(f"Iteración {contador}")
    contador += 1

# ── break, continue, else ────────────────────────
for n in range(10):
    if n == 3:
        continue      # Salta esta iteración
    if n == 7:
        break         # Sale del bucle
    print(n, end=" ")
else:
    print("Bucle completado sin break")  # No se ejecuta`,
`0 1 2 3 4 
1 3 5 7 9 
1. mango
2. pera
3. uva
Ana: 25 años
Luis: 30 años
Mia: 22 años
Iteración 0
... (hasta 4)
0 1 2 4 5 6 `)}
  </div>

  <div class="section">
    <div class="section-title">⚡ Comprensiones de Lista</div>
    ${codeCard('comprensiones.py',
`# ── List Comprehension ───────────────────────────
# Forma tradicional
cuadrados = []
for i in range(10):
    cuadrados.append(i ** 2)

# Con comprensión (Pythónico ✨)
cuadrados = [i**2 for i in range(10)]
print(cuadrados)  # [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

# Con filtro
pares = [i for i in range(20) if i % 2 == 0]
print(pares)  # [0, 2, 4, 6, 8, 10, 12, 14, 16, 18]

# ── Dict Comprehension ───────────────────────────
palabras = ["python", "java", "rust", "go"]
longitudes = {p: len(p) for p in palabras}
print(longitudes)  # {'python': 6, 'java': 4, ...}

# ── Set Comprehension ────────────────────────────
unicos = {x % 5 for x in range(20)}
print(sorted(unicos))  # [0, 1, 2, 3, 4]

# ── Generator Expression ─────────────────────────
# Como list comp pero lazy — solo usa memoria cuando necesitas
suma = sum(i**2 for i in range(1000000))  # Eficiente en memoria
print(suma)

# ── Anidadas ─────────────────────────────────────
matriz = [[i*j for j in range(1,4)] for i in range(1,4)]
for fila in matriz:
    print(fila)`,
`[0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
[0, 2, 4, 6, 8, 10, 12, 14, 16, 18]
{'python': 6, 'java': 4, 'rust': 4, 'go': 2}
[0, 1, 2, 3, 4]
333332833333500000
[1, 2, 3]
[2, 4, 6]
[3, 6, 9]`)}

    ${tipBox('pro','🔥','PRO — Generators vs Lists','Usa generators (<code>()</code>) cuando iteres una sola vez y los datos sean grandes. Usa listas (<code>[]</code>) cuando necesites indexar, invertir o iterar múltiples veces.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 1: FUNCIONES
  // ═══════════════════════════════
  'p1-funciones': () => `
  <div class="page-hero">
    <div class="phase-badge p1">🌱 Fase 1 · Principiante</div>
    <h1 class="page-title">Funciones</h1>
    <p class="page-subtitle">Las funciones son los bloques de construcción del código reutilizable. Python ofrece un sistema de argumentos extremadamente flexible.</p>
  </div>

  <div class="section">
    <div class="section-title">⚙️ Definición y Argumentos</div>
    ${codeCard('funciones_basicas.py',
`# ── Función básica ───────────────────────────────
def saludar(nombre):
    """Docstring: describe qué hace la función."""
    return f"¡Hola, {nombre}!"

print(saludar("Python"))  # ¡Hola, Python!

# ── Argumentos con valor por defecto ─────────────
def crear_usuario(nombre, rol="usuario", activo=True):
    return {"nombre": nombre, "rol": rol, "activo": activo}

print(crear_usuario("Ana"))
print(crear_usuario("Luis", rol="admin"))

# ── *args — argumentos posicionales variables ─────
def sumar(*numeros):
    return sum(numeros)

print(sumar(1, 2, 3))         # 6
print(sumar(10, 20, 30, 40))  # 100

# ── **kwargs — argumentos nombrados variables ─────
def configurar(**opciones):
    for clave, valor in opciones.items():
        print(f"  {clave}: {valor}")

configurar(host="localhost", puerto=8080, debug=True)

# ── Combinación completa ──────────────────────────
def funcion_completa(req1, req2, *args, defecto=None, **kwargs):
    print(f"Requeridos: {req1}, {req2}")
    print(f"Extras: {args}")
    print(f"Defecto: {defecto}")
    print(f"kwargs: {kwargs}")

funcion_completa("a", "b", 1, 2, 3, defecto="x", color="azul")`,
`¡Hola, Python!
{'nombre': 'Ana', 'rol': 'usuario', 'activo': True}
{'nombre': 'Luis', 'rol': 'admin', 'activo': True}
6
100
  host: localhost
  puerto: 8080
  debug: True
Requeridos: a, b
Extras: (1, 2, 3)
Defecto: x
kwargs: {'color': 'azul'}`)}
  </div>

  <div class="section">
    <div class="section-title">🏹 Funciones Lambda y de Orden Superior</div>
    ${codeCard('funciones_avanzadas.py',
`# ── Lambda ───────────────────────────────────────
cuadrado = lambda x: x ** 2
print(cuadrado(5))  # 25

# Útil en map, filter, sorted
numeros = [3, 1, 4, 1, 5, 9, 2, 6]
print(sorted(numeros, reverse=True))  # [9, 6, 5, 4, 3, 2, 1, 1]

usuarios = [
    {"nombre": "Luis", "edad": 30},
    {"nombre": "Ana",  "edad": 25},
    {"nombre": "Bob",  "edad": 35},
]
ordenados = sorted(usuarios, key=lambda u: u["edad"])
for u in ordenados:
    print(f"{u['nombre']}: {u['edad']}")

# ── map() ────────────────────────────────────────
precios = [100, 200, 300, 400]
con_iva = list(map(lambda p: p * 1.19, precios))
print(con_iva)  # [119.0, 238.0, 357.0, 476.0]

# ── filter() ─────────────────────────────────────
positivos = list(filter(lambda x: x > 0, [-1, 2, -3, 4, -5]))
print(positivos)  # [2, 4]

# ── Funciones como parámetros ─────────────────────
def aplicar(func, valor):
    return func(valor)

print(aplicar(cuadrado, 7))    # 49
print(aplicar(abs, -42))       # 42

# ── Closures ─────────────────────────────────────
def multiplicador(factor):
    def multiplicar(numero):
        return numero * factor    # Captura 'factor'
    return multiplicar

doble = multiplicador(2)
triple = multiplicador(3)
print(doble(10))   # 20
print(triple(10))  # 30`,
`25
[9, 6, 5, 4, 3, 2, 1, 1]
Ana: 25
Luis: 30
Bob: 35
[119.0, 238.0, 357.0, 476.0]
[2, 4]
49
42
20
30`)}

    ${tipBox('trick','⚡','TRUCO — List comp > map/filter','Prefiere comprensiones de lista sobre <code>map()</code> y <code>filter()</code> — son más legibles: <code>[p*1.19 for p in precios]</code>. Usa map/filter solo en código funcional o con funciones ya definidas.')}
  </div>

  <div class="section">
    <div class="section-title">📝 Type Hints (Python 3.5+)</div>
    ${codeCard('type_hints.py',
`from typing import Optional, Union, List, Dict, Tuple

# ── Anotaciones básicas ──────────────────────────
def saludar(nombre: str, veces: int = 1) -> str:
    return (f"Hola {nombre}! " * veces).strip()

# ── Tipos compuestos ─────────────────────────────
def procesar(datos: list[int]) -> dict[str, float]:
    return {
        "suma": sum(datos),
        "promedio": sum(datos) / len(datos),
        "maximo": max(datos),
    }

# ── Optional (puede ser None) ────────────────────
def buscar_usuario(id: int) -> Optional[dict]:
    usuarios = {1: {"nombre": "Ana"}, 2: {"nombre": "Luis"}}
    return usuarios.get(id)  # None si no existe

usuario = buscar_usuario(1)
if usuario:
    print(usuario["nombre"])

# ── Union (varios tipos posibles) ────────────────
def convertir(valor: Union[str, int, float]) -> float:
    return float(valor)

print(procesar([1, 2, 3, 4, 5]))`,
`Ana
{'suma': 15, 'promedio': 3.0, 'maximo': 5}`)}

    ${tipBox('pro','🔥','PRO — Type Hints en Producción','Los type hints no cambian el comportamiento en tiempo de ejecución, pero: (1) mejoran la autocomplación en el IDE, (2) permiten usar herramientas como <code>mypy</code> para detectar errores antes de ejecutar, y (3) sirven de documentación viva.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 1: LISTAS Y COLECCIONES
  // ═══════════════════════════════
  'p1-listas': () => `
  <div class="page-hero">
    <div class="phase-badge p1">🌱 Fase 1 · Principiante</div>
    <h1 class="page-title">Listas y Colecciones</h1>
    <p class="page-subtitle">Python tiene cuatro colecciones built-in esenciales: list, tuple, set y dict. Cada una tiene su caso de uso ideal.</p>
  </div>

  <div class="section">
    <div class="section-title">📋 Listas — Ordenadas y Mutables</div>
    ${codeCard('listas.py',
`# ── Creación ─────────────────────────────────────
frutas = ["mango", "pera", "uva", "fresa"]
mixta  = [1, "hola", True, 3.14, [1, 2]]  # Cualquier tipo
vacia  = []

# ── Acceso e Indexación ──────────────────────────
print(frutas[0])    # mango (primero)
print(frutas[-1])   # fresa (último)
print(frutas[1:3])  # ['pera', 'uva']
print(frutas[::-1]) # Invertida

# ── Modificación ─────────────────────────────────
frutas.append("kiwi")         # Agregar al final
frutas.insert(1, "papaya")    # Insertar en posición
frutas.extend(["melón", "guayaba"])  # Agregar múltiples
frutas.remove("pera")         # Eliminar por valor
eliminado = frutas.pop(0)     # Eliminar y retornar por índice
print(eliminado)              # mango

# ── Búsqueda ─────────────────────────────────────
print("kiwi" in frutas)       # True
print(frutas.index("uva"))    # (índice de uva)
print(frutas.count("kiwi"))   # 1

# ── Ordenamiento ─────────────────────────────────
numeros = [3, 1, 4, 1, 5, 9, 2]
numeros.sort()                 # In-place
ordenado = sorted(numeros, reverse=True)  # Nueva lista

# ── Operaciones útiles ───────────────────────────
print(len(frutas))        # Longitud
print(min(numeros))       # Mínimo
print(max(numeros))       # Máximo
print(sum(numeros))       # Suma`,
`mango
fresa
['pera', 'uva']
['fresa', 'uva', 'pera', 'mango']
mango
True
...`)}
  </div>

  <div class="section">
    <div class="section-title">📖 Diccionarios — Clave: Valor</div>
    ${codeCard('diccionarios.py',
`# ── Creación ─────────────────────────────────────
producto = {
    "nombre": "Laptop",
    "precio": 1500.00,
    "stock": 25,
    "activo": True,
}

# Otra forma
desde_keys = dict.fromkeys(["a","b","c"], 0)  # {'a':0,'b':0,'c':0}

# ── Acceso ───────────────────────────────────────
print(producto["nombre"])               # Laptop
print(producto.get("garantia", "N/A"))  # N/A (sin KeyError)

# ── Modificación ─────────────────────────────────
producto["precio"] = 1350.00       # Actualizar
producto["garantia"] = "2 años"   # Agregar
del producto["activo"]             # Eliminar

# ── Iteración ────────────────────────────────────
for clave, valor in producto.items():
    print(f"  {clave}: {valor}")

print(list(producto.keys()))       # Lista de claves
print(list(producto.values()))     # Lista de valores

# ── Merge de diccionarios (Python 3.9+) ──────────
base = {"a": 1, "b": 2}
extra = {"b": 99, "c": 3}
merged = base | extra              # {'a':1,'b':99,'c':3}

# ── Dict anidado ─────────────────────────────────
inventario = {
    "prod_001": {"nombre": "Mouse", "stock": 50},
    "prod_002": {"nombre": "Teclado", "stock": 30},
}
print(inventario["prod_001"]["nombre"])  # Mouse

# ── setdefault y Counter ─────────────────────────
contador = {}
palabras = ["python", "java", "python", "rust", "python"]
for p in palabras:
    contador[p] = contador.get(p, 0) + 1
print(contador)  # {'python':3, 'java':1, 'rust':1}`,
`Laptop
N/A
  nombre: Laptop
  precio: 1350.0
  stock: 25
  garantia: 2 años
...
Mouse
{'python': 3, 'java': 1, 'rust': 1}`)}
  </div>

  <div class="section">
    <div class="section-title">🎯 Tuplas y Sets</div>
    ${codeCard('tuplas_sets.py',
`# ── Tuplas — Inmutables y Ordenadas ─────────────
punto = (3, 7)
rgb = (255, 128, 0)
singleton = (42,)   # ¡Coma necesaria!

x, y = punto        # Desempaquetado
print(f"x={x}, y={y}")

# Las tuplas son más rápidas que las listas
# Úsalas para datos que no deben cambiar
meses = ("Ene","Feb","Mar","Abr","May","Jun",
         "Jul","Ago","Sep","Oct","Nov","Dic")
print(meses[3])     # Abr

# ── Named Tuples (más legibles) ──────────────────
from collections import namedtuple
Punto = namedtuple("Punto", ["x", "y", "z"])
p = Punto(1, 2, 3)
print(p.x, p.y, p.z)  # 1 2 3

# ── Sets — Sin Duplicados ────────────────────────
colores = {"rojo", "verde", "azul"}
colores.add("amarillo")
colores.discard("rojo")     # No lanza error si no existe

# Operaciones de conjuntos
A = {1, 2, 3, 4, 5}
B = {4, 5, 6, 7, 8}
print(A & B)   # Intersección: {4, 5}
print(A | B)   # Unión: {1,2,3,4,5,6,7,8}
print(A - B)   # Diferencia: {1, 2, 3}
print(A ^ B)   # Diferencia simétrica: {1,2,3,6,7,8}

# Eliminar duplicados de una lista
lista = [1,2,2,3,3,3,4]
sin_dup = list(set(lista))
print(sin_dup)  # [1, 2, 3, 4]`,
`x=3, y=7
Abr
1 2 3
{4, 5}
{1, 2, 3, 4, 5, 6, 7, 8}
{1, 2, 3}
{1, 2, 3, 6, 7, 8}
[1, 2, 3, 4]`)}

    ${tipBox('tip','💡','¿Cuándo usar cada colección?','<strong>list</strong>: orden importa, mutación necesaria. <strong>tuple</strong>: datos fijos, claves de dict. <strong>set</strong>: unicidad, operaciones de conjunto. <strong>dict</strong>: búsqueda por clave O(1).')}
  </div>

  <div class="section">
    <div class="section-title">🚀 Collections Avanzadas</div>
    ${codeCard('collections_avanzadas.py',
`from collections import Counter, defaultdict, deque, OrderedDict

# ── Counter ──────────────────────────────────────
texto = "Mississippi"
conteo = Counter(texto)
print(conteo.most_common(3))  # [('s',4),('i',4),('p',2)]

votos = Counter(["Ana","Luis","Ana","Bob","Ana","Luis"])
print(votos.most_common(1))   # [('Ana', 3)]

# ── defaultdict ──────────────────────────────────
grupos = defaultdict(list)
estudiantes = [("mates","Ana"),("mates","Luis"),("física","Bob")]
for materia, est in estudiantes:
    grupos[materia].append(est)
print(dict(grupos))  # {'mates':['Ana','Luis'], 'física':['Bob']}

# ── deque (cola doble) ───────────────────────────
cola = deque(maxlen=3)  # Cola de tamaño fijo
cola.append(1)
cola.append(2)
cola.append(3)
cola.append(4)          # Elimina el 1 automáticamente
print(list(cola))       # [2, 3, 4]

cola.appendleft(0)      # Agregar al inicio
print(list(cola))       # [0, 2, 3]`,
`[('s', 4), ('i', 4), ('p', 2)]
[('Ana', 3)]
{'mates': ['Ana', 'Luis'], 'física': ['Bob']}
[2, 3, 4]
[0, 2, 3]`)}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 1: PROYECTO
  // ═══════════════════════════════
  'p1-proyecto': () => `
  <div class="page-hero">
    <div class="phase-badge p1">🚀 Fase 1 · Proyecto</div>
    <h1 class="page-title">Proyecto: Gestor de Inventario CLI</h1>
    <p class="page-subtitle">Aplica todo lo aprendido en Fase 1 para construir un gestor de inventario completo que funcione en la terminal.</p>
  </div>

  <div class="project-phase p1">
    <div class="project-phase-title">📦 Gestor CLI — Lo que Construirás</div>
    <div class="content-text">
      <p>Un script de consola que permite gestionar un inventario de productos con operaciones CRUD completas.</p>
    </div>
    <div class="tag-list">
      <span class="tag green">Variables</span>
      <span class="tag green">Listas</span>
      <span class="tag green">Diccionarios</span>
      <span class="tag green">Funciones</span>
      <span class="tag green">Control de Flujo</span>
      <span class="tag green">Input/Output</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🏗️ Arquitectura del Proyecto</div>
    ${codeCard('gestor_inventario.py — Estructura Principal',
`"""
Gestor de Inventario CLI
Proyecto Fase 1 — PyMaestro
"""

# ── Datos del inventario ─────────────────────────
inventario = []
ID_COUNTER = [1]   # Lista para mutabilidad en closures

# ── Funciones CRUD ───────────────────────────────
def crear_producto(nombre: str, precio: float, stock: int) -> dict:
    """Crea y retorna un nuevo producto."""
    producto = {
        "id": ID_COUNTER[0],
        "nombre": nombre.strip().title(),
        "precio": round(precio, 2),
        "stock": stock,
    }
    ID_COUNTER[0] += 1
    return producto

def agregar_producto(nombre: str, precio: float, stock: int) -> None:
    """Agrega un producto al inventario."""
    if precio <= 0:
        print("❌ El precio debe ser mayor a 0")
        return
    if stock < 0:
        print("❌ El stock no puede ser negativo")
        return
    prod = crear_producto(nombre, precio, stock)
    inventario.append(prod)
    print(f"✅ '{prod['nombre']}' agregado (ID: {prod['id']})")

def listar_productos() -> None:
    """Muestra todos los productos en tabla formateada."""
    if not inventario:
        print("📭 Inventario vacío")
        return
    print(f"\\n{'ID':<5} {'Nombre':<20} {'Precio':>10} {'Stock':>8}")
    print("─" * 46)
    for p in inventario:
        estado = "⚠️" if p["stock"] < 5 else "✅"
        print(f"{p['id']:<5} {p['nombre']:<20} ${p['precio']:>9.2f} {p['stock']:>6} {estado}")
    print(f"\\nTotal: {len(inventario)} productos")

def buscar_producto(termino: str) -> list:
    """Busca productos por nombre (insensible a mayúsculas)."""
    return [p for p in inventario
            if termino.lower() in p["nombre"].lower()]

def actualizar_stock(id_prod: int, cantidad: int) -> bool:
    """Actualiza el stock de un producto. Retorna True si éxito."""
    for prod in inventario:
        if prod["id"] == id_prod:
            nuevo_stock = prod["stock"] + cantidad
            if nuevo_stock < 0:
                print("❌ Stock insuficiente")
                return False
            prod["stock"] = nuevo_stock
            print(f"✅ Stock actualizado: {prod['nombre']} → {nuevo_stock}")
            return True
    print(f"❌ Producto ID {id_prod} no encontrado")
    return False

def calcular_valor_total() -> float:
    """Calcula el valor total del inventario."""
    return sum(p["precio"] * p["stock"] for p in inventario)`,
`# (Módulo de funciones — sin salida directa)`)}

    ${codeCard('main.py — Menú Principal',
`def menu_principal():
    """Menú interactivo de la aplicación."""
    # Datos de ejemplo para demostración
    agregar_producto("Laptop HP", 1200.00, 15)
    agregar_producto("Mouse Inalámbrico", 35.99, 50)
    agregar_producto("Teclado Mecánico", 89.99, 3)  # Stock bajo
    agregar_producto("Monitor 4K", 459.99, 8)
    agregar_producto("Webcam HD", 75.50, 0)          # Sin stock

    while True:
        print("\\n" + "═"*46)
        print("   🐍 GESTOR DE INVENTARIO — PyMaestro")
        print("═"*46)
        print("  1. 📋 Listar productos")
        print("  2. ➕ Agregar producto")
        print("  3. 🔍 Buscar producto")
        print("  4. 📦 Actualizar stock")
        print("  5. 💰 Valor total del inventario")
        print("  0. 🚪 Salir")
        print("─"*46)

        opcion = input("  Opción: ").strip()

        if opcion == "1":
            listar_productos()

        elif opcion == "2":
            nombre = input("  Nombre: ")
            precio = float(input("  Precio: $"))
            stock  = int(input("  Stock inicial: "))
            agregar_producto(nombre, precio, stock)

        elif opcion == "3":
            termino = input("  Buscar: ")
            resultados = buscar_producto(termino)
            if resultados:
                for p in resultados:
                    print(f"  → {p['id']}: {p['nombre']} — ${p['precio']}")
            else:
                print("  ❌ Sin resultados")

        elif opcion == "4":
            id_p = int(input("  ID del producto: "))
            cant = int(input("  Cantidad (- para restar): "))
            actualizar_stock(id_p, cant)

        elif opcion == "5":
            total = calcular_valor_total()
            print(f"\\n  💰 Valor total del inventario: ${total:,.2f}")

        elif opcion == "0":
            print("  👋 ¡Hasta pronto!")
            break
        else:
            print("  ⚠️ Opción inválida")

if __name__ == "__main__":
    menu_principal()`,
`✅ 'Laptop Hp' agregado (ID: 1)
✅ 'Mouse Inalámbrico' agregado (ID: 2)
✅ 'Teclado Mecánico' agregado (ID: 3)
✅ 'Monitor 4K' agregado (ID: 4)
✅ 'Webcam Hd' agregado (ID: 5)

══════════════════════════════════════════════
   🐍 GESTOR DE INVENTARIO — PyMaestro
══════════════════════════════════════════════
  1. 📋 Listar productos
  ...
  
ID    Nombre               Precio    Stock
──────────────────────────────────────────────
1     Laptop Hp           $1200.00     15 ✅
2     Mouse Inalámbrico     $35.99     50 ✅
3     Teclado Mecánico      $89.99      3 ⚠️
4     Monitor 4K           $459.99      8 ✅
5     Webcam Hd             $75.50      0 ⚠️

Total: 5 productos`)}
  </div>

  <div class="section">
    <div class="section-title">🎯 Desafíos Adicionales</div>
    <div class="content-text">
      <p>Una vez que el gestor básico funcione, intenta implementar:</p>
      <ul>
        <li><strong>Filtro por rango de precios:</strong> <code>buscar_por_precio(min, max)</code></li>
        <li><strong>Ordenar inventario:</strong> Por nombre, precio o stock</li>
        <li><strong>Estadísticas:</strong> Producto más caro, más barato, promedio de precios</li>
        <li><strong>Validaciones robustas:</strong> Nombres duplicados, precios negativos</li>
        <li><strong>Exportar a CSV:</strong> Usando el módulo <code>csv</code> de Python</li>
      </ul>
    </div>
    ${tipBox('note','🚀','¡Listo para Fase 2!','Una vez que tu gestor CLI funcione correctamente, en Fase 2 lo refactorizaremos completamente usando Programación Orientada a Objetos y agregaremos persistencia de datos con JSON.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 1: QUIZ
  // ═══════════════════════════════
  'p1-quiz': () => buildQuiz('p1', [
    {
      q: '¿Cuál es la forma más "pythónica" de crear una lista con los cuadrados del 1 al 10?',
      opts: [
        'cuadrados = []\nfor i in range(1,11):\n    cuadrados.append(i**2)',
        '[i**2 for i in range(1, 11)]',
        'list(map(pow, range(1,11), [2]*10))',
        'cuadrados = tuple(i**2 for i in range(1,11))'
      ],
      correct: 1,
      exp: 'La comprensión de lista [i**2 for i in range(1,11)] es la forma más legible, concisa y "pythónica". Es equivalente al bucle for pero en una sola línea expresiva.'
    },
    {
      q: '¿Qué retorna el siguiente código?\n\na, *b, c = [1, 2, 3, 4, 5]',
      opts: [
        'a=1, b=[2,3,4], c=5',
        'a=1, b=2, c=5',
        'Error de sintaxis',
        'a=[1], b=[2,3,4], c=[5]'
      ],
      correct: 0,
      exp: 'El operador * en desempaquetado captura todos los elementos intermedios como lista. a=1, c=5, y b captura todo lo que queda en el medio: [2, 3, 4].'
    },
    {
      q: '¿Cuál es la diferencia principal entre una lista y una tupla?',
      opts: [
        'Las listas solo almacenan números, las tuplas cualquier tipo',
        'Las tuplas son inmutables (no se pueden modificar), las listas son mutables',
        'Las listas son más lentas, las tuplas más rápidas solo en búsquedas',
        'No hay diferencia, son intercambiables'
      ],
      correct: 1,
      exp: 'La diferencia principal es mutabilidad: las listas permiten agregar, modificar y eliminar elementos. Las tuplas son inmutables una vez creadas, lo que las hace más eficientes en memoria y utilizables como claves de diccionario.'
    },
    {
      q: '¿Qué hace dict.get("clave", "default")?',
      opts: [
        'Lanza KeyError si la clave no existe',
        'Retorna el valor si la clave existe, o "default" si no existe',
        'Crea la clave con valor "default" si no existe',
        'Es equivalente a dict["clave"] exactamente'
      ],
      correct: 1,
      exp: '.get() es el acceso seguro a diccionarios. Retorna el valor si la clave existe, o el valor por defecto que proporcionas (o None si no lo proporcionas). Nunca lanza KeyError.'
    },
    {
      q: '¿Cuál es el resultado de {"a": 1, "b": 2} | {"b": 99, "c": 3}?',
      opts: [
        'Error — los diccionarios no soportan |',
        '{"a":1, "b":2, "c":3} — el original tiene prioridad',
        '{"a":1, "b":99, "c":3} — el derecho tiene prioridad',
        '{"a":1, "b":[2,99], "c":3} — los valores se fusionan'
      ],
      correct: 2,
      exp: 'El operador | (merge de dicts, Python 3.9+) combina dos diccionarios. En caso de claves duplicadas, el diccionario de la DERECHA tiene prioridad. Entonces "b" vale 99, no 2.'
    },
    {
      q: '¿Para qué se usa el operador Walrus := ?',
      opts: [
        'Para comparar si dos valores son iguales exactamente',
        'Para asignar un valor y usarlo en una expresión al mismo tiempo',
        'Para crear variables inmutables (como const en JS)',
        'Para asignación destructurada como en JavaScript'
      ],
      correct: 1,
      exp: 'El operador := (walrus) asigna Y evalúa en la misma expresión. Ejemplo: if (n := len(data)) > 10: — aquí n es asignado Y usado en la condición sin necesidad de una línea separada.'
    },
  ]),

  // ═══════════════════════════════
  //  FASE 2: POO
  // ═══════════════════════════════
  'p2-poo': () => `
  <div class="page-hero">
    <div class="phase-badge p2">⚙️ Fase 2 · Intermedio</div>
    <h1 class="page-title">Programación Orientada a Objetos</h1>
    <p class="page-subtitle">La POO es el paradigma dominante en software profesional. Python la implementa de forma elegante con clases, herencia y polimorfismo.</p>
  </div>

  <div class="section">
    <div class="section-title">🏗️ Clases y Objetos</div>
    ${codeCard('clases_basico.py',
`from dataclasses import dataclass, field
from typing import Optional

# ── Clase básica ──────────────────────────────────
class Producto:
    """Representa un producto en el inventario."""
    
    # Variable de clase (compartida por todas las instancias)
    impuesto = 0.19
    _contador = 0
    
    def __init__(self, nombre: str, precio: float, stock: int = 0):
        """Constructor — se ejecuta al crear la instancia."""
        Producto._contador += 1
        self.id = Producto._contador
        self.nombre = nombre.strip().title()
        self.precio = precio
        self.stock = stock
        self._historial = []   # Atributo "privado"
    
    # ── Métodos de instancia ──────────────────────
    def precio_con_iva(self) -> float:
        """Retorna el precio incluyendo IVA."""
        return round(self.precio * (1 + self.impuesto), 2)
    
    def agregar_stock(self, cantidad: int) -> None:
        if cantidad <= 0:
            raise ValueError("La cantidad debe ser positiva")
        self.stock += cantidad
        self._historial.append(f"+{cantidad} unidades")
    
    def vender(self, cantidad: int) -> bool:
        if cantidad > self.stock:
            return False
        self.stock -= cantidad
        self._historial.append(f"-{cantidad} unidades")
        return True
    
    # ── Método de clase ───────────────────────────
    @classmethod
    def total_productos(cls) -> int:
        return cls._contador
    
    # ── Método estático ───────────────────────────
    @staticmethod
    def validar_precio(precio: float) -> bool:
        return precio > 0
    
    # ── Representación ───────────────────────────
    def __str__(self) -> str:
        return f"Producto({self.nombre}, ${self.precio:.2f}, stock={self.stock})"
    
    def __repr__(self) -> str:
        return f"Producto(nombre={self.nombre!r}, precio={self.precio})"

# ── Uso ──────────────────────────────────────────
laptop = Producto("laptop gaming", 1200.0, 10)
mouse = Producto("Mouse inalámbrico", 35.99, 50)

print(laptop)                          # Producto(Laptop Gaming, $1200.00, stock=10)
print(f"Con IVA: ${laptop.precio_con_iva()}")  # $1428.00

laptop.agregar_stock(5)
laptop.vender(3)
print(f"Stock: {laptop.stock}")        # 12

print(f"Total productos: {Producto.total_productos()}")  # 2`,
`Producto(Laptop Gaming, $1200.00, stock=10)
Con IVA: $1428.00
Stock: 12
Total productos: 2`)}
  </div>

  <div class="section">
    <div class="section-title">🧬 Herencia y Polimorfismo</div>
    ${codeCard('herencia.py',
`from abc import ABC, abstractmethod

# ── Clase Base Abstracta ──────────────────────────
class ItemInventario(ABC):
    """Clase base para todos los ítems del inventario."""
    
    def __init__(self, nombre: str, precio: float):
        self.nombre = nombre
        self.precio = precio
    
    @abstractmethod
    def descripcion(self) -> str:
        """Cada subclase DEBE implementar esto."""
        pass
    
    @abstractmethod
    def calcular_valor(self) -> float:
        pass

# ── Subclases ─────────────────────────────────────
class ProductoFisico(ItemInventario):
    def __init__(self, nombre, precio, stock, peso_kg):
        super().__init__(nombre, precio)
        self.stock = stock
        self.peso_kg = peso_kg
    
    def descripcion(self) -> str:
        return f"[FÍSICO] {self.nombre} — {self.stock} uds, {self.peso_kg}kg"
    
    def calcular_valor(self) -> float:
        return self.precio * self.stock
    
    def costo_envio(self) -> float:
        return self.peso_kg * 2.5

class ProductoDigital(ItemInventario):
    def __init__(self, nombre, precio, licencias):
        super().__init__(nombre, precio)
        self.licencias = licencias
    
    def descripcion(self) -> str:
        return f"[DIGITAL] {self.nombre} — {self.licencias} licencias"
    
    def calcular_valor(self) -> float:
        return self.precio * self.licencias
    
    def enviar_por_email(self, email: str) -> str:
        return f"Licencia enviada a {email}"

# ── Polimorfismo ──────────────────────────────────
inventario = [
    ProductoFisico("Laptop", 1200.0, 10, 2.5),
    ProductoDigital("Office 365", 99.0, 50),
    ProductoFisico("Mouse", 35.99, 100, 0.3),
]

valor_total = 0
for item in inventario:
    print(item.descripcion())             # Método polimórfico
    valor_total += item.calcular_valor()  # Mismo nombre, diferente comportamiento

print(f"\\nValor total: ${valor_total:,.2f}")

# isinstance para chequeo de tipos
for item in inventario:
    if isinstance(item, ProductoFisico):
        print(f"  Envío {item.nombre}: ${item.costo_envio():.2f}")`,
`[FÍSICO] Laptop — 10 uds, 2.5kg
[DIGITAL] Office 365 — 50 licencias
[FÍSICO] Mouse — 100 uds, 0.3kg

Valor total: $16,549.00
  Envío Laptop: $6.25
  Envío Mouse: $0.75`)}
  </div>

  <div class="section">
    <div class="section-title">🔮 Propiedades y Dataclasses</div>
    ${codeCard('properties_dataclasses.py',
`from dataclasses import dataclass, field
from datetime import datetime

# ── @property ─────────────────────────────────────
class Producto:
    def __init__(self, nombre, precio):
        self._nombre = nombre
        self._precio = precio
    
    @property
    def precio(self):
        return self._precio
    
    @precio.setter
    def precio(self, valor):
        if valor < 0:
            raise ValueError("El precio no puede ser negativo")
        self._precio = round(valor, 2)
    
    @precio.deleter
    def precio(self):
        del self._precio
    
    @property
    def precio_con_iva(self):    # Solo lectura (sin setter)
        return round(self._precio * 1.19, 2)

p = Producto("Laptop", 1200)
print(p.precio)           # 1200
p.precio = 1350.999       # Usa el setter automáticamente
print(p.precio)           # 1351.0  (redondeado)
print(p.precio_con_iva)   # 1607.69

# ── @dataclass — Clases de datos automáticas ─────
@dataclass
class Pedido:
    id: int
    cliente: str
    productos: list = field(default_factory=list)
    fecha: datetime = field(default_factory=datetime.now)
    estado: str = "pendiente"
    
    def total(self) -> float:
        return sum(p.get("precio", 0) for p in self.productos)
    
    def __post_init__(self):
        # Validación después del __init__ automático
        if not self.cliente:
            raise ValueError("El cliente no puede estar vacío")

pedido = Pedido(id=1, cliente="Ana García")
pedido.productos.append({"nombre": "Laptop", "precio": 1200.0})
print(pedido)
print(f"Total: ${pedido.total():.2f}")`,
`1200
1351.0
1607.69
Pedido(id=1, cliente='Ana García', productos=[{'nombre': 'Laptop', 'precio': 1200.0}], fecha=datetime(...), estado='pendiente')
Total: $1200.00`)}

    ${tipBox('pro','🔥','PRO — @dataclass','Usa <code>@dataclass</code> para clases que principalmente almacenan datos. Auto-genera <code>__init__</code>, <code>__repr__</code>, y <code>__eq__</code>. Agrega <code>frozen=True</code> para hacerla inmutable.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 2: MÓDULOS
  // ═══════════════════════════════
  'p2-modulos': () => `
  <div class="page-hero">
    <div class="phase-badge p2">⚙️ Fase 2 · Intermedio</div>
    <h1 class="page-title">Módulos y Paquetes</h1>
    <p class="page-subtitle">Organizar código en módulos y paquetes es fundamental para proyectos escalables. Aprende la estructura que usan los proyectos profesionales.</p>
  </div>

  <div class="section">
    <div class="section-title">📁 Estructura de un Proyecto Python</div>
    ${codeCard('estructura_proyecto.txt',
`inventario_app/
│
├── 📄 README.md
├── 📄 requirements.txt
├── 📄 pyproject.toml        # Configuración moderna del proyecto
├── 📄 .env                  # Variables de entorno (NO commitear)
├── 📄 .gitignore
│
├── 📁 src/
│   └── 📁 inventario/
│       ├── 📄 __init__.py   # Hace que sea un paquete Python
│       ├── 📄 modelos.py    # Clases Producto, Pedido, etc.
│       ├── 📄 repositorio.py # Lógica de persistencia
│       ├── 📄 servicios.py  # Lógica de negocio
│       ├── 📄 api.py        # Endpoints Flask/FastAPI
│       └── 📄 config.py     # Configuración centralizada
│
├── 📁 tests/
│   ├── 📄 __init__.py
│   ├── 📄 test_modelos.py
│   └── 📄 test_servicios.py
│
└── 📁 scripts/
    └── 📄 seed_data.py      # Datos de prueba`,
``)}

    ${codeCard('inventario/__init__.py',
`"""
Paquete de gestión de inventario.
Exporta las clases principales para uso externo.
"""

from .modelos import Producto, Pedido, Cliente
from .servicios import InventarioService
from .config import settings

__version__ = "1.0.0"
__author__ = "Tu Nombre"

__all__ = ["Producto", "Pedido", "Cliente", "InventarioService", "settings"]`,
``)}
  </div>

  <div class="section">
    <div class="section-title">📦 Módulos Estándar Esenciales</div>
    ${codeCard('stdlib_esenciales.py',
`# ── os y pathlib ─────────────────────────────────
import os
from pathlib import Path

# Pathlib es la forma moderna (OOP)
ruta = Path("datos") / "inventario.json"
ruta.parent.mkdir(parents=True, exist_ok=True)

print(Path.cwd())                # Directorio actual
print(Path.home())               # Directorio home
print(ruta.exists())             # True/False
print(ruta.suffix)               # .json

# ── datetime ─────────────────────────────────────
from datetime import datetime, timedelta, date

ahora = datetime.now()
print(ahora.strftime("%Y-%m-%d %H:%M:%S"))  # 2024-03-15 14:30:00

hace_30_dias = ahora - timedelta(days=30)
proximo_mes  = ahora + timedelta(weeks=4)

# ── sys ──────────────────────────────────────────
import sys

print(sys.version)            # Versión de Python
print(sys.platform)           # 'win32', 'linux', 'darwin'
print(sys.argv)               # Argumentos de línea de comandos
# sys.exit(0)                 # Salir con código de retorno

# ── random ───────────────────────────────────────
import random

print(random.randint(1, 100))         # Entero aleatorio
print(random.choice(["a","b","c"]))   # Elemento aleatorio
random.shuffle(lista := [1,2,3,4,5])  # Mezclar in-place
print(lista)

# ── math ─────────────────────────────────────────
import math

print(math.pi)          # 3.14159...
print(math.ceil(3.1))   # 4
print(math.floor(3.9))  # 3
print(math.sqrt(144))   # 12.0
print(math.log(math.e)) # 1.0

# ── itertools ────────────────────────────────────
import itertools

# Combinaciones y permutaciones
colores = ["R","G","B"]
for combo in itertools.combinations(colores, 2):
    print(combo)  # ('R','G'), ('R','B'), ('G','B')`,
`2024-03-15 14:30:00
...
R G
('R', 'G')
('R', 'B')
('G', 'B')`)}
  </div>

  <div class="section">
    <div class="section-title">⚙️ pip y Gestión de Dependencias</div>
    ${codeCard('dependencias.sh',
`# ── Instalar paquetes ────────────────────────────
pip install flask requests pydantic

# ── requirements.txt ─────────────────────────────
pip freeze > requirements.txt          # Guardar dependencias
pip install -r requirements.txt        # Restaurar en otro entorno

# ── pyproject.toml (moderno) ─────────────────────
# [build-system]
# requires = ["setuptools>=61"]
# 
# [project]
# name = "inventario-app"
# version = "1.0.0"
# dependencies = [
#   "flask>=3.0.0",
#   "requests>=2.31.0",
#   "pydantic>=2.0.0",
# ]
#
# [project.optional-dependencies]
# dev = ["pytest", "black", "mypy"]

# ── Herramientas esenciales ──────────────────────
pip install black        # Formateador de código
pip install flake8       # Linter
pip install mypy         # Verificador de tipos
pip install pytest       # Testing
pip install pre-commit   # Hooks de git

# ── Actualizar paquetes ──────────────────────────
pip install --upgrade pip
pip list --outdated`,
``)}

    ${tipBox('tip','💡','TIP — pipx para herramientas CLI','Usa <code>pipx</code> para instalar herramientas de línea de comandos (black, mypy, poetry) en entornos aislados: <code>pipx install black</code>. Así no contaminan tus proyectos.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 2: ARCHIVOS Y JSON
  // ═══════════════════════════════
  'p2-archivos': () => `
  <div class="page-hero">
    <div class="phase-badge p2">⚙️ Fase 2 · Intermedio</div>
    <h1 class="page-title">Archivos y JSON</h1>
    <p class="page-subtitle">La persistencia de datos es fundamental. Python maneja archivos de texto, binarios y JSON de forma nativa y elegante.</p>
  </div>

  <div class="section">
    <div class="section-title">📁 Lectura y Escritura de Archivos</div>
    ${codeCard('archivos_basico.py',
`from pathlib import Path

# ── Escritura ─────────────────────────────────────
# with garantiza que el archivo se cierre siempre
with open("datos.txt", "w", encoding="utf-8") as f:
    f.write("Primera línea\\n")
    f.write("Segunda línea\\n")
    f.writelines(["Tercera\\n", "Cuarta\\n"])

# ── Lectura completa ──────────────────────────────
with open("datos.txt", "r", encoding="utf-8") as f:
    contenido = f.read()           # Todo como str
    
with open("datos.txt", "r", encoding="utf-8") as f:
    lineas = f.readlines()         # Lista de líneas con \\n

# ── Lectura línea por línea (eficiente) ──────────
with open("datos.txt", "r", encoding="utf-8") as f:
    for linea in f:                # Itera línea por línea
        print(linea.strip())       # .strip() quita \\n

# ── Append ───────────────────────────────────────
with open("datos.txt", "a", encoding="utf-8") as f:
    f.write("Línea agregada\\n")

# ── pathlib (forma moderna) ───────────────────────
ruta = Path("datos.txt")
contenido = ruta.read_text(encoding="utf-8")
ruta.write_text("Nuevo contenido\\n", encoding="utf-8")

print(ruta.stat().st_size)        # Tamaño en bytes
print(ruta.exists())              # True/False`,
`Primera línea
Segunda línea
Tercera
Cuarta
...`)}
  </div>

  <div class="section">
    <div class="section-title">🗃️ JSON — Persistencia de Datos</div>
    ${codeCard('json_completo.py',
`import json
from pathlib import Path
from datetime import datetime

# ── Serialización básica ──────────────────────────
datos = {
    "nombre": "Inventario App",
    "version": 1,
    "productos": [
        {"id": 1, "nombre": "Laptop", "precio": 1200.0, "stock": 10},
        {"id": 2, "nombre": "Mouse",  "precio": 35.99,  "stock": 50},
    ]
}

# Python → JSON string
json_str = json.dumps(datos, indent=2, ensure_ascii=False)
print(json_str)

# JSON string → Python
recuperado = json.loads(json_str)
print(type(recuperado))  # <class 'dict'>

# ── Archivos JSON ─────────────────────────────────
def guardar_json(datos: dict, ruta: str) -> None:
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(datos, f, indent=2, ensure_ascii=False)
    print(f"✅ Guardado en {ruta}")

def cargar_json(ruta: str, default=None):
    try:
        with open(ruta, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default or {}
    except json.JSONDecodeError as e:
        print(f"❌ JSON inválido: {e}")
        return default or {}

# ── Custom JSON Encoder ──────────────────────────
class InventarioEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()   # datetime → "2024-03-15T14:30:00"
        return super().default(obj)

datos_con_fecha = {"creado": datetime.now(), "total": 42}
json_con_fecha = json.dumps(datos_con_fecha, cls=InventarioEncoder, indent=2)
print(json_con_fecha)`,
`{
  "nombre": "Inventario App",
  "version": 1,
  "productos": [
    {
      "id": 1,
      "nombre": "Laptop",
      "precio": 1200.0,
      "stock": 10
    },
    ...
  ]
}
<class 'dict'>
✅ Guardado en inventario.json
{
  "creado": "2024-03-15T14:30:00",
  "total": 42
}`)}
  </div>

  <div class="section">
    <div class="section-title">📊 CSV y Otros Formatos</div>
    ${codeCard('csv_pandas.py',
`import csv
from io import StringIO

# ── Escritura CSV ─────────────────────────────────
productos = [
    {"nombre": "Laptop",  "precio": 1200.0, "stock": 10},
    {"nombre": "Mouse",   "precio": 35.99,  "stock": 50},
    {"nombre": "Monitor", "precio": 459.99, "stock": 8},
]

with open("inventario.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["nombre","precio","stock"])
    writer.writeheader()
    writer.writerows(productos)

# ── Lectura CSV ───────────────────────────────────
with open("inventario.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for fila in reader:
        print(f"{fila['nombre']}: ${fila['precio']}")

# ── Con pandas (librería) ─────────────────────────
# pip install pandas
# import pandas as pd
# df = pd.read_csv("inventario.csv")
# df["precio"] = pd.to_numeric(df["precio"])
# print(df.describe())
# df.to_excel("inventario.xlsx", index=False)

# ── configparser ─────────────────────────────────
import configparser

config = configparser.ConfigParser()
config["DATABASE"] = {
    "host": "localhost",
    "port": "5432",
    "name": "inventario_db",
}
config["APP"] = {"debug": "false", "secret_key": "dev-secret"}

with open("config.ini", "w") as f:
    config.write(f)
    
# Lectura
config.read("config.ini")
print(config["DATABASE"]["host"])  # localhost`,
`Laptop: $1200.0
Mouse: $35.99
Monitor: $459.99
localhost`)}

    ${tipBox('trick','⚡','TRUCO — dotenv para configuración','Usa <code>python-dotenv</code> para cargar variables de entorno desde <code>.env</code>: <code>from dotenv import load_dotenv; load_dotenv()</code>. Nunca hardcodees credenciales en el código.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 2: MANEJO DE ERRORES
  // ═══════════════════════════════
  'p2-errores': () => `
  <div class="page-hero">
    <div class="phase-badge p2">⚙️ Fase 2 · Intermedio</div>
    <h1 class="page-title">Manejo de Errores y Excepciones</h1>
    <p class="page-subtitle">El código de producción siempre puede fallar. Aprende a anticipar, manejar y registrar errores de forma profesional.</p>
  </div>

  <div class="section">
    <div class="section-title">🛡️ try / except / else / finally</div>
    ${codeCard('excepciones.py',
`# ── Estructura completa ───────────────────────────
def dividir(a, b):
    try:
        resultado = a / b
    except ZeroDivisionError:
        print("❌ No se puede dividir entre cero")
        return None
    except TypeError as e:
        print(f"❌ Tipo inválido: {e}")
        return None
    else:
        # Se ejecuta SOLO si no hubo excepción
        print(f"✅ Resultado: {resultado}")
        return resultado
    finally:
        # Se ejecuta SIEMPRE (con o sin error)
        print("🔚 Operación terminada")

dividir(10, 2)
dividir(10, 0)
dividir(10, "a")

# ── Capturar múltiples excepciones ───────────────
def leer_archivo(ruta):
    try:
        with open(ruta) as f:
            return f.read()
    except (FileNotFoundError, PermissionError) as e:
        print(f"❌ Error de archivo: {type(e).__name__}: {e}")
        return None

# ── Excepciones personalizadas ────────────────────
class InventarioError(Exception):
    """Excepción base del módulo inventario."""
    pass

class StockInsuficienteError(InventarioError):
    def __init__(self, producto, requerido, disponible):
        self.producto = producto
        self.requerido = requerido
        self.disponible = disponible
        super().__init__(
            f"Stock insuficiente para '{producto}': "
            f"requerido={requerido}, disponible={disponible}"
        )

def vender_producto(nombre, cantidad, stock):
    if cantidad > stock:
        raise StockInsuficienteError(nombre, cantidad, stock)
    return stock - cantidad

try:
    nuevo_stock = vender_producto("Laptop", 15, 10)
except StockInsuficienteError as e:
    print(f"⚠️ {e}")
    print(f"   Producto: {e.producto}")
    print(f"   Requerido: {e.requerido}, Disponible: {e.disponible}")`,
`✅ Resultado: 5.0
🔚 Operación terminada
❌ No se puede dividir entre cero
🔚 Operación terminada
❌ Tipo inválido: unsupported operand type(s) for /: 'int' and 'str'
🔚 Operación terminada
⚠️ Stock insuficiente para 'Laptop': requerido=15, disponible=10
   Producto: Laptop
   Requerido: 15, Disponible: 10`)}
  </div>

  <div class="section">
    <div class="section-title">📋 Logging Profesional</div>
    ${codeCard('logging_pro.py',
`import logging
from logging.handlers import RotatingFileHandler
import sys

def configurar_logger(nombre: str, nivel=logging.DEBUG) -> logging.Logger:
    """Configura un logger con salida a consola y archivo."""
    logger = logging.getLogger(nombre)
    logger.setLevel(nivel)
    
    # Formato detallado
    fmt = logging.Formatter(
        "%(asctime)s | %(name)s | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Handler para consola
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(fmt)
    
    # Handler para archivo (rota cuando llega a 5MB)
    archivo = RotatingFileHandler(
        "app.log", maxBytes=5*1024*1024, backupCount=3
    )
    archivo.setLevel(logging.DEBUG)
    archivo.setFormatter(fmt)
    
    logger.addHandler(console)
    logger.addHandler(archivo)
    
    return logger

# ── Uso ──────────────────────────────────────────
logger = configurar_logger("inventario")

def procesar_pedido(pedido_id: int):
    logger.info(f"Procesando pedido #{pedido_id}")
    try:
        # Simular lógica
        if pedido_id < 0:
            raise ValueError(f"ID inválido: {pedido_id}")
        logger.debug(f"Pedido #{pedido_id} validado")
        logger.info(f"✅ Pedido #{pedido_id} completado")
    except ValueError as e:
        logger.error(f"Error en pedido: {e}", exc_info=True)
    except Exception as e:
        logger.critical(f"Error inesperado: {e}", exc_info=True)
        raise  # Re-lanza la excepción

procesar_pedido(42)
procesar_pedido(-1)`,
`2024-03-15 14:30:00 | inventario | INFO     | Procesando pedido #42
2024-03-15 14:30:00 | inventario | INFO     | ✅ Pedido #42 completado
2024-03-15 14:30:00 | inventario | INFO     | Procesando pedido #-1
2024-03-15 14:30:00 | inventario | ERROR    | Error en pedido: ID inválido: -1`)}

    ${tipBox('warn','⚠️','NO uses print() para debugging','En producción, usa siempre <code>logging</code>. Permite controlar el nivel de detalle, rotar archivos, enviar logs a servicios externos (Sentry, Datadog) y deshabilitar sin tocar el código.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 2: DECORADORES
  // ═══════════════════════════════
  'p2-decoradores': () => `
  <div class="page-hero">
    <div class="phase-badge p2">⚙️ Fase 2 · Intermedio</div>
    <h1 class="page-title">Decoradores</h1>
    <p class="page-subtitle">Los decoradores son una de las features más elegantes y poderosas de Python. Permiten modificar o extender el comportamiento de funciones sin cambiarlas.</p>
  </div>

  <div class="section">
    <div class="section-title">✨ ¿Qué es un Decorador?</div>
    ${codeCard('decoradores_basicos.py',
`import time
import functools

# ── Un decorador es simplemente una función ───────
def mi_decorador(func):
    @functools.wraps(func)    # Preserva metadatos de la función original
    def wrapper(*args, **kwargs):
        print(f"⏳ Antes de ejecutar {func.__name__}")
        resultado = func(*args, **kwargs)
        print(f"✅ Después de ejecutar {func.__name__}")
        return resultado
    return wrapper

@mi_decorador
def saludar(nombre):
    print(f"¡Hola, {nombre}!")
    return f"Saludado a {nombre}"

saludar("Python")

# ── Decorador con argumentos ─────────────────────
def repetir(veces):
    def decorador(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for i in range(veces):
                resultado = func(*args, **kwargs)
            return resultado
        return wrapper
    return decorador

@repetir(3)
def decir_hola():
    print("¡Hola!")

decir_hola()

# ── Timer — muy útil en producción ───────────────
def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"⏱️ {func.__name__} tardó {elapsed:.4f}s")
        return result
    return wrapper

@timer
def calcular_suma(n):
    return sum(range(n))

print(calcular_suma(1_000_000))`,
`⏳ Antes de ejecutar saludar
¡Hola, Python!
✅ Después de ejecutar saludar
¡Hola!
¡Hola!
¡Hola!
⏱️ calcular_suma tardó 0.0234s
499999500000`)}
  </div>

  <div class="section">
    <div class="section-title">🔥 Decoradores de Producción</div>
    ${codeCard('decoradores_pro.py',
`import functools
import time

# ── Retry — reintentar en caso de fallo ──────────
def retry(max_intentos=3, delay=1.0, excepciones=(Exception,)):
    def decorador(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for intento in range(1, max_intentos + 1):
                try:
                    return func(*args, **kwargs)
                except excepciones as e:
                    if intento == max_intentos:
                        raise
                    print(f"⚠️ Intento {intento} fallido: {e}. Reintentando...")
                    time.sleep(delay)
        return wrapper
    return decorador

# ── Cache / Memoize ──────────────────────────────
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(50))           # Instantáneo gracias al cache
print(fibonacci.cache_info())  # Hits, misses, maxsize

# ── Singleton ────────────────────────────────────
def singleton(cls):
    instancias = {}
    @functools.wraps(cls)
    def get_instancia(*args, **kwargs):
        if cls not in instancias:
            instancias[cls] = cls(*args, **kwargs)
        return instancias[cls]
    return get_instancia

@singleton
class DatabaseConnection:
    def __init__(self, host="localhost"):
        self.host = host
        print(f"🔌 Conectando a {host}...")

db1 = DatabaseConnection("localhost")
db2 = DatabaseConnection("otrohost")  # No crea nueva instancia
print(db1 is db2)   # True — misma instancia

# ── Validar argumentos ───────────────────────────
def validar_positivo(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        for arg in args:
            if isinstance(arg, (int, float)) and arg < 0:
                raise ValueError(f"Se requieren valores positivos, recibido: {arg}")
        return func(*args, **kwargs)
    return wrapper

@validar_positivo
def calcular_area(base, altura):
    return base * altura

print(calcular_area(5, 3))    # 15
# calcular_area(-1, 3)        # ValueError!`,
`12586269025
CacheInfo(hits=48, misses=51, maxsize=128, currsize=51)
🔌 Conectando a localhost...
True
15`)}

    ${tipBox('pro','🔥','PRO — functools.wraps','Siempre usa <code>@functools.wraps(func)</code> en tus decoradores. Sin él, la función decorada pierde su <code>__name__</code>, <code>__doc__</code> y otros atributos, lo que rompe el debugging y la documentación.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 2: PROYECTO
  // ═══════════════════════════════
  'p2-proyecto': () => `
  <div class="page-hero">
    <div class="phase-badge p2">🚀 Fase 2 · Proyecto</div>
    <h1 class="page-title">Proyecto: API REST con Flask</h1>
    <p class="page-subtitle">Refactorizamos el gestor CLI usando POO y lo exponemos como una API REST completa con persistencia JSON.</p>
  </div>

  <div class="project-phase p2">
    <div class="project-phase-title">🌐 API REST — Lo que Construirás</div>
    <div class="content-text">
      <p>Una API RESTful completa con operaciones CRUD para productos, persistencia en JSON y validaciones robustas.</p>
    </div>
    <div class="tag-list">
      <span class="tag amber">Flask</span>
      <span class="tag amber">POO</span>
      <span class="tag amber">JSON</span>
      <span class="tag amber">REST</span>
      <span class="tag amber">Decoradores</span>
      <span class="tag amber">Manejo de Errores</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📦 Instalación y Configuración</div>
    ${codeCard('setup.sh',
`# Instalar Flask
pip install flask pydantic

# Estructura del proyecto
mkdir -p inventario_api/{models,routes,services}
touch inventario_api/__init__.py
touch inventario_api/app.py`,
``)}
  </div>

  <div class="section">
    <div class="section-title">🏗️ Modelo y Repositorio</div>
    ${codeCard('models/producto.py',
`from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional
import json
from pathlib import Path

@dataclass
class Producto:
    nombre: str
    precio: float
    stock: int
    id: Optional[int] = None
    categoria: str = "general"
    creado_en: str = field(default_factory=lambda: datetime.now().isoformat())
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    def __post_init__(self):
        if self.precio <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        if self.stock < 0:
            raise ValueError("El stock no puede ser negativo")
        self.nombre = self.nombre.strip().title()

class RepositorioJSON:
    """Repositorio que persiste datos en un archivo JSON."""
    
    def __init__(self, ruta: str = "inventario.json"):
        self.ruta = Path(ruta)
        self._datos = self._cargar()
    
    def _cargar(self) -> dict:
        if self.ruta.exists():
            with open(self.ruta, encoding="utf-8") as f:
                return json.load(f)
        return {"productos": [], "next_id": 1}
    
    def _guardar(self) -> None:
        with open(self.ruta, "w", encoding="utf-8") as f:
            json.dump(self._datos, f, indent=2, ensure_ascii=False)
    
    def crear(self, prod: Producto) -> Producto:
        prod.id = self._datos["next_id"]
        self._datos["next_id"] += 1
        self._datos["productos"].append(prod.to_dict())
        self._guardar()
        return prod
    
    def listar(self, filtro: str = "") -> list[dict]:
        productos = self._datos["productos"]
        if filtro:
            productos = [p for p in productos
                        if filtro.lower() in p["nombre"].lower()]
        return productos
    
    def obtener(self, id: int) -> Optional[dict]:
        return next(
            (p for p in self._datos["productos"] if p["id"] == id),
            None
        )
    
    def actualizar(self, id: int, cambios: dict) -> Optional[dict]:
        for i, prod in enumerate(self._datos["productos"]):
            if prod["id"] == id:
                self._datos["productos"][i].update(cambios)
                self._guardar()
                return self._datos["productos"][i]
        return None
    
    def eliminar(self, id: int) -> bool:
        original = len(self._datos["productos"])
        self._datos["productos"] = [
            p for p in self._datos["productos"] if p["id"] != id
        ]
        if len(self._datos["productos"]) < original:
            self._guardar()
            return True
        return False`,
``)}
  </div>

  <div class="section">
    <div class="section-title">🌐 API Flask Completa</div>
    ${codeCard('app.py — Flask REST API',
`from flask import Flask, jsonify, request
from functools import wraps
import logging

from models.producto import Producto, RepositorioJSON

app = Flask(__name__)
repo = RepositorioJSON()
logger = logging.getLogger(__name__)

# ── Decorador de validación ───────────────────────
def requiere_json(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not request.is_json:
            return jsonify({"error": "Se requiere Content-Type: application/json"}), 415
        return f(*args, **kwargs)
    return decorated

# ── Manejadores de error globales ────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Recurso no encontrado"}), 404

@app.errorhandler(500)
def server_error(e):
    logger.error(f"Error interno: {e}")
    return jsonify({"error": "Error interno del servidor"}), 500

# ── Endpoints ─────────────────────────────────────
@app.route("/api/productos", methods=["GET"])
def listar_productos():
    """GET /api/productos?q=laptop"""
    q = request.args.get("q", "")
    productos = repo.listar(filtro=q)
    return jsonify({
        "data": productos,
        "total": len(productos),
        "filtro": q or None
    })

@app.route("/api/productos/<int:id>", methods=["GET"])
def obtener_producto(id):
    """GET /api/productos/1"""
    prod = repo.obtener(id)
    if not prod:
        return jsonify({"error": f"Producto {id} no encontrado"}), 404
    return jsonify({"data": prod})

@app.route("/api/productos", methods=["POST"])
@requiere_json
def crear_producto():
    """POST /api/productos"""
    body = request.get_json()
    try:
        prod = Producto(
            nombre=body["nombre"],
            precio=float(body["precio"]),
            stock=int(body.get("stock", 0)),
            categoria=body.get("categoria", "general")
        )
        creado = repo.crear(prod)
        return jsonify({"data": creado.to_dict(), "mensaje": "Producto creado"}), 201
    except (KeyError, ValueError) as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/productos/<int:id>", methods=["PATCH"])
@requiere_json
def actualizar_producto(id):
    """PATCH /api/productos/1"""
    cambios = request.get_json()
    campos_validos = {"nombre","precio","stock","categoria"}
    cambios = {k: v for k, v in cambios.items() if k in campos_validos}
    
    actualizado = repo.actualizar(id, cambios)
    if not actualizado:
        return jsonify({"error": f"Producto {id} no encontrado"}), 404
    return jsonify({"data": actualizado, "mensaje": "Actualizado"})

@app.route("/api/productos/<int:id>", methods=["DELETE"])
def eliminar_producto(id):
    """DELETE /api/productos/1"""
    if repo.eliminar(id):
        return jsonify({"mensaje": f"Producto {id} eliminado"}), 200
    return jsonify({"error": f"Producto {id} no encontrado"}), 404

@app.route("/api/stats", methods=["GET"])
def estadisticas():
    productos = repo.listar()
    if not productos:
        return jsonify({"total_productos": 0})
    precios = [p["precio"] for p in productos]
    return jsonify({
        "total_productos": len(productos),
        "valor_inventario": sum(p["precio"]*p["stock"] for p in productos),
        "precio_promedio": sum(precios)/len(precios),
        "precio_maximo": max(precios),
        "precio_minimo": min(precios),
    })

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    app.run(debug=True, port=5000)`,
`# Ejecutar: python app.py
# API disponible en: http://localhost:5000

# Probar con curl:
# curl http://localhost:5000/api/productos
# curl -X POST http://localhost:5000/api/productos \\
#   -H "Content-Type: application/json" \\
#   -d '{"nombre":"Laptop","precio":1200,"stock":10}'`)}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 2: QUIZ
  // ═══════════════════════════════
  'p2-quiz': () => buildQuiz('p2', [
    {
      q: '¿Qué es la herencia en POO y cuándo usarla?',
      opts: [
        'Copiar código de una clase a otra para reutilizarlo',
        'Una relación "es-un" donde una subclase extiende comportamiento de la clase base',
        'Un mecanismo para ocultar atributos privados de una clase',
        'La capacidad de una función de llamarse a sí misma'
      ],
      correct: 1,
      exp: 'La herencia modela la relación "es-un" (un Perro ES-UN Animal). Permite reutilizar y extender código. Úsala cuando la subclase genuinamente "es" un tipo del padre, no solo "tiene" sus métodos.'
    },
    {
      q: '¿Cuál es la diferencia entre @classmethod y @staticmethod?',
      opts: [
        'No hay diferencia, ambos son sinónimos',
        '@classmethod recibe la clase como primer argumento (cls), @staticmethod no recibe ningún argumento especial',
        '@classmethod es para atributos, @staticmethod es para métodos',
        '@staticmethod puede modificar el estado de la clase, @classmethod no'
      ],
      correct: 1,
      exp: '@classmethod recibe cls (la clase) como primer argumento y puede acceder/modificar el estado de la clase. @staticmethod es una función regular dentro de la clase que no recibe self ni cls — útil para utilidades relacionadas lógicamente a la clase.'
    },
    {
      q: 'En manejo de errores, ¿cuándo se ejecuta el bloque finally?',
      opts: [
        'Solo cuando no hay excepciones',
        'Solo cuando hay una excepción capturada',
        'Siempre, sin importar si hubo excepción o no',
        'Nunca si el try-block tiene un return'
      ],
      correct: 2,
      exp: 'finally se ejecuta SIEMPRE: cuando el try termina sin error, cuando hay una excepción capturada, y hasta cuando hay un return o break dentro del try. Es ideal para liberar recursos (cerrar archivos, conexiones de DB).'
    },
    {
      q: '¿Qué hace @functools.wraps(func) en un decorador?',
      opts: [
        'Hace que el decorador sea recursivo',
        'Preserva los metadatos (__name__, __doc__, etc.) de la función original',
        'Permite que el decorador reciba argumentos adicionales',
        'Convierte el decorador en un método de clase'
      ],
      correct: 1,
      exp: 'Sin @functools.wraps(func), la función decorada pierde su identidad: __name__ pasaría a ser "wrapper". wraps copia los metadatos de la función original al wrapper, esencial para debugging, logging y herramientas que inspeccionan funciones.'
    },
    {
      q: '¿Qué ventaja tiene lru_cache sobre implementar un caché manual?',
      opts: [
        'Es más lento pero usa menos memoria',
        'Automáticamente maneja el tamaño del caché, thread-safety y es parte de la stdlib',
        'Solo funciona con funciones recursivas',
        'Persiste el caché en disco automáticamente'
      ],
      correct: 1,
      exp: 'lru_cache implementa una caché LRU (Least Recently Used) automáticamente: limita el tamaño (maxsize), descarta las entradas menos usadas, es thread-safe, y puedes inspeccionar estadísticas con cache_info(). Sin escribir una línea extra.'
    },
    {
      q: '¿Cuál es la forma correcta de leer un archivo JSON en Python?',
      opts: [
        'with open("f.json") as f: return f.read_json()',
        'json.read("archivo.json")',
        'with open("f.json") as f: return json.load(f)',
        'open("f.json").parse()'
      ],
      correct: 2,
      exp: 'json.load(f) lee y parsea desde un objeto archivo. json.loads(string) parsea desde un string. Para escribir: json.dump(datos, f) a archivo, json.dumps(datos) a string. El patrón with open() garantiza que el archivo se cierre correctamente.'
    },
  ]),

  // ═══════════════════════════════
  //  FASE 3: ASYNC
  // ═══════════════════════════════
  'p3-async': () => `
  <div class="page-hero">
    <div class="phase-badge p3">🚀 Fase 3 · Profesional</div>
    <h1 class="page-title">Programación Asíncrona</h1>
    <p class="page-subtitle">asyncio, async/await y concurrencia — herramientas esenciales para construir aplicaciones de alto rendimiento en I/O.</p>
  </div>

  <div class="section">
    <div class="section-title">⚡ Conceptos Fundamentales</div>
    <div class="content-text">
      <p><strong>Síncrono:</strong> Las tareas se ejecutan una tras otra. Si una tarda 5s, el programa espera.</p>
      <p><strong>Asíncrono:</strong> Mientras esperas una respuesta (red, disco), Python puede hacer otra cosa.</p>
      <p>asyncio es ideal para I/O-bound: peticiones HTTP, bases de datos, archivos. Para CPU-bound usa multiprocessing.</p>
    </div>
    ${codeCard('async_basico.py',
`import asyncio
import time

# ── Función síncrona normal ───────────────────────
def tarea_sincrona(nombre, delay):
    time.sleep(delay)              # Bloquea el hilo completo
    return f"{nombre} completada"

# ── Función asíncrona (coroutine) ────────────────
async def tarea_asincrona(nombre, delay):
    await asyncio.sleep(delay)     # Libera el hilo mientras espera
    return f"{nombre} completada"

# ── Ejecutar una coroutine ───────────────────────
async def main_simple():
    resultado = await tarea_asincrona("Tarea1", 1)
    print(resultado)

asyncio.run(main_simple())

# ── Ejecutar tareas concurrentemente ─────────────
async def main_concurrente():
    inicio = time.perf_counter()
    
    # gather ejecuta TODAS en paralelo
    resultados = await asyncio.gather(
        tarea_asincrona("Descarga-A", 2),
        tarea_asincrona("Descarga-B", 3),
        tarea_asincrona("Descarga-C", 1),
    )
    
    elapsed = time.perf_counter() - inicio
    for r in resultados:
        print(f"  ✅ {r}")
    print(f"\\nTiempo total: {elapsed:.2f}s")  # ~3s, no 6s!
    # Síncrono tomaría 2+3+1 = 6 segundos

asyncio.run(main_concurrente())`,
`Tarea1 completada
  ✅ Descarga-A completada
  ✅ Descarga-B completada
  ✅ Descarga-C completada

Tiempo total: 3.00s  ← no 6s!`)}
  </div>

  <div class="section">
    <div class="section-title">🌐 HTTP Asíncrono con httpx/aiohttp</div>
    ${codeCard('async_http.py',
`import asyncio
import httpx     # pip install httpx

async def obtener_usuario(client, user_id: int) -> dict:
    """Obtiene datos de un usuario de la API JSONPlaceholder."""
    url = f"https://jsonplaceholder.typicode.com/users/{user_id}"
    response = await client.get(url, timeout=10.0)
    response.raise_for_status()
    return response.json()

async def obtener_posts(client, user_id: int) -> list:
    """Obtiene posts de un usuario."""
    url = f"https://jsonplaceholder.typicode.com/posts?userId={user_id}"
    response = await client.get(url)
    return response.json()

async def perfil_completo(user_id: int) -> dict:
    """Obtiene datos del usuario y sus posts simultáneamente."""
    async with httpx.AsyncClient() as client:
        # Ambas peticiones en paralelo ✨
        usuario, posts = await asyncio.gather(
            obtener_usuario(client, user_id),
            obtener_posts(client, user_id),
        )
        return {
            "usuario": usuario.get("name"),
            "email":   usuario.get("email"),
            "total_posts": len(posts),
        }

async def main():
    # Obtener 5 perfiles concurrentemente
    tareas = [perfil_completo(i) for i in range(1, 6)]
    perfiles = await asyncio.gather(*tareas)
    
    for p in perfiles:
        print(f"👤 {p['usuario']} | 📧 {p['email']} | 📝 {p['total_posts']} posts")

asyncio.run(main())`,
`👤 Leanne Graham   | 📧 Sincere@april.biz | 📝 10 posts
👤 Ervin Howell    | 📧 Shanna@melissa.tv  | 📝 10 posts
👤 Clementine Bauch| 📧 Nathan@yesenia.net | 📝 10 posts
👤 Patricia Lebsack| 📧 Julianne@kory.org  | 📝 10 posts
👤 Chelsey Dietrich| 📧 Lucio_Hettinger@... | 📝 10 posts`)}

    ${tipBox('pro','🔥','PRO — asyncio.TaskGroup (Python 3.11+)','<code>async with asyncio.TaskGroup() as tg:</code> es la forma moderna y más segura de gather. Si una tarea falla, cancela automáticamente las demás y propaga el error correctamente.')}
  </div>

  <div class="section">
    <div class="section-title">🔄 FastAPI — API Async Moderna</div>
    ${codeCard('fastapi_app.py',
`# pip install fastapi uvicorn[standard]
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
import asyncio

app = FastAPI(
    title="Inventario API",
    version="2.0.0",
    description="API async con FastAPI"
)

# ── Schemas con Pydantic ──────────────────────────
class ProductoCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    precio: float = Field(..., gt=0, description="Debe ser mayor a 0")
    stock: int = Field(default=0, ge=0)
    categoria: Optional[str] = "general"

class ProductoResponse(ProductoCreate):
    id: int
    class Config:
        from_attributes = True

# ── Simulación de DB async ───────────────────────
db: dict[int, dict] = {}
counter = [1]

async def get_db():
    """Dependency injection para la DB."""
    await asyncio.sleep(0)  # Simula conexión async
    return db

# ── Endpoints ─────────────────────────────────────
@app.get("/productos", response_model=list[dict])
async def listar(db=Depends(get_db)):
    return list(db.values())

@app.post("/productos", response_model=dict, status_code=201)
async def crear(producto: ProductoCreate, db=Depends(get_db)):
    prod_dict = producto.dict()
    prod_dict["id"] = counter[0]
    counter[0] += 1
    db[prod_dict["id"]] = prod_dict
    return prod_dict

@app.get("/productos/{id}")
async def obtener(id: int, db=Depends(get_db)):
    if id not in db:
        raise HTTPException(status_code=404, detail=f"Producto {id} no encontrado")
    return db[id]

@app.delete("/productos/{id}", status_code=204)
async def eliminar(id: int, db=Depends(get_db)):
    if id not in db:
        raise HTTPException(status_code=404)
    del db[id]

# Ejecutar: uvicorn fastapi_app:app --reload
# Docs: http://localhost:8000/docs  ← Swagger UI automático!`,
`INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
# Documentación automática en /docs y /redoc`)}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 3: TESTING
  // ═══════════════════════════════
  'p3-testing': () => `
  <div class="page-hero">
    <div class="phase-badge p3">🚀 Fase 3 · Profesional</div>
    <h1 class="page-title">Testing Profesional</h1>
    <p class="page-subtitle">El código sin pruebas es código que nadie confía. Aprende pytest, mocking y TDD para escribir software de calidad de producción.</p>
  </div>

  <div class="section">
    <div class="section-title">🧪 pytest — El Framework Estándar</div>
    ${codeCard('tests/test_producto.py',
`import pytest
from models.producto import Producto

# ── Tests unitarios básicos ────────────────────────
class TestProducto:
    
    def test_crear_producto_valido(self):
        """Debe crear un producto con datos válidos."""
        prod = Producto(nombre="laptop gaming", precio=1200.0, stock=10)
        assert prod.nombre == "Laptop Gaming"  # título automático
        assert prod.precio == 1200.0
        assert prod.stock == 10
    
    def test_nombre_en_titulo(self):
        """El nombre debe convertirse a título automáticamente."""
        prod = Producto(nombre="  mouse inalámbrico  ", precio=35.99)
        assert prod.nombre == "Mouse Inalámbrico"
    
    def test_precio_invalido_lanza_error(self):
        """Un precio negativo debe lanzar ValueError."""
        with pytest.raises(ValueError, match="mayor a 0"):
            Producto(nombre="Test", precio=-10.0)
    
    def test_stock_negativo_lanza_error(self):
        """Stock negativo debe lanzar ValueError."""
        with pytest.raises(ValueError):
            Producto(nombre="Test", precio=10.0, stock=-1)
    
    def test_precio_cero_invalido(self):
        """Precio = 0 también es inválido."""
        with pytest.raises(ValueError):
            Producto(nombre="Test", precio=0)

# ── Fixtures — Datos reutilizables ───────────────
@pytest.fixture
def producto_laptop():
    """Fixture que provee un producto Laptop para los tests."""
    return Producto(nombre="Laptop HP", precio=1200.0, stock=10)

@pytest.fixture
def lista_productos():
    return [
        Producto("Laptop",  1200.0, 10),
        Producto("Mouse",   35.99,  50),
        Producto("Monitor", 459.99, 8),
    ]

class TestInventario:
    
    def test_calcular_valor_total(self, lista_productos):
        """El valor total debe ser suma(precio * stock)."""
        valor = sum(p.precio * p.stock for p in lista_productos)
        esperado = (1200*10) + (35.99*50) + (459.99*8)
        assert abs(valor - esperado) < 0.01  # Tolerancia float
    
    def test_filtrar_por_stock_bajo(self, lista_productos):
        """Debe identificar productos con stock < 10."""
        bajo_stock = [p for p in lista_productos if p.stock < 10]
        assert len(bajo_stock) == 1
        assert bajo_stock[0].nombre == "Monitor"`,
``)}
  </div>

  <div class="section">
    <div class="section-title">🎭 Mocking y Tests de Integración</div>
    ${codeCard('tests/test_api.py',
`import pytest
from unittest.mock import Mock, patch, MagicMock
from flask import json

# ── Mocking ───────────────────────────────────────
def test_servicio_con_mock():
    """Testear lógica sin depender de la DB real."""
    mock_repo = Mock()
    mock_repo.listar.return_value = [
        {"id": 1, "nombre": "Laptop", "precio": 1200.0}
    ]
    
    # Inyectar el mock
    from services.inventario_service import InventarioService
    servicio = InventarioService(repositorio=mock_repo)
    
    productos = servicio.listar_todos()
    
    assert len(productos) == 1
    mock_repo.listar.assert_called_once()     # Verificar que fue llamado

def test_llamada_http_con_patch():
    """Testear código que hace peticiones HTTP sin hacer peticiones reales."""
    datos_mock = {"id": 1, "nombre": "API Product"}
    
    with patch("requests.get") as mock_get:
        mock_get.return_value.json.return_value = datos_mock
        mock_get.return_value.status_code = 200
        
        import requests
        resp = requests.get("https://api.example.com/producto/1")
        resultado = resp.json()
        
        assert resultado["nombre"] == "API Product"
        mock_get.assert_called_with("https://api.example.com/producto/1")

# ── Test de API Flask ─────────────────────────────
@pytest.fixture
def app_cliente():
    """Fixture con cliente de testing de Flask."""
    from app import app
    app.config["TESTING"] = True
    app.config["DATA_FILE"] = ":memory:"  # No persiste en disco
    with app.test_client() as cliente:
        yield cliente

def test_listar_productos_vacio(app_cliente):
    resp = app_cliente.get("/api/productos")
    assert resp.status_code == 200
    data = json.loads(resp.data)
    assert data["total"] == 0

def test_crear_producto(app_cliente):
    payload = {"nombre": "Laptop", "precio": 1200.0, "stock": 10}
    resp = app_cliente.post(
        "/api/productos",
        json=payload,
        content_type="application/json"
    )
    assert resp.status_code == 201
    data = json.loads(resp.data)
    assert data["data"]["nombre"] == "Laptop"
    assert "id" in data["data"]

def test_crear_producto_precio_invalido(app_cliente):
    payload = {"nombre": "Test", "precio": -100}
    resp = app_cliente.post("/api/productos", json=payload)
    assert resp.status_code == 400`,
``)}

    ${codeCard('pytest.ini — Configuración',
`[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v                  # Verbose
    --tb=short          # Tracebacks cortos
    --cov=src           # Coverage del directorio src
    --cov-report=html   # Reporte HTML de coverage

# Ejecutar tests:
# pytest                         → todos los tests
# pytest tests/test_producto.py  → un archivo
# pytest -k "test_precio"        → filtrar por nombre
# pytest --cov --cov-report=term-missing  → con coverage`,
``)}

    ${tipBox('pro','🔥','PRO — TDD (Test-Driven Development)','Escribe el test PRIMERO (falla), luego implementa el código para que pase (verde), luego refactoriza. Este ciclo Red→Green→Refactor garantiza cobertura del 100% y un diseño más limpio.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 3: PATRONES
  // ═══════════════════════════════
  'p3-patrones': () => `
  <div class="page-hero">
    <div class="phase-badge p3">🚀 Fase 3 · Profesional</div>
    <h1 class="page-title">Patrones de Diseño</h1>
    <p class="page-subtitle">Los patrones de diseño son soluciones probadas a problemas recurrentes. Úsalos para escribir código elegante, mantenible y escalable.</p>
  </div>

  <div class="section">
    <div class="section-title">🏭 Factory y Builder</div>
    ${codeCard('factory_builder.py',
`from abc import ABC, abstractmethod
from typing import Protocol

# ── Factory Pattern ────────────────────────────────
class Notificacion(ABC):
    @abstractmethod
    def enviar(self, mensaje: str, destinatario: str) -> bool:
        pass

class NotificacionEmail(Notificacion):
    def enviar(self, mensaje, destinatario):
        print(f"📧 Email a {destinatario}: {mensaje}")
        return True

class NotificacionSMS(Notificacion):
    def enviar(self, mensaje, destinatario):
        print(f"📱 SMS a {destinatario}: {mensaje}")
        return True

class NotificacionSlack(Notificacion):
    def enviar(self, mensaje, destinatario):
        print(f"💬 Slack a #{destinatario}: {mensaje}")
        return True

class NotificacionFactory:
    _tipos = {
        "email": NotificacionEmail,
        "sms":   NotificacionSMS,
        "slack": NotificacionSlack,
    }
    
    @classmethod
    def crear(cls, tipo: str) -> Notificacion:
        if tipo not in cls._tipos:
            raise ValueError(f"Tipo '{tipo}' no soportado. Tipos: {list(cls._tipos)}")
        return cls._tipos[tipo]()
    
    @classmethod
    def registrar(cls, tipo: str, clase):
        """Extensible sin modificar la factory."""
        cls._tipos[tipo] = clase

# ── Builder Pattern ───────────────────────────────
class Reporte:
    def __init__(self):
        self.titulo = ""
        self.secciones = []
        self.footer = ""
        self.formato = "txt"

class ReporteBuilder:
    def __init__(self):
        self._reporte = Reporte()
    
    def titulo(self, titulo: str) -> "ReporteBuilder":
        self._reporte.titulo = titulo
        return self   # Permite method chaining
    
    def seccion(self, nombre: str, datos: list) -> "ReporteBuilder":
        self._reporte.secciones.append({"nombre": nombre, "datos": datos})
        return self
    
    def footer(self, texto: str) -> "ReporteBuilder":
        self._reporte.footer = texto
        return self
    
    def formato(self, fmt: str) -> "ReporteBuilder":
        self._reporte.formato = fmt
        return self
    
    def build(self) -> Reporte:
        return self._reporte

# ── Uso ──────────────────────────────────────────
notif = NotificacionFactory.crear("email")
notif.enviar("Stock bajo en Laptop", "admin@empresa.com")

reporte = (ReporteBuilder()
    .titulo("Reporte Mensual de Inventario")
    .seccion("Productos", [{"nombre":"Laptop","stock":10}])
    .seccion("Alertas", [{"item":"Mouse","nivel":"BAJO"}])
    .footer("Generado automáticamente")
    .formato("pdf")
    .build())

print(f"Reporte: {reporte.titulo} ({reporte.formato})")
print(f"Secciones: {len(reporte.secciones)}")`,
`📧 Email a admin@empresa.com: Stock bajo en Laptop
Reporte: Reporte Mensual de Inventario (pdf)
Secciones: 2`)}
  </div>

  <div class="section">
    <div class="section-title">👀 Observer y Strategy</div>
    ${codeCard('observer_strategy.py',
`from typing import Protocol, Callable

# ── Observer / Event System ───────────────────────
class Observador(Protocol):
    def actualizar(self, evento: str, datos: dict) -> None: ...

class SistemaEventos:
    """Sistema de eventos desacoplado."""
    
    def __init__(self):
        self._listeners: dict[str, list] = {}
    
    def suscribir(self, evento: str, callback: Callable) -> None:
        if evento not in self._listeners:
            self._listeners[evento] = []
        self._listeners[evento].append(callback)
    
    def emitir(self, evento: str, datos: dict = {}) -> None:
        for callback in self._listeners.get(evento, []):
            callback(datos)

# Handlers
def notificar_stock_bajo(datos):
    print(f"⚠️ ALERTA: Stock bajo — {datos['producto']}: {datos['stock']} uds")

def log_cambio_precio(datos):
    print(f"📋 LOG: Precio cambiado — {datos['producto']}: ${datos['precio_nuevo']}")

def enviar_email_admin(datos):
    print(f"📧 EMAIL: Administrador notificado sobre {datos.get('evento')}")

# Configurar eventos
eventos = SistemaEventos()
eventos.suscribir("stock_bajo",    notificar_stock_bajo)
eventos.suscribir("stock_bajo",    enviar_email_admin)
eventos.suscribir("precio_cambio", log_cambio_precio)

# Emitir eventos
eventos.emitir("stock_bajo", {"producto": "Laptop", "stock": 2})
eventos.emitir("precio_cambio", {"producto": "Monitor", "precio_nuevo": 399.99})

# ── Strategy Pattern ──────────────────────────────
class EstrategiaDescuento(Protocol):
    def calcular(self, precio: float, cantidad: int) -> float: ...

def descuento_volumen(precio, cantidad):
    if cantidad >= 100: return precio * 0.75
    if cantidad >= 50:  return precio * 0.85
    if cantidad >= 10:  return precio * 0.95
    return precio

def descuento_temporada(precio, cantidad):
    return precio * 0.80   # 20% off

def sin_descuento(precio, cantidad):
    return precio

def calcular_total(productos, estrategia: Callable) -> float:
    return sum(estrategia(p["precio"], p["cantidad"]) * p["cantidad"]
               for p in productos)

pedido = [
    {"nombre": "Laptop", "precio": 1200.0, "cantidad": 10},
    {"nombre": "Mouse",  "precio": 35.99,  "cantidad": 60},
]

print(f"Normal:   ${calcular_total(pedido, sin_descuento):,.2f}")
print(f"Volumen:  ${calcular_total(pedido, descuento_volumen):,.2f}")
print(f"Temporada:${calcular_total(pedido, descuento_temporada):,.2f}")`,
`⚠️ ALERTA: Stock bajo — Laptop: 2 uds
📧 EMAIL: Administrador notificado sobre stock_bajo
📋 LOG: Precio cambiado — Monitor: $399.99
Normal:   $14,159.40
Volumen:  $13,680.83
Temporada:$11,327.52`)}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 3: PERFORMANCE
  // ═══════════════════════════════
  'p3-performance': () => `
  <div class="page-hero">
    <div class="phase-badge p3">🚀 Fase 3 · Profesional</div>
    <h1 class="page-title">Performance y Optimización</h1>
    <p class="page-subtitle">Optimiza solo cuando tienes evidencia de un problema. Mide primero, optimiza después. "Premature optimization is the root of all evil."</p>
  </div>

  <div class="section">
    <div class="section-title">📊 Profiling — Medir Antes de Optimizar</div>
    ${codeCard('profiling.py',
`import cProfile
import timeit
import time
from memory_profiler import profile  # pip install memory-profiler

# ── timeit — medir tiempo de expresiones ─────────
# Método 1: más simple
tiempo = timeit.timeit("sum(range(10000))", number=1000)
print(f"sum(range): {tiempo:.4f}s para 1000 repeticiones")

# Método 2: comparar alternativas
t1 = timeit.timeit("[i**2 for i in range(1000)]", number=10000)
t2 = timeit.timeit("list(map(lambda x: x**2, range(1000)))", number=10000)
print(f"List comp: {t1:.4f}s | map+lambda: {t2:.4f}s")

# ── cProfile — profiling completo ────────────────
def funcion_lenta():
    resultado = []
    for i in range(100000):
        resultado.append(str(i))   # Concatenación en loop
    return "".join(resultado)

def funcion_rapida():
    return "".join(str(i) for i in range(100000))   # Generator

# Ejecutar en terminal:
# python -m cProfile -s cumulative mi_script.py

# ── Benchmark manual ──────────────────────────────
def benchmark(func, n=10):
    tiempos = []
    for _ in range(n):
        start = time.perf_counter()
        func()
        tiempos.append(time.perf_counter() - start)
    promedio = sum(tiempos) / n
    print(f"{func.__name__}: {promedio*1000:.2f}ms promedio")

benchmark(funcion_lenta)
benchmark(funcion_rapida)`,
`sum(range): 0.1234s para 1000 repeticiones
List comp: 0.8765s | map+lambda: 1.2345s
funcion_lenta: 18.34ms promedio
funcion_rapida: 12.56ms promedio`)}
  </div>

  <div class="section">
    <div class="section-title">⚡ Técnicas de Optimización</div>
    ${codeCard('optimizaciones.py',
`# ── 1. Usa estructuras adecuadas ─────────────────
import timeit

# Búsqueda: set es O(1), list es O(n)
n = 10000
lista  = list(range(n))
conjunto = set(range(n))

t_lista = timeit.timeit("9999 in lista", globals=globals(), number=100000)
t_set   = timeit.timeit("9999 in conjunto", globals=globals(), number=100000)
print(f"lista.in: {t_lista:.3f}s | set.in: {t_set:.3f}s")
# set es ~100x más rápido para búsquedas

# ── 2. Strings: join no + ────────────────────────
# MAL — O(n²)
def concatenar_malo(items):
    resultado = ""
    for item in items:
        resultado += str(item)   # Crea nuevo objeto cada vez
    return resultado

# BIEN — O(n)
def concatenar_bien(items):
    return "".join(str(i) for i in items)

# ── 3. Generadores para grandes datasets ─────────
def leer_grandes_datos():
    # MAL — carga todo en memoria
    # lineas = open("grande.txt").readlines()
    
    # BIEN — procesa línea por línea
    with open("grande.txt") as f:
        for linea in f:           # Lazy reading
            yield linea.strip()

# ── 4. slots para clases con muchas instancias ───
class PuntoNormal:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class PuntoSlots:
    __slots__ = ["x", "y"]   # Sin __dict__ → menos memoria
    def __init__(self, x, y):
        self.x = x
        self.y = y

# PuntoSlots usa ~40% menos memoria

# ── 5. Numba / NumPy para cálculos numéricos ─────
# pip install numpy numba
import numpy as np

# Python puro — lento para arrays
def suma_python(arr):
    return sum(arr)

# NumPy — vectorizado, usa C internamente
arr = np.arange(1_000_000)
np_suma = np.sum(arr)   # ~50x más rápido que sum()

print(np_suma)`,
`lista.in: 2.345s | set.in: 0.012s
499999500000`)}

    ${tipBox('warn','⚠️','Regla de Optimización','No optimices sin medir. El 80% del tiempo se gasta en el 20% del código (Principio de Pareto). Usa cProfile para encontrar los cuellos de botella ANTES de optimizar.')}
    ${tipBox('trick','⚡','TRUCO — slots','<code>__slots__</code> puede reducir el uso de memoria un 30-50% en clases que se instancian millones de veces (como nodos de un árbol o puntos en geometría computacional).')}
  </div>

  <div class="section">
    <div class="section-title">🔄 Concurrencia vs Paralelismo</div>
    ${codeCard('concurrencia.py',
`import asyncio
import concurrent.futures
import time

# ── I/O-bound → asyncio o ThreadPoolExecutor ─────
async def tarea_io(nombre, delay):
    await asyncio.sleep(delay)   # Simula I/O (HTTP, DB, disco)
    return f"{nombre} listo"

async def main_io():
    inicio = time.time()
    resultados = await asyncio.gather(
        *[tarea_io(f"req-{i}", 1) for i in range(10)]
    )
    print(f"I/O async: {time.time()-inicio:.2f}s para 10 tareas")

# ── CPU-bound → ProcessPoolExecutor ─────────────
def calcular_primos(n):
    """Cálculo intensivo de CPU."""
    primos = []
    for num in range(2, n):
        es_primo = all(num % i != 0 for i in range(2, int(num**0.5)+1))
        if es_primo:
            primos.append(num)
    return len(primos)

def main_cpu():
    rangos = [10000, 20000, 30000, 15000]
    
    inicio = time.time()
    with concurrent.futures.ProcessPoolExecutor() as executor:
        resultados = list(executor.map(calcular_primos, rangos))
    print(f"CPU paralelo: {time.time()-inicio:.2f}s | Resultados: {resultados}")

asyncio.run(main_io())
main_cpu()`,
`I/O async: 1.00s para 10 tareas  ← no 10s!
CPU paralelo: 1.2s | Resultados: [1229, 2262, 3401, 1761]`)}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 3: PROYECTO FINAL
  // ═══════════════════════════════
  'p3-proyecto': () => `
  <div class="page-hero">
    <div class="phase-badge p3">🚀 Fase 3 · Proyecto Final</div>
    <h1 class="page-title">Proyecto Final: App Completa</h1>
    <p class="page-subtitle">Integra todo lo aprendido: FastAPI async, testing completo, patrones de diseño, Docker y despliegue en la nube.</p>
  </div>

  <div class="project-phase p3">
    <div class="project-phase-title">⚡ Inventario Pro — Sistema Completo</div>
    <div class="content-text">
      <p>Una aplicación de inventario de nivel producción con todas las características de un sistema real.</p>
    </div>
    <div class="tag-list">
      <span class="tag purple">FastAPI</span>
      <span class="tag purple">Async</span>
      <span class="tag purple">SQLAlchemy</span>
      <span class="tag purple">PostgreSQL</span>
      <span class="tag purple">Redis Cache</span>
      <span class="tag purple">JWT Auth</span>
      <span class="tag purple">pytest</span>
      <span class="tag purple">Docker</span>
      <span class="tag purple">CI/CD</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📁 Arquitectura Final</div>
    ${codeCard('arquitectura_final.txt',
`inventario_pro/
├── 📄 docker-compose.yml        # Orquesta app + db + redis
├── 📄 Dockerfile
├── 📄 pyproject.toml
│
├── 📁 src/inventario_pro/
│   ├── 📄 main.py               # FastAPI app + lifespan
│   ├── 📄 config.py             # Pydantic Settings
│   │
│   ├── 📁 api/
│   │   ├── 📄 deps.py           # Dependencias compartidas
│   │   ├── 📄 productos.py      # Router productos
│   │   ├── 📄 usuarios.py       # Router auth
│   │   └── 📄 reportes.py       # Router reportes async
│   │
│   ├── 📁 core/
│   │   ├── 📄 security.py       # JWT, hashing
│   │   ├── 📄 cache.py          # Redis helper
│   │   └── 📄 eventos.py        # Event bus
│   │
│   ├── 📁 models/
│   │   ├── 📄 db_models.py      # SQLAlchemy ORM
│   │   └── 📄 schemas.py        # Pydantic schemas
│   │
│   └── 📁 services/
│       ├── 📄 producto_svc.py   # Lógica de negocio
│       └── 📄 reporte_svc.py    # Generación de reportes
│
└── 📁 tests/
    ├── 📄 conftest.py           # Fixtures globales
    ├── 📄 test_api_productos.py
    └── 📄 test_servicios.py`,
``)}
  </div>

  <div class="section">
    <div class="section-title">🔐 Autenticación JWT</div>
    ${codeCard('core/security.py',
`from datetime import datetime, timedelta
from typing import Optional
import hashlib, secrets, hmac
from jose import jwt, JWTError   # pip install python-jose

SECRET_KEY = secrets.token_hex(32)   # En prod: variable de entorno
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(hours=24)

def crear_access_token(data: dict, expires: Optional[timedelta] = None) -> str:
    """Crea un JWT token firmado."""
    payload = data.copy()
    expira = datetime.utcnow() + (expires or ACCESS_TOKEN_EXPIRE)
    payload.update({"exp": expira, "iat": datetime.utcnow()})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verificar_token(token: str) -> Optional[dict]:
    """Verifica y decodifica un JWT. None si inválido."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def hashear_password(password: str) -> str:
    """Hash seguro con salt usando SHA-256 (usar bcrypt en prod)."""
    salt = secrets.token_hex(16)
    h = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{h}"

def verificar_password(password: str, hashed: str) -> bool:
    salt, stored = hashed.split(":")
    h = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return hmac.compare_digest(h, stored)`,
``)}
  </div>

  <div class="section">
    <div class="section-title">🐳 Docker y Despliegue</div>
    ${codeCard('Dockerfile',
`# ── Multi-stage build para imagen optimizada ────
FROM python:3.11-slim AS base

WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc libpq-dev \\
    && rm -rf /var/lib/apt/lists/*

# ── Stage: dependencias ──────────────────────────
FROM base AS deps

COPY pyproject.toml ./
RUN pip install --no-cache-dir .

# ── Stage: producción ────────────────────────────
FROM deps AS production

COPY src/ ./src/
EXPOSE 8000

CMD ["uvicorn", "src.inventario_pro.main:app", \\
     "--host", "0.0.0.0", "--port", "8000", \\
     "--workers", "4"]`,
``)}

    ${codeCard('docker-compose.yml',
`version: "3.9"
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://user:pass@db/inventario
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
    
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: inventario
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "user"]
      interval: 5s
      timeout: 5s
      retries: 5
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:

# Ejecutar: docker-compose up -d
# API: http://localhost:8000/docs`,
``)}

    ${tipBox('note','🎓','¡Has llegado al nivel Profesional!','Con este proyecto tienes todas las herramientas para trabajar en equipos de desarrollo profesional. El siguiente paso es contribuir a proyectos open source, construir tu portafolio y prepararte para entrevistas técnicas.')}
  </div>
  `,

  // ═══════════════════════════════
  //  FASE 3: QUIZ FINAL
  // ═══════════════════════════════
  'p3-quiz': () => buildQuiz('p3', [
    {
      q: '¿Cuál es la diferencia clave entre asyncio y multiprocessing?',
      opts: [
        'asyncio usa múltiples núcleos de CPU, multiprocessing usa un solo hilo',
        'asyncio es para I/O-bound (concurrencia cooperativa), multiprocessing es para CPU-bound (paralelismo real)',
        'Son equivalentes, solo difieren en sintaxis',
        'multiprocessing solo funciona en Linux, asyncio es multiplataforma'
      ],
      correct: 1,
      exp: 'asyncio usa un event loop en UN solo hilo — ideal para I/O-bound (red, disco) donde el tiempo es de espera. multiprocessing crea procesos SEPARADOS con su propio intérprete — ideal para CPU-bound (cálculos matemáticos) ya que sortea el GIL.'
    },
    {
      q: '¿Qué hace asyncio.gather() y cómo difiere de await individual?',
      opts: [
        'gather() ejecuta coroutines secuencialmente, igual que await',
        'gather() ejecuta todas las coroutines concurrentemente y espera a que TODAS terminen',
        'gather() solo sirve para peticiones HTTP, await es de propósito general',
        'gather() cancela las tareas restantes si una falla'
      ],
      correct: 1,
      exp: 'gather() lanza TODAS las coroutines simultáneamente y retorna cuando todas completan. Si await-as secuencialmente, cada una espera a la anterior. Con gather, 3 tareas de 1s cada una = ~1s total en lugar de 3s.'
    },
    {
      q: '¿Qué es un fixture en pytest y para qué sirve?',
      opts: [
        'Un tipo especial de assertion para comparar floats',
        'Una función que provee datos o estado reutilizable para múltiples tests',
        'Un plugin de pytest para generar reportes HTML',
        'Una manera de marcar tests como "esperados a fallar"'
      ],
      correct: 1,
      exp: 'Los fixtures son funciones decoradas con @pytest.fixture que configuran datos o estado para los tests. Pueden tener diferentes scopes (function, class, module, session) y se inyectan automáticamente como parámetros en las funciones de test.'
    },
    {
      q: '¿Cuál es el propósito del patrón Observer?',
      opts: [
        'Crear objetos sin especificar su clase exacta',
        'Definir una dependencia uno-a-muchos donde cuando un objeto cambia, todos sus dependientes son notificados automáticamente',
        'Garantizar que solo exista una instancia de una clase',
        'Permitir que algoritmos intercambiables sean seleccionados en tiempo de ejecución'
      ],
      correct: 1,
      exp: 'Observer (o Event System) desacopla el emisor del evento de sus receptores. El emisor no necesita saber quién escucha — solo emite. Múltiples handlers pueden suscribirse sin modificar el emisor. Es la base de sistemas como Django signals, Vue.js reactivity, etc.'
    },
    {
      q: '¿Cuándo se debe usar __slots__ en una clase Python?',
      opts: [
        'Siempre, ya que siempre mejora el rendimiento',
        'Cuando se crearán millones de instancias de la clase y la memoria es crítica',
        'Solo en clases que heredan de object',
        'Cuando la clase tiene métodos estáticos'
      ],
      correct: 1,
      exp: '__slots__ elimina el __dict__ de instancia (diccionario que almacena atributos), reduciendo el uso de memoria ~30-50%. Ideal para clases instanciadas millones de veces (puntos en geometría, nodos de árbol). Desventaja: no puedes agregar atributos dinámicamente.'
    },
    {
      q: '¿Qué ventaja principal tiene FastAPI sobre Flask?',
      opts: [
        'FastAPI soporta templates HTML, Flask no',
        'FastAPI tiene validación automática con Pydantic, async nativo, y genera documentación OpenAPI automáticamente',
        'FastAPI tiene más extensiones y plugins disponibles',
        'FastAPI usa menos memoria RAM en producción'
      ],
      correct: 1,
      exp: 'FastAPI ofrece: (1) Validación automática de request/response con Pydantic, (2) async/await nativo desde el diseño, (3) generación automática de docs Swagger/ReDoc, (4) type hints usados para validación real. Flask es más flexible y maduro, pero requiere más configuración manual.'
    },
  ]),

  // ═══════════════════════════════
  //  CHEAT SHEET
  // ═══════════════════════════════
  'recursos-cheatsheet': () => `
  <div class="page-hero">
    <div class="phase-badge info">📄 Recursos</div>
    <h1 class="page-title">Python Cheat Sheet</h1>
    <p class="page-subtitle">Referencia rápida de la sintaxis y patrones más usados en Python profesional.</p>
  </div>

  <div class="section">
    <div class="section-title">🔤 Strings</div>
    <div class="cheatsheet-grid">
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">f-strings</div>
        <div class="cheatsheet-item-body">f"Hola {nombre}"
f"{valor:.2f}"
f"{num:,}"
f"{n:05d}"
f"{s!r}"</div>
      </div>
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Métodos</div>
        <div class="cheatsheet-item-body">s.upper() / s.lower()
s.strip() / s.split(",")
s.replace("a", "b")
s.startswith("py")
",".join(lista)</div>
      </div>
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Slicing</div>
        <div class="cheatsheet-item-body">s[0]      # primero
s[-1]     # último
s[1:4]    # rango
s[::2]    # cada 2
s[::-1]   # invertir</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📋 Listas / Dict / Set</div>
    <div class="cheatsheet-grid">
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">List operations</div>
        <div class="cheatsheet-item-body">lst.append(x)
lst.insert(i, x)
lst.extend(iterable)
lst.pop(i)
lst.sort(key=fn)
sorted(lst, reverse=True)</div>
      </div>
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Dict operations</div>
        <div class="cheatsheet-item-body">d.get(k, default)
d.setdefault(k, v)
d.items() / .keys()
d.update(otro)
d1 | d2   # merge (3.9+)
{**d1, **d2}  # merge</div>
      </div>
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Comprehensions</div>
        <div class="cheatsheet-item-body">[x*2 for x in lst]
[x for x in lst if x>0]
{k:v for k,v in d.items()}
{x for x in lst}
(x for x in lst)  # gen</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">⚙️ Funciones y Clases</div>
    <div class="cheatsheet-grid">
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Argumentos</div>
        <div class="cheatsheet-item-body">def f(a, b=1, *args, **kw)
f(*lista)    # unpack
f(**dict)    # unpack
lambda x: x*2
functools.partial(f, a=1)</div>
      </div>
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Decoradores</div>
        <div class="cheatsheet-item-body">@property
@classmethod
@staticmethod
@abstractmethod
@functools.lru_cache(128)
@functools.wraps(func)</div>
      </div>
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Dataclasses</div>
        <div class="cheatsheet-item-body">@dataclass
@dataclass(frozen=True)
field(default_factory=list)
field(repr=False)
asdict(obj)
astuple(obj)</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">⚡ Async</div>
    <div class="cheatsheet-grid">
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Básico</div>
        <div class="cheatsheet-item-body">async def fn():
    await otra_fn()

asyncio.run(main())
await asyncio.sleep(1)</div>
      </div>
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Concurrencia</div>
        <div class="cheatsheet-item-body">await asyncio.gather(t1, t2)
asyncio.create_task(coro)
async with ctx_manager:
async for item in aiter:</div>
      </div>
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Timeout</div>
        <div class="cheatsheet-item-body">await asyncio.wait_for(
    coro(), timeout=5.0
)
asyncio.TaskGroup() # 3.11</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🛡️ Excepciones y Context Managers</div>
    <div class="cheatsheet-grid">
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">try/except</div>
        <div class="cheatsheet-item-body">try:
    ...
except (E1, E2) as e:
    ...
else:    # sin error
    ...
finally: # siempre
    ...</div>
      </div>
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">Jerarquía</div>
        <div class="cheatsheet-item-body">class MiError(Exception): ...
raise MiError("msg")
raise from e  # chaining
traceback.format_exc()</div>
      </div>
      <div class="cheatsheet-item">
        <div class="cheatsheet-item-header">contextlib</div>
        <div class="cheatsheet-item-body">@contextmanager
def ctx():
    setup()
    yield valor
    teardown()

with ctx() as v:
    ...</div>
      </div>
    </div>
  </div>
  `,

  // ═══════════════════════════════
  //  TRUCOS PRO
  // ═══════════════════════════════
  'recursos-trucos': () => `
  <div class="page-hero">
    <div class="phase-badge info">💡 Recursos</div>
    <h1 class="page-title">Trucos Python Pro</h1>
    <p class="page-subtitle">Los trucos, patrones y one-liners que separan el código promedio del código profesional.</p>
  </div>

  <div class="section">
    <div class="section-title">⚡ One-liners y Trucos de Sintaxis</div>
    <div class="tricks-grid">
      ${trick('🔄','Swap sin temporal','Intercambia dos variables en una línea.',
`# En otros lenguajes necesitas una var temp
temp = a; a = b; b = temp

# Python
a, b = b, a`)}
      ${trick('📊','Aplanar lista','Convierte lista de listas en una sola.',
`lista = [[1,2],[3,4],[5,6]]
# Solución elegante
plana = [x for sub in lista for x in sub]
# O con itertools
import itertools
plana = list(itertools.chain.from_iterable(lista))`)}
      ${trick('🔢','Contar ocurrencias','Cuenta elementos sin loops manuales.',
`from collections import Counter
texto = "banana"
c = Counter(texto)
print(c)  # {'a':3,'n':2,'b':1}
print(c.most_common(2))  # [('a',3),('n',2)]`)}
      ${trick('🎯','Filtrar None','Elimina None de una lista.',
`datos = [1, None, 2, None, 3, None]
limpios = list(filter(None, datos))
# También: [x for x in datos if x is not None]`)}
      ${trick('📖','Dict de grupo','Agrupa items por clave.',
`from itertools import groupby

items = [{"tipo":"A","val":1},{"tipo":"B","val":2},{"tipo":"A","val":3}]
grupos = {k: list(g) for k, g in groupby(items, key=lambda x: x["tipo"])}`)}
      ${trick('🔗','Zip seguro','Itera listas de diferente longitud.',
`from itertools import zip_longest
a = [1,2,3]
b = ["a","b"]
for x, y in zip_longest(a, b, fillvalue=0):
    print(x, y)  # 3, 0 en la última`)}
      ${trick('💾','Cache de función','Memoización automática.',
`from functools import cache  # Python 3.9+

@cache
def fib(n):
    return n if n <= 1 else fib(n-1) + fib(n-2)

# @cache es @lru_cache(maxsize=None)`)}
      ${trick('🔑','Default dict','Evita KeyError al crear grupos.',
`from collections import defaultdict

grupos = defaultdict(list)
for nombre, ciudad in datos:
    grupos[ciudad].append(nombre)
# Sin necesidad de if ciudad in grupos`)}
      ${trick('📦','Desempaquetado','Divide una colección elegantemente.',
`primero, *resto = [1,2,3,4,5]
*inicio, ultimo = [1,2,3,4,5]
a, b, *_, z = range(10)  # a=0,b=1,z=9`)}
      ${trick('✅','Any y All','Evalúa colecciones con una sola línea.',
`nums = [2, 4, 6, 8, 10]
todos_pares = all(n % 2 == 0 for n in nums)  # True
algun_mayor = any(n > 7 for n in nums)       # True

# Equivale a loops but más eficiente (lazy)`)}
      ${trick('🔁','Enumerate pro','Itera con índice y valor.',
`# Comenzar en 1 en lugar de 0
for i, item in enumerate(lista, start=1):
    print(f"{i}. {item}")

# Crear dict numerado
numerado = {i: v for i, v in enumerate(lista)}`)}
      ${trick('🎲','Sampler elegante','Muestra aleatoria sin repetición.',
`import random
lista = list(range(100))
muestra = random.sample(lista, k=10)     # Sin repetición
eleccion = random.choice(lista)          # Uno aleatorio
random.shuffle(lista)                    # Mezclar in-place`)}
    </div>
  </div>

  <div class="section">
    <div class="section-title">🔥 Patrones Pythónicos Avanzados</div>
    ${codeCard('patrones_avanzados.py',
`# ── Context Manager personalizado ────────────────
from contextlib import contextmanager
import time

@contextmanager
def medir_tiempo(nombre=""):
    inicio = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - inicio
        print(f"⏱️ {nombre}: {elapsed*1000:.2f}ms")

with medir_tiempo("operación costosa"):
    resultado = sum(i**2 for i in range(1_000_000))

# ── Descriptor — atributos con lógica ───────────
class RangoValidado:
    """Descriptor para validar rangos numéricos."""
    def __set_name__(self, owner, name):
        self.name = f"_{name}"
    
    def __init__(self, min_val, max_val):
        self.min = min_val
        self.max = max_val
    
    def __get__(self, obj, objtype=None):
        return getattr(obj, self.name, None)
    
    def __set__(self, obj, value):
        if not (self.min <= value <= self.max):
            raise ValueError(f"{self.name}: {value} fuera de [{self.min},{self.max}]")
        setattr(obj, self.name, value)

class Sensor:
    temperatura = RangoValidado(-50, 150)
    humedad = RangoValidado(0, 100)
    
    def __init__(self, temp, hum):
        self.temperatura = temp
        self.humedad = hum

s = Sensor(25, 60)
print(f"Temp: {s.temperatura}°C, Hum: {s.humedad}%")
# s.temperatura = 200  # ValueError!

# ── Protocol — duck typing formal ────────────────
from typing import Protocol, runtime_checkable

@runtime_checkable
class Serializable(Protocol):
    def to_dict(self) -> dict: ...
    def to_json(self) -> str: ...

# Cualquier clase que implemente estos métodos es Serializable
# Sin necesidad de heredar — duck typing con type safety`,
`⏱️ operación costosa: 145.23ms
Temp: 25°C, Hum: 60%`)}
  </div>
  `
};

// ── Build Quiz ──────────────────────────────────
function buildQuiz(phase, preguntas) {
  const quizId = `quiz_${phase}`;
  let html = `
  <div class="page-hero">
    <div class="phase-badge quiz">🎯 Quiz · ${phase === 'p1' ? 'Fase 1' : phase === 'p2' ? 'Fase 2' : 'Fase Final'}</div>
    <h1 class="page-title">${phase === 'p3' ? 'Quiz Final — Nivel Profesional' : `Quiz de ${phase === 'p1' ? 'Principiante' : 'Intermedio'}`}</h1>
    <p class="page-subtitle">Pon a prueba tus conocimientos. Selecciona la respuesta correcta para cada pregunta.</p>
  </div>
  <div id="${quizId}">`;

  preguntas.forEach((p, qi) => {
    const savedAns = state.quizAnswers[`${quizId}_${qi}`];
    html += `
    <div class="quiz-card" id="${quizId}_card_${qi}">
      <div class="quiz-num">Pregunta ${qi + 1} de ${preguntas.length}</div>
      <div class="quiz-question"><pre style="font-family:inherit;white-space:pre-wrap">${p.q}</pre></div>
      <div class="quiz-options" id="${quizId}_opts_${qi}">
        ${p.opts.map((opt, oi) => {
          let cls = '';
          if (savedAns !== undefined) {
            if (oi === p.correct) cls = 'correct';
            else if (oi === savedAns) cls = 'wrong';
          }
          return `
          <div class="quiz-option ${cls}" onclick="responderQuiz('${quizId}', ${qi}, ${oi}, ${p.correct}, ${preguntas.length})" id="${quizId}_opt_${qi}_${oi}">
            <div class="quiz-letter">${'ABCD'[oi]}</div>
            <span>${opt}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="quiz-explanation ${savedAns !== undefined ? 'show' : ''}" id="${quizId}_exp_${qi}">
        💡 ${p.exp}
      </div>
    </div>`;
  });

  // Result block
  const allAnswered = preguntas.every((_, qi) => state.quizAnswers[`${quizId}_${qi}`] !== undefined);
  const correctCount = allAnswered ? preguntas.filter((p, qi) => state.quizAnswers[`${quizId}_${qi}`] === p.correct).length : 0;
  const pct = Math.round((correctCount / preguntas.length) * 100);
  const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚';
  const msg = pct >= 80 ? '¡Excelente! Estás listo para la siguiente fase.' : pct >= 60 ? 'Buen trabajo. Repasa los conceptos fallados.' : 'Te recomendamos repasar los módulos de esta fase.';

  html += `
  <div class="quiz-result ${allAnswered ? 'show' : ''}" id="${quizId}_result">
    <span class="result-emoji">${emoji}</span>
    <div class="result-score">${correctCount}/${preguntas.length}</div>
    <div class="result-label">${pct}% — ${msg}</div>
    <button class="btn-primary" onclick="reiniciarQuiz('${quizId}', ${preguntas.length})" style="margin-top:20px">🔄 Intentar de Nuevo</button>
  </div>
  </div>`;

  return html;
}

// Helper para tricks
function trick(emoji, nombre, desc, codigo) {
  return `
  <div class="trick-card">
    <div class="trick-card-header">
      <span class="trick-emoji">${emoji}</span>
      <span class="trick-name">${nombre}</span>
    </div>
    <div class="trick-card-body">
      <div class="trick-desc">${desc}</div>
      <div class="code-card">
        <div class="code-card-body"><pre>${highlight(codigo)}</pre></div>
      </div>
    </div>
  </div>`;
}

// ── Quiz Logic ──────────────────────────────────
function responderQuiz(quizId, qi, selected, correct, total) {
  const key = `${quizId}_${qi}`;
  if (state.quizAnswers[key] !== undefined) return; // Ya respondida

  state.quizAnswers[key] = selected;
  localStorage.setItem('pymaestro-quiz', JSON.stringify(state.quizAnswers));

  // Highlight options
  const opts = document.querySelectorAll(`#${quizId}_opts_${qi} .quiz-option`);
  opts.forEach((el, i) => {
    el.style.pointerEvents = 'none';
    if (i === correct) el.classList.add('correct');
    else if (i === selected) el.classList.add('wrong');
  });

  // Show explanation
  document.getElementById(`${quizId}_exp_${qi}`).classList.add('show');

  // Check if all answered
  const allAnswered = Array.from({length: total}, (_, i) =>
    state.quizAnswers[`${quizId}_${i}`] !== undefined).every(Boolean);

  if (allAnswered) {
    setTimeout(() => {
      const resultEl = document.getElementById(`${quizId}_result`);
      if (resultEl) {
        resultEl.classList.add('show');
        const correctCount = Array.from({length: total}, (_, i) => {
          return state.quizAnswers[`${quizId}_${i}`] !== undefined;
        }).filter(Boolean).length;
        resultEl.scrollIntoView({behavior: 'smooth', block: 'center'});
      }
    }, 500);
  }
}

function reiniciarQuiz(quizId, total) {
  for (let i = 0; i < total; i++) {
    delete state.quizAnswers[`${quizId}_${i}`];
  }
  localStorage.setItem('pymaestro-quiz', JSON.stringify(state.quizAnswers));
  renderPage(state.currentPage);
}

// ── Navigation ──────────────────────────────────
function navigateTo(pageId) {
  if (!PAGES[pageId]) return;

  // Mark previous page as completed (if not home/quiz/recursos)
  const prev = state.currentPage;
  if (prev !== 'home' && !prev.includes('quiz') && !state.completedPages.includes(prev)) {
    state.completedPages.push(prev);
    localStorage.setItem('pymaestro-completed', JSON.stringify(state.completedPages));
  }

  state.currentPage = pageId;
  renderPage(pageId);
  updateNav(pageId);
  updateProgress();
  updateBottomNav();

  // Scroll to top
  document.getElementById('pageContainer').parentElement.scrollTo(0, 0);

  // Close sidebar on mobile
  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.add('closed');
    document.querySelector('.main-content').classList.add('full-width');
    document.querySelector('.bottom-nav').classList.add('full-width');
  }
}

function renderPage(pageId) {
  const container = document.getElementById('pageContainer');
  container.style.animation = 'none';
  container.offsetHeight; // reflow
  container.style.animation = '';
  container.innerHTML = PAGES[pageId] ? PAGES[pageId]() : '<div class="loading"></div>';

  // Update home progress stat
  if (pageId === 'home') {
    const pct = Math.round((state.completedPages.length / TRACKABLE_PAGES.length) * 100);
    const el = document.getElementById('homeProgress');
    if (el) el.textContent = pct + '%';
  }
}

function updateNav(pageId) {
  // Update breadcrumb
  const navBtn = document.querySelector(`[data-page="${pageId}"] span:nth-child(2)`);
  document.getElementById('breadcrumb').textContent = navBtn ? navBtn.textContent : 'Inicio';

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageId);
  });

  // Update completion checkmarks
  state.completedPages.forEach(p => {
    const chk = document.getElementById(`chk-${p}`);
    if (chk) { chk.textContent = '✓'; chk.classList.add('done'); }
  });
}

function updateProgress() {
  const pct = Math.round((state.completedPages.length / TRACKABLE_PAGES.length) * 100);
  document.getElementById('totalProgressBar').style.width = pct + '%';
  document.getElementById('totalProgressPct').textContent = pct + '%';
}

function updateBottomNav() {
  const idx = PAGE_ORDER.indexOf(state.currentPage);
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  prevBtn.disabled = idx <= 0;
  prevBtn.style.opacity = idx <= 0 ? '0.3' : '1';

  nextBtn.disabled = idx >= PAGE_ORDER.length - 1;
  nextBtn.style.opacity = idx >= PAGE_ORDER.length - 1 ? '0.3' : '1';

  // Update dots
  const dotsContainer = document.getElementById('pageDots');
  const section = getSectionPages();
  dotsContainer.innerHTML = section.map((_, i) => {
    const pi = PAGE_ORDER.indexOf(section[i]);
    return `<div class="dot ${pi === idx ? 'active' : ''}"></div>`;
  }).join('');
}

function getSectionPages() {
  const idx = PAGE_ORDER.indexOf(state.currentPage);
  // Show 5 dots around current
  const start = Math.max(0, Math.min(idx - 2, PAGE_ORDER.length - 5));
  return PAGE_ORDER.slice(start, start + 5);
}

// ── Code Modal ──────────────────────────────────
let currentModalCode = '';

function openCodeModal(title, code, output = '') {
  currentModalCode = code;
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalCode').innerHTML = highlight(code);
  document.getElementById('modalOutput').style.display = 'none';
  document.getElementById('outputContent').textContent = '';

  if (output) {
    document.getElementById('modalOutput').style.display = 'block';
    document.getElementById('outputContent').textContent = output;
  }

  document.getElementById('codeModal').classList.add('open');
}

function closeModal() {
  document.getElementById('codeModal').classList.remove('open');
}

// ── Copy ────────────────────────────────────────
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => showToast('✅ Copiado al portapapeles'));
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Init ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Theme
  if (state.lightMode) document.body.classList.add('light');

  // Initial render
  renderPage('home');
  updateNav('home');
  updateProgress();
  updateBottomNav();

  // ── Event Listeners ───────────────────────────
  // Nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Next / Prev
  document.getElementById('nextBtn').addEventListener('click', () => {
    const idx = PAGE_ORDER.indexOf(state.currentPage);
    if (idx < PAGE_ORDER.length - 1) navigateTo(PAGE_ORDER[idx + 1]);
  });

  document.getElementById('prevBtn').addEventListener('click', () => {
    const idx = PAGE_ORDER.indexOf(state.currentPage);
    if (idx > 0) navigateTo(PAGE_ORDER[idx - 1]);
  });

  // Sidebar toggle
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  const bottomNav = document.querySelector('.bottom-nav');

  document.getElementById('menuBtn').addEventListener('click', () => {
    sidebar.classList.toggle('closed');
    mainContent.classList.toggle('full-width');
    bottomNav.classList.toggle('full-width');
  });

  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebar.classList.add('closed');
    mainContent.classList.add('full-width');
    bottomNav.classList.add('full-width');
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', () => {
    state.lightMode = !state.lightMode;
    document.body.classList.toggle('light');
    localStorage.setItem('pymaestro-theme', state.lightMode ? 'light' : 'dark');
    document.getElementById('themeToggle').textContent = state.lightMode ? '☀️' : '🌙';
  });
  if (state.lightMode) document.getElementById('themeToggle').textContent = '☀️';

  // Modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('codeModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('copyCode').addEventListener('click', () => {
    copyText(currentModalCode);
  });

  document.getElementById('runCode').addEventListener('click', () => {
    const out = document.getElementById('modalOutput');
    const outContent = document.getElementById('outputContent');
    if (out.style.display === 'none' || !outContent.textContent) {
      out.style.display = 'block';
      outContent.textContent = '# Abre la terminal y ejecuta:\n# python ' + document.getElementById('modalTitle').textContent;
    } else {
      out.style.display = out.style.display === 'none' ? 'block' : 'none';
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight' && !e.target.closest('input, textarea')) {
      const idx = PAGE_ORDER.indexOf(state.currentPage);
      if (idx < PAGE_ORDER.length - 1) navigateTo(PAGE_ORDER[idx + 1]);
    }
    if (e.key === 'ArrowLeft' && !e.target.closest('input, textarea')) {
      const idx = PAGE_ORDER.indexOf(state.currentPage);
      if (idx > 0) navigateTo(PAGE_ORDER[idx - 1]);
    }
  });

  // Mobile check
  if (window.innerWidth < 768) {
    sidebar.classList.add('closed');
    mainContent.classList.add('full-width');
    bottomNav.classList.add('full-width');
  }
});
