# Guía de UX y Diseño - PIO Tracker

## Principios de Diseño GCBA

### 1. Accesibilidad Universal

**Estándares:**
- Cumplimiento de WCAG 2.1 AA
- Contraste mínimo 4.5:1 para texto normal
- Contraste mínimo 3:1 para texto grande
- Navegación por teclado completa
- Compatibilidad con lectores de pantalla

**Implementación:**
```typescript
// Ejemplo de componente accesible
<button
  aria-label="Enviar carga para revisión"
  aria-describedby="carga-description"
  onClick={handleEnviar}
  disabled={!isValid}
>
  Enviar para Revisión
</button>
```

### 2. Diseño Responsivo

**Breakpoints:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1439px
- Large: 1440px+

**Grid System:**
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 0 2rem;
  }
}
```

### 3. Consistencia Visual

**Sistema de Espaciado:**
- Base unit: 8px
- Espaciado: 8px, 16px, 24px, 32px, 48px, 64px
- Márgenes internos: 16px, 24px
- Márgenes externos: 24px, 32px

## Paleta de Colores GCBA

### Colores Primarios

```css
:root {
  /* Azul GCBA */
  --gcba-blue: #0066CC;
  --gcba-blue-light: #3388DD;
  --gcba-blue-dark: #004499;
  
  /* Verde GCBA */
  --gcba-green: #00AA88;
  --gcba-green-light: #33BB99;
  --gcba-green-dark: #008866;
  
  /* Naranja GCBA */
  --gcba-orange: #FF6600;
  --gcba-orange-light: #FF8833;
  --gcba-orange-dark: #CC5500;
}
```

### Colores de Estado

```css
:root {
  /* Estados de carga */
  --estado-borrador: #6C757D;
  --estado-pendiente: #FFC107;
  --estado-validado: #28A745;
  --estado-observado: #FD7E14;
  --estado-rechazado: #DC3545;
  
  /* Estados de sistema */
  --success: #28A745;
  --warning: #FFC107;
  --error: #DC3545;
  --info: #17A2B8;
}
```

### Colores Neutros

```css
:root {
  --white: #FFFFFF;
  --gray-50: #F8F9FA;
  --gray-100: #E9ECEF;
  --gray-200: #DEE2E6;
  --gray-300: #CED4DA;
  --gray-400: #ADB5BD;
  --gray-500: #6C757D;
  --gray-600: #495057;
  --gray-700: #343A40;
  --gray-800: #212529;
  --black: #000000;
}
```

## Tipografía

### Fuente Principal: Archivo

**Importación:**
```css
@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap');
```

**Sistema de Tipografía:**
```css
:root {
  /* Tamaños de fuente */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  
  /* Pesos de fuente */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Alturas de línea */
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

**Aplicación:**
```css
body {
  font-family: 'Archivo', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: var(--font-size-base);
  line-height: var(--line-height-normal);
  font-weight: var(--font-weight-normal);
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Archivo', sans-serif;
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
}

h1 { font-size: var(--font-size-4xl); }
h2 { font-size: var(--font-size-3xl); }
h3 { font-size: var(--font-size-2xl); }
h4 { font-size: var(--font-size-xl); }
h5 { font-size: var(--font-size-lg); }
h6 { font-size: var(--font-size-base); }
```

## Componentes Base

### 1. Botones

**Variantes:**
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 8px;
  font-family: 'Archivo', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.5;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px; /* Accesibilidad */
}

.btn-primary {
  background-color: var(--gcba-blue);
  color: var(--white);
}

.btn-primary:hover {
  background-color: var(--gcba-blue-dark);
}

.btn-secondary {
  background-color: var(--gray-100);
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
}

.btn-danger {
  background-color: var(--error);
  color: var(--white);
}

.btn-success {
  background-color: var(--success);
  color: var(--white);
}
```

### 2. Campos de Formulario

**Input Base:**
```css
.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--gray-300);
  border-radius: 8px;
  font-family: 'Archivo', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  transition: border-color 0.2s ease;
  min-height: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--gcba-blue);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

.form-input.error {
  border-color: var(--error);
}

.form-input.success {
  border-color: var(--success);
}
```

**Label:**
```css
.form-label {
  display: block;
  margin-bottom: 8px;
  font-family: 'Archivo', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: var(--gray-700);
}

.form-label.required::after {
  content: ' *';
  color: var(--error);
}
```

### 3. Tarjetas

**Tarjeta Base:**
```css
.card {
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  border: 1px solid var(--gray-200);
}

.card-header {
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.card-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-800);
  margin: 0;
}
```

### 4. Tablas

**Tabla Base:**
```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Archivo', sans-serif;
}

.table th {
  background-color: var(--gray-50);
  padding: 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: var(--gray-700);
  border-bottom: 2px solid var(--gray-200);
}

.table td {
  padding: 16px;
  border-bottom: 1px solid var(--gray-200);
  font-size: 14px;
  color: var(--gray-600);
}

.table tbody tr:hover {
  background-color: var(--gray-50);
}
```

## Estados de Carga

### Badges de Estado

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-estado-borrador {
  background-color: var(--estado-borrador);
  color: var(--white);
}

.badge-estado-pendiente {
  background-color: var(--estado-pendiente);
  color: var(--gray-800);
}

.badge-estado-validado {
  background-color: var(--estado-validado);
  color: var(--white);
}

.badge-estado-observado {
  background-color: var(--estado-observado);
  color: var(--white);
}

.badge-estado-rechazado {
  background-color: var(--estado-rechazado);
  color: var(--white);
}
```

## Navegación

### Sidebar

**Estructura:**
```css
.sidebar {
  width: 280px;
  background: var(--white);
  border-right: 1px solid var(--gray-200);
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid var(--gray-200);
}

.sidebar-nav {
  padding: 16px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: var(--gray-600);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: var(--gray-50);
  color: var(--gcba-blue);
}

.nav-item.active {
  background-color: var(--gcba-blue);
  color: var(--white);
}

.nav-item-icon {
  margin-right: 12px;
  width: 20px;
  height: 20px;
}
```

### Header

**Estructura:**
```css
.header {
  height: 64px;
  background: var(--white);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-800);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
```

## Layouts

### Dashboard Layout

```css
.dashboard-layout {
  display: flex;
  min-height: 100vh;
}

.dashboard-main {
  flex: 1;
  margin-left: 280px;
  background-color: var(--gray-50);
}

.dashboard-content {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}
```

### Form Layout

```css
.form-layout {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px;
}

.form-section {
  background: var(--white);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-section-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--gray-800);
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--gray-200);
}
```

## Responsive Design

### Mobile First

```css
/* Mobile (320px - 767px) */
.container {
  padding: 0 16px;
}

.sidebar {
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.sidebar.open {
  transform: translateX(0);
}

.dashboard-main {
  margin-left: 0;
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) {
  .container {
    padding: 0 24px;
  }
  
  .sidebar {
    transform: translateX(0);
  }
  
  .dashboard-main {
    margin-left: 280px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .container {
    padding: 0 32px;
  }
}
```

## Accesibilidad

### Focus Management

```css
/* Estilos de focus visibles */
*:focus {
  outline: 2px solid var(--gcba-blue);
  outline-offset: 2px;
}

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--gcba-blue);
  color: var(--white);
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-link:focus {
  top: 6px;
}
```

### ARIA Labels

```typescript
// Ejemplos de uso de ARIA
<div role="main" aria-label="Contenido principal">
  <h1 id="page-title">Dashboard</h1>
  
  <nav aria-labelledby="page-title">
    <ul role="menubar">
      <li role="menuitem">
        <a href="/carga" aria-current="page">Carga de Indicadores</a>
      </li>
    </ul>
  </nav>
  
  <table aria-label="Lista de cargas">
    <thead>
      <tr>
        <th scope="col">Indicador</th>
        <th scope="col">Período</th>
        <th scope="col">Estado</th>
      </tr>
    </thead>
  </table>
</div>
```

## Iconografía

### Sistema de Iconos

**Recomendaciones:**
- Usar iconos consistentes (Heroicons, Lucide, o similar)
- Tamaños estándar: 16px, 20px, 24px, 32px
- Colores que contrasten con el fondo
- Iconos decorativos deben ser marcados como `aria-hidden="true"`

**Implementación:**
```typescript
interface IconProps {
  size?: 16 | 20 | 24 | 32;
  className?: string;
  'aria-hidden'?: boolean;
}

const Icon: React.FC<IconProps> = ({ size = 20, className, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      {...props}
    >
      {/* Icon path */}
    </svg>
  );
};
```

## Microinteracciones

### Transiciones

```css
/* Transiciones suaves */
.fade-in {
  animation: fadeIn 0.3s ease-in;
}

.slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Hover effects */
.card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}
```

### Loading States

```css
.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--gray-200);
  border-top: 2px solid var(--gcba-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.skeleton {
  background: linear-gradient(90deg, var(--gray-200) 25%, var(--gray-100) 50%, var(--gray-200) 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

## Testing de Usabilidad

### Checklist de Accesibilidad

- [ ] Navegación por teclado completa
- [ ] Contraste de colores adecuado
- [ ] Textos alternativos en imágenes
- [ ] Etiquetas ARIA apropiadas
- [ ] Estructura de encabezados correcta
- [ ] Formularios accesibles
- [ ] Compatibilidad con lectores de pantalla

### Checklist de UX

- [ ] Jerarquía visual clara
- [ ] Consistencia en componentes
- [ ] Feedback visual apropiado
- [ ] Mensajes de error claros
- [ ] Estados de carga visibles
- [ ] Navegación intuitiva
- [ ] Responsive design funcional

## Implementación en Next.js

### Configuración de Tailwind

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gcba: {
          blue: '#0066CC',
          'blue-light': '#3388DD',
          'blue-dark': '#004499',
          green: '#00AA88',
          orange: '#FF6600',
        },
        estado: {
          borrador: '#6C757D',
          pendiente: '#FFC107',
          validado: '#28A745',
          observado: '#FD7E14',
          rechazado: '#DC3545',
        }
      },
      fontFamily: {
        'archivo': ['Archivo', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    }
  },
  plugins: [],
}
```

### Componente de Layout

```typescript
// components/Layout.tsx
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
```

Esta guía proporciona las bases para implementar un diseño consistente, accesible y profesional que siga los estándares de GCBA, manteniendo la usabilidad y la experiencia del usuario como prioridades principales.








