# Lumen OS

**Sistema de Gestión Integral para Agencias Creativas**

Lumen OS es una plataforma todo-en-uno que centraliza la captación de clientes, CRM, gestión de proyectos, aprobación de entregables, facturación y portal del cliente.

---

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS v4 |
| Backend | API Routes (Next.js) + Prisma ORM |
| Base de Datos | PostgreSQL 16 |
| Auth | NextAuth.js v5 |
| Email | Resend |
| Notificaciones | Telegram Bot + Discord Webhooks |
| Automatización | n8n (self-hosted) |
| Infraestructura | Docker Compose |

---

## 🚀 Setup Rápido

### Requisitos
- Node.js 18+
- Docker Desktop
- Git

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/lumen-os.git
cd lumen-os
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Levantar la base de datos
```bash
docker compose up -d
```

### 4. Configurar variables de entorno
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

### 5. Inicializar la base de datos
```bash
npx prisma db push
npx prisma db seed
```

### 6. Iniciar el servidor de desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la landing page.  
Abre [http://localhost:3000/login](http://localhost:3000/login) para entrar al dashboard.

---

## 📁 Estructura del Proyecto

```
lumen-os/
├── app/                    # Páginas y API Routes (Next.js App Router)
│   ├── (public)/           # Landing page pública
│   ├── dashboard/          # Panel de administración (CRM)
│   ├── portal/[token]/     # Portal del cliente
│   └── api/                # Endpoints del backend
├── components/             # Componentes React reutilizables
│   ├── crm/                # Kanban, filtros, pipelines
│   ├── portal/             # Componentes del portal del cliente
│   ├── sections/           # Secciones de la landing page
│   └── ui/                 # Design system base
├── lib/                    # Utilidades y servicios
├── prisma/                 # Schema y migraciones de la BD
├── types/                  # Definiciones TypeScript
└── docker-compose.yml      # Infraestructura (PostgreSQL)
```

---

## 📄 Licencia

Privado — © 2026 Lumen Creativo. Todos los derechos reservados.
