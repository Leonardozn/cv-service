# Generador de CV — cv-service

## 1. Owner

Leonardozn

## 2. Description

Este proyecto es el microservicio **cv-service** del sistema Generador de CV. Es dueño de todo el
contenido del CV (curriculum y sus entradas de formación, experiencia y certificados) y de los
catálogos configurables de habilidades (Skill) y diseños (Template). Renderiza ese contenido en
un PDF según el diseño elegido. Es autónomo: su lógica funciona aunque auth-service no esté
disponible; el único punto de acoplamiento con auth-service es un middleware de autenticación
enchufable que valida el token (siguiendo el Protocolo de autenticación de auth-service) antes de
servir las rutas protegidas.

## 3. Objective

Permitir a un usuario autenticado crear y editar su único curriculum y sus sub-entradas
(formación, experiencia, certificados), gestionar los catálogos (lectura pública; escritura solo
admin), y generar on-demand un PDF de su CV con el diseño elegido, limitando cada recurso a su
usuario dueño mediante el middleware de autenticación.

## 4. Task List

> Códigos de estado: ceñirse a lo que maneja `handle-errors` (201/200, 400, 401, 403, 404,
> 500, 502). Autorización RBAC: `requireAuth()` en rutas de usuario, `requireRole('admin')` en
> escritura de catálogos; admin es superconjunto de user. La subida de la foto usa el paquete
> base `file-manager`; las llamadas a auth-service (validar token) usan el paquete base
> `external-api-config`.

1. Definir y generar los modelos del módulo CurriculumManagement: `Curriculum`, `Education`,
   `Experience`, `Certificate`.
2. Definir y generar los modelos del módulo Catalog: `Skill`, `Template`.
3. Crear el paquete `@backend/pdf-generator` envolviendo `@react-pdf/renderer` (por
   `proc-no-new-packages`), consumido a través de su handler. (Necesario antes de generar el PDF.)
4. Implementar el middleware de autenticación (valida el token con auth-service vía
   `external-api-config`, inyecta el `user`; variantes `requireAuth` y `requireRole('admin')`).
5. Implementar el contrato: gestionar un Curriculum (CRUD estándar de `Curriculum`, con foto por
   `file-manager`).
6. Implementar el contrato: gestionar entradas de `Education` / `Experience` / `Certificate`
   (CRUD estándar).
7. Implementar el contrato: obtener/administrar los catálogos `Skill` y `Template` (lectura
   pública; escritura solo admin).
8. Implementar el contrato: generar el PDF (`POST /curriculum/:id/generate-pdf`) — usa
   `@backend/pdf-generator`.
9. Implementar la lógica de negocio — CurriculumManagement → Guardar Datos del Curriculum.
10. Implementar la lógica de negocio — Catalog → Autocompletar Habilidades y Elegir Diseño.
11. Implementar la lógica de negocio — Catalog → Administrar Catálogos (admin).
12. Implementar la lógica de negocio — PdfGeneration → Generar el PDF del CV.

## 5. Artifacts

| Artefacto           | Tipo                     | Dueño / Usado por             |
| ------------------- | ------------------------ | ----------------------------- |
| cv-service          | Microservicio propio     | —                             |
| cv-db (MongoDB)     | Base de datos            | cv-service                    |

> auth-service es un proyecto aparte; cv-service lo consume solo a través del Protocolo de
> autenticación (`POST /auth/validate`) vía el paquete base `external-api-config`. El cv-client
> (frontend) también tiene su propio proyecto. Ver el DOCUMENTATION.md de la raíz del workspace
> para su detalle.

## 6. Artifact Objectives

### cv-service (Microservicio propio)
Es dueño del contenido del CV y de los catálogos de habilidades y diseños. Renderiza el contenido
en un PDF según el diseño elegido. Es autónomo; el único acoplamiento con auth-service es el
middleware de autenticación enchufable que valida el token y limita cada CV a su usuario dueño
antes de servir el recurso.

### cv-db (Base de datos)
Almacena el curriculum de cada usuario y sus entradas de formación, experiencia y certificados,
más los catálogos configurables Skill y Template.

## 7. Artifact Contracts

### Convención de códigos de estado (easy-node)

Manejados por el paquete `handle-errors`: **201** create; **200** demás y acciones custom; **400**
validación/regla custom; **404** no encontrado (curriculum inexistente o ajeno); **401** no
autenticado; **403** prohibido (no dueño / sin rol admin); **500/502** error/upstream.

### Protocolo de autenticación (consumido desde auth-service)

cv-service NO es dueño de este protocolo; lo consume. Cada solicitud protegida lleva
`Authorization: Bearer <token>`. El **middleware de autenticación** de cv-service reenvía el token
a `POST /auth/validate` de auth-service (vía `external-api-config`), recibe el `user` (con `role`)
e inyecta el contexto; nunca interpreta el token localmente. Variantes: `requireAuth()` (cualquier
usuario válido) y `requireRole('admin')` (rutas exclusivas de admin). Bajo acoplamiento: una ruta
sin middleware se sirve sin validar. Fail closed ante token ausente/inválido/expirado o
auth-service caído.

### Contrato: cv-service valida un token de sesión con auth-service
- Caller: cv-service · Callee: auth-service
- `POST /auth/validate` — Request `{ token: <string> }`; Response `{ ..., content: { user } }` (200)
  o `content: null` (401). El token sale del header `Authorization: Bearer <token>`.
- Failure handling: si auth-service no responde en 5s, reintentar una vez; si el reintento
  también falla, rechazar como no autorizada (fail closed). Un fallo de Axios no manejado surge
  como 502.

### Contrato: el cv-client gestiona un Curriculum vía cv-service
- CRUD estándar de `Curriculum` (`POST/GET/GET :id/PATCH/DELETE /curriculum`). La foto se envía
  como file upload (paquete `file-manager`); se guarda su nombre en `Curriculum.photo`.
- Requiere `Authorization: Bearer <token>` (middleware `requireAuth`); resultados limitados al
  usuario autenticado. Máximo un Curriculum por usuario.
- Respuesta: `{ ..., content: <Curriculum> | [<Curriculum>] }`.

### Contrato: el cv-client gestiona entradas de Education / Experience / Certificate vía cv-service
- CRUD estándar de `Education`, `Experience`, `Certificate`; cada entrada referencia su Curriculum
  padre. Requiere `Authorization: Bearer <token>`; se confirma que el Curriculum padre pertenece
  al usuario autenticado.
- Respuesta: `{ ..., content: <Entry> | [<Entry>] }`.

### Contrato: el cv-client obtiene los catálogos (Skill, Template) vía cv-service
- Lectura estándar `GET /skill` y `GET /template` (pública, sin rol). Escritura
  (`POST`/`PATCH`/`DELETE` de `Skill` y `Template`) requiere rol admin (`requireRole('admin')`).
  Excepción: el alta automática de una habilidad nueva al guardar un CV la hace el propio servicio,
  sin requerir admin.
- Respuesta: `{ ..., content: [<Skill>] | [<Template>] }`.

### Contrato: el cv-client solicita la generación del PDF vía cv-service
- `POST /curriculum/:id/generate-pdf` (acción personalizada)
- Request: `{ template: <id de Template> }` (si se omite, usa el Template activo por defecto). El
  id va en la ruta; el token en el header.
- Respuesta: el PDF renderizado como descarga binaria (`Content-Type: application/pdf`), on-demand
  y sin persistir (no hay historial). Error: `content: null` con 401 si la sesión es inválida, o
  404 si el curriculum no existe o no es de quien llama.

## 8. Data Models

### cv-service

#### Módulo: CurriculumManagement

##### Curriculum
Máximo un Curriculum por usuario (`user` único). `user` guarda solo el id del `User` de
auth-service (referencia por id entre servicios; cv-service nunca consulta auth-db, resuelve la
identidad validando el token). `photo` almacena solo el nombre del archivo subido (file upload).

| Campo          | Tipo             | Requerido | Descripción                                              |
| -------------- | ---------------- | --------- | -------------------------------------------------------- |
| id             | id               | sí        | Identificador único del curriculum                       |
| user           | reference → User | sí        | Dueño, único (id del User en auth-service)               |
| fullName       | string           | sí        | Nombre completo mostrado como título del CV              |
| headline       | array of string  | sí        | Frases cortas bajo el nombre (rol, foco, años de experiencia...); el PDF las dibuja unidas con "\|", igual que cuando era un único string escrito a mano |
| city           | string           | sí        | Ciudad / ubicación (Datos personales)                    |
| photo          | string           | no        | Nombre de archivo de la foto de perfil (file upload)     |
| profileSummary | string           | sí        | Texto libre del "Perfil"                                 |
| skills         | array of string  | no        | Habilidades del sidebar (texto libre; Skill solo sugiere)|
| contactLinks   | array of object  | no        | Enlaces de contacto/redes bajo Datos personales          |
| createdAt      | datetime         | sí        | Fecha de creación                                        |
| updatedAt      | datetime         | sí        | Fecha de última actualización                            |

###### Curriculum.contactLinks (cada entrada)

| Campo | Tipo   | Requerido | Descripción                                    |
| ----- | ------ | --------- | ---------------------------------------------- |
| label | string | sí        | Etiqueta del enlace (p. ej., LinkedIn, GitHub) |
| url   | string | sí        | La URL o usuario del enlace                    |

##### Education

| Campo       | Tipo                   | Requerido | Descripción                                   |
| ----------- | ---------------------- | --------- | --------------------------------------------- |
| id          | id                     | sí        | Identificador único de la entrada de formación|
| curriculum  | reference → Curriculum | sí        | Curriculum padre                              |
| title       | string                 | sí        | Título del grado / programa                   |
| institution | string                 | sí        | Nombre de la institución                      |
| startDate   | date                   | sí        | Fecha de inicio                               |
| endDate     | date                   | no        | Fecha de fin (vacío = en curso)               |

##### Experience

| Campo       | Tipo                   | Requerido | Descripción                                    |
| ----------- | ---------------------- | --------- | ---------------------------------------------- |
| id          | id                     | sí        | Identificador único de la entrada de experiencia|
| curriculum  | reference → Curriculum | sí        | Curriculum padre                               |
| position    | string                 | sí        | Cargo / rol                                    |
| company     | string                 | sí        | Empresa / empleador                            |
| location    | string                 | no        | Ciudad / país del empleo                       |
| startDate   | date                   | sí        | Fecha de inicio                                |
| endDate     | date                   | no        | Fecha de fin (vacío = empleo actual)           |
| description | string                 | sí        | Responsabilidades / logros                     |

##### Certificate

| Campo      | Tipo                   | Requerido | Descripción                       |
| ---------- | ---------------------- | --------- | --------------------------------- |
| id         | id                     | sí        | Identificador único del certificado|
| curriculum | reference → Curriculum | sí        | Curriculum padre                  |
| name       | string                 | sí        | Nombre del certificado / curso    |
| date       | date                   | sí        | Fecha de obtención                |

#### Módulo: Catalog

##### Skill
Catálogo configurable para autocompletar; crece con las habilidades nuevas que los usuarios escriben.

| Campo  | Tipo    | Requerido | Descripción                              |
| ------ | ------- | --------- | ---------------------------------------- |
| id     | id      | sí        | Identificador único de la habilidad      |
| name   | string  | sí        | Nombre de la habilidad (p. ej., Node.js) |
| active | boolean | sí        | Si se ofrece como sugerencia             |

##### Template
Catálogo configurable de diseños de CV; hoy un diseño (dos columnas del ejemplo).

| Campo       | Tipo    | Requerido | Descripción                                                  |
| ----------- | ------- | --------- | ------------------------------------------------------------ |
| id          | id      | sí        | Identificador único del diseño                               |
| name        | string  | sí        | Nombre visible (p. ej., "Clásico dos columnas")              |
| key         | string  | sí        | Clave técnica del componente de diseño react-pdf             |
| description | string  | no        | Descripción breve del diseño                                 |
| active      | boolean | sí        | Si el diseño está disponible para elegir                     |

## 9. Business Logic

### cv-service

#### Módulo: CurriculumManagement
Usa: Curriculum, Education, Experience, Certificate, Skill, (referencia) User
Responsabilidad: Crear y editar el único curriculum del usuario y sus sub-entradas, limitando
cada registro a su User dueño (resuelto vía el Protocolo de autenticación).

#### Módulo: Catalog
Usa: Skill, Template
Responsabilidad: Mantener y exponer los catálogos. Lectura pública; escritura (alta/edición/baja
de Skill y Template) solo admin, salvo el alta automática de habilidades al guardar un CV.

#### Módulo: PdfGeneration
Usa: Curriculum, Education, Experience, Certificate, Template
Responsabilidad: Renderizar un curriculum en un PDF según el Template (usa `@backend/pdf-generator`
/ `@react-pdf/renderer`), on-demand y sin persistir historial.

#### Proceso: Guardar Datos del Curriculum
1. Recibe la solicitud con el token en el header `Authorization`.
2. El middleware (`requireAuth`) valida el token con auth-service e inyecta el `user`; token
   inválido → no autorizado.
3. Si el usuario ya tiene un Curriculum, actualiza ese; si no, crea el primero (máx. uno por usuario).
4. Si se incluye foto, se guarda (file-manager) y su nombre va en Curriculum.photo.
5. Curriculum o entrada se crea/actualiza en cv-db, referenciando siempre al User autenticado (o
   al Curriculum padre), nunca uno ajeno.
6. Por cada habilidad de `skills` que no exista en el catálogo Skill, se agrega una entrada activa.
7. Curriculum.updatedAt se refresca ante cualquier cambio.

Resultado: El curriculum/entrada persistido, o error de no autorizado/validación.

#### Proceso: Autocompletar Habilidades y Elegir Diseño
1. Catalog devuelve las Skill activas para las sugerencias (el usuario puede escribir libremente).
2. Catalog devuelve los Template activos para el selector de diseño.

Resultado: El formulario ofrece autocompletado y la lista de diseños.

#### Proceso: Administrar Catálogos (admin)
1. La ruta de escritura está protegida por `requireRole('admin')` (valida token + exige admin); un
   no-admin recibe 403.
2. Con admin validado, aplica alta/edición/baja sobre Skill o Template en cv-db.

Resultado: Catálogo actualizado, o error de autorización.

#### Proceso: Generar el PDF del CV
1. Recibe el id del curriculum, el id de Template (o el activo por defecto) y el token.
2. El middleware valida el token e inyecta el `user`; PdfGeneration confirma que el Curriculum es
   del User; si no, 404 (no encontrado para este usuario).
3. Carga el Curriculum y sus entradas (Education, Experience, Certificate) y resuelve el Template
   (su `key` indica qué componente de diseño react-pdf usar).
4. Renderiza el PDF con el componente del Template: sidebar (nombre, headline, foto, city,
   contactLinks, habilidades) y columna principal (Perfil, Formación, Experiencia, Certificados).
5. Devuelve el PDF como descarga binaria, sin persistir.

Resultado: Un PDF descargable con el diseño elegido, o 404 (no encontrado) si el curriculum no es
de quien llama.
