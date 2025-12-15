# Sistema ANDON - Backend

API REST y servidor de comunicaciones en tiempo real para la gestión y monitorización de líneas de producción industrial.

## Descripción

El backend del sistema ANDON es una aplicación desarrollada con Node.js y Express que proporciona servicios de API REST, comunicación WebSocket en tiempo real y gestión de conexiones TCP con PLCs industriales. Actúa como intermediario entre la interfaz de usuario, la base de datos y los dispositivos de planta.

El sistema es capaz de conectarse simultáneamente hasta con 30 PLCs mediante comunicación TCP, con scripts adaptables a diferentes marcas industriales como Keyence, Allen-Bradley y Siemens, permitiendo la integración flexible en diversos entornos de manufactura sin requerir conexión Wi-Fi o internet.

## Tecnologías

- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **Socket.IO** - Comunicación bidireccional en tiempo real
- **PostgreSQL/MySQL** - Base de datos relacional
- **TCP/IP** - Protocolo de comunicación con PLCs
- **dotenv** - Gestión de variables de entorno

## Estructura del Proyecto

```
├── Config/ # Configuración del sistema
│ ├── connection.js # Conexión a base de datos
├── Helpers/ # Funciones utilitarias
│ ├── formatters.js # Formateo de datos
│ ├── plc_estatus.js # Script plc
| └── plc.js # Script plc
├── Middlewares/ # Middlewares de Express
├── Controllers/ # Lógica de negocio
├── Routes.js # Definición de endpoints
├── App.js # Configuración de la aplicación
├── Server.js # Punto de entrada del servidor
├── package.json # Dependencias y scripts
└── .env # Variables de entorno
```

## Requisitos Previos

- Node.js >= 16.x
- npm o yarn
- PostgreSQL >= 12.x o MySQL >= 8.x
- Acceso de red a los PLCs (TCP)
- Puertos disponibles para servidor HTTP y Socket.IO

## Instalación

1. Clonar el repositorio:

```
git clone https://github.com/Bigpotatozz/Andon-system-back.git
cd andon-backend
```

2. Instalar dependencias:

```
npm install
```

3. Configurar variables de entorno:
   Crear un archivo `.env` en la raíz con las siguientes variables:

```
HOST=host
USER=user
PASSWORD=1234
DATABASE=database
PORT=3000
```

## Uso

### Modo desarrollo

```
npm run dev

o

npx nodemon app
```

## Características Principales

- **API REST**: Endpoints para gestión de líneas, estaciones, turnos y objetivos
- **WebSocket en tiempo real**: Transmisión instantánea de estados de producción
- **Comunicación multi-PLC**: Conexión simultánea hasta con 30 PLCs vía TCP
- **Compatibilidad multi-marca**: Scripts adaptables para Keyence, Allen-Bradley y Siemens
- **Gestión de turnos**: Control y seguimiento de turnos de producción
- **Métricas de producción**: Cálculo y almacenamiento de KPIs
- **Manejo de alarmas**: Detección y registro de paros y eventos
- **Operación offline**: Comunicación TCP sin dependencia de Wi-Fi o internet

## Endpoints

https://documenter.getpostman.com/view/18543040/2sB3dTtTkx

## Comunicación con PLCs

El sistema gestiona conexiones TCP persistentes con los PLCs mediante:

- Pool de conexiones con límite de 30 dispositivos simultáneos
- Scripts de comunicación adaptables por marca (Keyence, Allen-Bradley, Siemens)
- Reconexión automática ante pérdidas de conexión
- Buffer de datos para manejo de latencia
- Validación de integridad de mensajes TCP
- Registro de eventos y errores de comunicación

## Mantenimiento

- Ejecutar `npm update` periódicamente para actualizar dependencias
- Monitorear logs de conexiones PLC y errores de comunicación
- Realizar respaldos periódicos de la base de datos
- Revisar y optimizar consultas SQL según crecimiento de datos
- Actualizar scripts de PLC ante cambios de firmware
- Implementar rotación de logs para evitar saturación de disco

## Seguridad

- Validación de datos en todos los endpoints
- Autenticación mediante JWT (si aplica)
- Sanitización de inputs para prevenir inyección SQL
- Rate limiting en endpoints críticos
- CORS configurado para dominios autorizados
- Variables sensibles almacenadas en `.env`

## Troubleshooting

### Error de conexión a base de datos

Verificar credenciales en `.env` y que el servidor de base de datos esté activo.

### PLC no conecta

Revisar conectividad de red, IP, puerto y firewall. Validar script de comunicación para la marca específica.

### WebSocket desconectado

Verificar que el puerto esté abierto y el CORS configurado correctamente.

##

author: Oscar MG
