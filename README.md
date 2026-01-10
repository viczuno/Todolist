# TodoList Project

## Съдържание

1. [Общ Преглед](#общ-преглед)
2. [Архитектура](#архитектура)
3. [Технологичен Стек](#технологичен-стек)
4. [Компоненти на Системата](#компоненти-на-системата)
5. [Инсталация и Настройка](#инсталация-и-настройка)
6. [API Документация](#api-документация)
7. [База Данни](#база-данни)
8. [Сигурност и Автентикация](#сигурност-и-автентикация)
9. [Deployment](#deployment)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Използване](#използване)
12. [Troubleshooting](#troubleshooting)

---

## Общ Преглед

**TodoList Project** е модерно микросервизно приложение за управление на задачи (Todo Lists), вдъхновено от Todoist. Проектът имплементира пълноценна система за управление на задачи с акцент върху сигурност, скалируемост и съвременни DevOps практики.

### Основни Характеристики

- 🔐 **Сигурна автентикация** чрез GitHub OAuth 2.0
- 🎫 **JWT базирана авторизация** с refresh token механизъм
- 👥 **Role-based access control (RBAC)** - Reader, Writer, Admin роли
- 📝 **REST API** за основни CRUD операции
- 🔄 **GraphQL API** като facade за по-гъвкави заявки
- 🗄️ **PostgreSQL** база данни с миграции
- 🌐 **SAP UI5** базиран потребителски интерфейс
- ☸️ **Kubernetes deployment** с Istio service mesh
- 🔄 **CI/CD pipeline** с GitHub Actions
- 🐳 **Docker containerization** на всички компоненти

### Бизнес Функционалности

1. **Управление на Todo Списъци**
    - Създаване, редактиране и изтриване на списъци
    - Споделяне на списъци с други потребители
    - Три нива на видимост: Private, Shared, Public
    - Добавяне на тагове към списъци

2. **Управление на Задачи (Todos)**
    - Създаване, редактиране и изтриване на задачи
    - Маркиране на задачи като завършени
    - Приоритети: Low, Medium, High
    - Срокове и начални дати
    - Възлагане на задачи на потребители
    - Тагове за организация

3. **Колаборация**
    - Споделяне на списъци с колеги
    - Три нива на достъп: Reader, Writer, Admin
    - Система за покани и одобрение
    - Управление на колаборатори

---

## Архитектура

### Микросервизна Архитектура

Проектът следва микросервизен архитектурен модел с ясно разделение на отговорностите:

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    UI Service (SAP UI5)                      │
│                    Port: 80 (Nginx)                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              GraphQL Server (Go + gqlgen)                    │
│                    Port: 8000                                │
│              - Schema validation                             │
│              - Request aggregation                           │
│              - REST API facade                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              REST API Server (Go + Gin)                      │
│                    Port: 5000                                │
│              - Business logic                                │
│              - Authentication/Authorization                  │
│              - Data validation                               │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL Database                             │
│                    Port: 5432                                │
│              - Data persistence                              │
│              - Relational integrity                          │
└─────────────────────────────────────────────────────────────┘
```

### Kubernetes Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Istio Ingress Gateway                     │
│                    (Port 8000 exposed)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐    ┌──────────┐    ┌──────────┐
    │   UI   │    │ GraphQL  │    │   REST   │
    │  Pod   │    │   Pod    │    │   Pod    │
    └────────┘    └──────────┘    └─────┬────┘
                                         │
                                         ▼
                                  ┌──────────┐
                                  │ Postgres │
                                  │   Pod    │
                                  └──────────┘
```

### Слоева Архитектура (REST Service)

```
┌─────────────────────────────────────────┐
│         HTTP Layer (Routers)            │
│  - Route definitions                    │
│  - Request/Response handling            │
│  - Middleware integration               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  - Business logic                       │
│  - Data validation                      │
│  - Authorization checks                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Repository Layer                │
│  - Database queries                     │
│  - Data mapping                         │
│  - Transaction management               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Database Layer                  │
│  - PostgreSQL                           │
│  - Schema management                    │
└─────────────────────────────────────────┘
```

---

## Технологичен Стек

### Backend

#### REST API Service
- **Език**: Go 1.21+
- **Web Framework**: Gin
- **Database Driver**: pgx (PostgreSQL)
- **Authentication**: OAuth2, JWT
- **Configuration**: envconfig, godotenv
- **Logging**: Structured logging

#### GraphQL Service
- **Език**: Go 1.21+
- **GraphQL Framework**: gqlgen
- **HTTP Client**: Standard Go http client
- **Schema**: GraphQL SDL (Schema Definition Language)

### Frontend

- **Framework**: SAP UI5
- **Web Server**: Nginx
- **UI Components**: SAP Fiori design system
- **Routing**: SAP UI5 Router

### Database

- **RDBMS**: PostgreSQL 14+
- **Migrations**: golang-migrate
- **Connection Pooling**: pgx pool

### Infrastructure

- **Containerization**: Docker
- **Orchestration**: Kubernetes (k3d)
- **Service Mesh**: Istio 1.20+
- **Package Manager**: Helm 3
- **Local Cluster**: k3d (k3s in Docker)

### DevOps & CI/CD

- **CI/CD**: GitHub Actions
- **Code Quality**: SonarCloud
- **Security Scanning**: Snyk
- **Linting**: golangci-lint
- **Container Registry**: Docker Hub

---

## Компоненти на Системата

### 1. REST API Service (`todoservice`)

**Местоположение**: `/todoservice`

#### Структура

```
todoservice/
├── cmd/
│   └── main.go                 # Entry point
├── internal/
│   ├── db/                     # Database connection
│   ├── http/                   # HTTP server & routers
│   ├── lists/                  # Lists domain
│   │   ├── repository.go       # DB operations
│   │   ├── service.go          # Business logic
│   │   └── handlers.go         # HTTP handlers
│   ├── todos/                  # Todos domain
│   ├── users/                  # Users domain
│   └── oauth2/                 # OAuth2 handlers
├── pkg/
│   ├── jwt/                    # JWT utilities
│   ├── log/                    # Logging
│   ├── models/                 # Data models
│   └── constants/              # Constants
├── Dockerfile
└── go.mod
```

#### Основни Функции

**Authentication & Authorization**
- GitHub OAuth2 login flow
- JWT token generation
- Refresh token mechanism
- Role-based middleware
- Tenant isolation

**Lists Management**
- CRUD операции за списъци
- Visibility control (private/shared/public)
- Owner management
- Tag support

**Todos Management**
- CRUD операции за задачи
- Priority management
- Due dates and start dates
- Task assignment
- Completion tracking

**Users Management**
- User profile management
- Role assignment
- List access management

#### API Endpoints

**Authentication**
```
GET  /login/github               # Initiate OAuth flow
GET  /login/github/callback      # OAuth callback
POST /auth/refresh               # Refresh access token
GET  /logout                     # Logout user
```

**Lists**
```
GET    /lists                    # Get all accessible lists
GET    /lists/:id                # Get specific list
POST   /lists                    # Create new list
PUT    /lists/:id                # Update list
DELETE /lists/:id                # Delete list
POST   /lists/:id/access         # Grant access to user
DELETE /lists/:id/access/:userId # Remove access
```

**Todos**
```
GET    /todos                    # Get all todos
GET    /todos/:id                # Get specific todo
POST   /todos                    # Create new todo
PUT    /todos/:id                # Update todo
DELETE /todos/:id                # Delete todo
PATCH  /todos/:id/complete       # Mark as completed
```

**Users**
```
GET    /users                    # Get all users (admin)
GET    /users/:id                # Get user by ID
GET    /users/me                 # Get current user
PUT    /users/:id                # Update user
```

### 2. GraphQL Service (`graphqlServer`)

**Местоположение**: `/graphqlServer`

#### Структура

```
graphqlServer/
├── cmd/
│   └── main.go                 # Entry point
├── internal/
│   ├── graph/
│   │   └── schema.graphqls     # GraphQL schema
│   ├── resolvers/              # Query/Mutation resolvers
│   │   ├── root_resolver.go
│   │   ├── query_resolver.go
│   │   ├── mutation_resolver.go
│   │   └── directives.go       # Custom directives
│   ├── client/
│   │   └── todoservice.go      # REST API client
│   ├── converters/             # Data converters
│   └── server/
│       └── server.go           # HTTP server setup
├── generated/                  # Generated code (gqlgen)
├── gqlgen.yml                  # gqlgen configuration
└── Dockerfile
```

#### GraphQL Schema

**Types**
```graphql
type User {
  id: ID!
  email: String!
  githubID: String!
  role: UserRole!
  createdAt: String!
  updatedAt: String!
}

type List {
  id: ID!
  name: String!
  description: String
  owner: User!
  visibility: Visibility!
  tags: [String!]
  createdAt: String!
  updatedAt: String!
  todos: [Todo!]!
  collaborators: [ListAccess!]!
}

type Todo {
  id: ID!
  list: List!
  title: String!
  description: String
  completed: Boolean!
  dueDate: String
  startDate: String
  priority: Priority
  tags: [String!]
  assignedTo: User
  createdAt: String!
  updatedAt: String!
}
```

**Queries**
```graphql
type Query {
  # Users
  users: [User!]!
  user(id: ID!): User
  userByEmail: User
  usersByList(id: ID!): [User!]!

  # Lists
  lists: [List!]!
  list(id: ID!): List
  listsGlobal: [List!]!
  listsPending: [List!]!
  listsAccepted: [List!]!

  # Todos
  todos: [Todo!]!
  todo(id: ID!): Todo
  todosGlobal: [Todo!]!
  todosByList(id: ID!): [Todo!]!

  # Access
  getListAccesses(listId: ID!): [ListAccess!]!
}
```

**Mutations**
```graphql
type Mutation {
  # User mutations
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): User!

  # List mutations
  createList(input: CreateListInput!): List!
  updateList(id: ID!, input: UpdateListInput!): List!
  deleteList(id: ID!): List!

  # Todo mutations
  createTodo(input: CreateTodoInput!): Todo!
  updateTodo(id: ID!, input: UpdateTodoInput!): Todo!
  completeTodo(id: ID!): Todo!
  deleteTodo(id: ID!): Todo!

  # Access mutations
  addListAccess(input: GrantListAccessInput!): ListAccess!
  removeListAccess(listId: ID!): ListAccess!
  acceptList(listId: ID!): Boolean
  removeCollaborator(listId: ID!, userId: ID!): ListAccess!
}
```

#### Custom Directives

**@validate** - Валидация на входни данни
```graphql
directive @validate(type: String!) on INPUT_FIELD_DEFINITION

input CreateUserInput {
  email: String! @validate(type: "email")
  githubId: String!
  role: UserRole!
}
```

### 3. UI Service (`ui`)

**Местоположение**: `/ui`

#### Структура

```
ui/
├── webapp/
│   ├── controller/             # UI Controllers
│   │   ├── App.controller.js
│   │   ├── Login.controller.js
│   │   ├── Lists.controller.js
│   │   ├── TodoDetails.controller.js
│   │   └── Settings.controller.js
│   ├── view/                   # XML Views
│   │   ├── App.view.xml
│   │   ├── Login.view.xml
│   │   ├── Lists.view.xml
│   │   └── TodoDetails.view.xml
│   ├── css/                    # Stylesheets
│   ├── util/                   # Utilities
│   ├── formatter/              # Data formatters
│   ├── Component.js            # UI5 Component
│   ├── manifest.json           # App descriptor
│   └── index.html              # Entry point
├── nginx.conf                  # Nginx configuration
├── Dockerfile
└── package.json
```

#### Функционалности

**Login Page**
- GitHub OAuth initiation
- Error handling
- Redirect after login

**Lists View**
- Списък на всички списъци
- Филтриране по visibility
- Създаване на нов списък
- Редактиране на списък
- Изтриване на списък
- Покани на колаборатори

**Todo Details View**
- Списък на задачи в селектиран списък
- Създаване на нова задача
- Редактиране на задача
- Маркиране като завършена
- Изтриване на задача
- Възлагане на задача

**Settings View**
- User profile information
- Pending invitations
- Accept/Reject invitations

### 4. Database (`migrations`)

**Местоположение**: `/migrations`

#### Schema Overview

**Users Table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    github_id VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Lists Table**
```sql
CREATE TABLE lists (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES users(id),
    visibility VARCHAR(50) NOT NULL,
    tags JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Todos Table**
```sql
CREATE TABLE todos (
    id UUID PRIMARY KEY,
    list_id UUID REFERENCES lists(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMP,
    start_date TIMESTAMP,
    priority VARCHAR(50),
    tags JSONB,
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**List Access Table**
```sql
CREATE TABLE list_access (
    list_id UUID REFERENCES lists(id),
    user_id UUID REFERENCES users(id),
    access_level VARCHAR(50) NOT NULL,
    status VARCHAR(50),
    PRIMARY KEY (list_id, user_id)
);
```

**Refresh Tokens Table**
```sql
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Migrations

Проектът използва golang-migrate за управление на database миграции:

```
migrations/
├── 20240819110300_initial_schema.up.sql
├── 20240819110300_initial_schema.down.sql
├── 20240819121433_update_timestamp_trigger.up.sql
├── 20240819121433_update_timestamp_trigger.down.sql
├── 20241006064212_add_status_column_to_list_access.up.sql
├── 20241006064212_add_status_column_to_list_access.down.sql
├── 20241007083941_allow_null_assigned_to.up.sql
├── 20241007083941_allow_null_assigned_to.down.sql
├── 20241009095830_add_start_date_column.up.sql
├── 20241009095830_add_start_date_column.down.sql
├── 20241014115800_modify_start_and_due_date_columns.up.sql
├── 20241014115800_modify_start_and_due_date_columns.down.sql
├── 20241017111456_refresh_token.up.sql
└── 20241017111456_refresh_token.down.sql
```

---

## Инсталация и Настройка

### Prerequisites

Преди да започнете, уверете се че имате инсталирани:

- **Docker** (v20.10+)
- **k3d** (v5.0+)
- **kubectl** (v1.20+)
- **Helm** (v3.0+)
- **istioctl** (v1.20+)

### Стъпка 1: Клониране на Repository

```bash
git clone <your-repo-url>
cd Todolist
```

### Стъпка 2: Създаване на Configuration File

```bash
cp config.example.yaml config.yaml
```

### Стъпка 3: Настройка на GitHub OAuth Application

1. Отидете на [GitHub Developer Settings](https://github.com/settings/developers)
2. Кликнете **"New OAuth App"**
3. Попълнете детайлите:
    - **Application name**: TodoList App
    - **Homepage URL**: `http://localhost:8000`
    - **Authorization callback URL**: `http://localhost:8000/login/github/callback`
4. Копирайте **Client ID** и **Client Secret**

### Стъпка 4: Генериране на Security Keys

Използвайте скрипта:

```bash
chmod +x generate-keys.sh
./generate-keys.sh
```

Или ръчно:

```bash
# OAuth2 State
openssl rand -base64 32

# JWT Key
openssl rand -base64 32
```

### Стъпка 5: Конфигуриране на config.yaml

Редактирайте `config.yaml`:

```yaml
github:
  oauth:
    clientId: "YOUR_GITHUB_CLIENT_ID"
    clientSecret: "YOUR_GITHUB_CLIENT_SECRET"
    redirectUrl: "http://localhost:8000/login/github/callback"
    scopes: "read:org,user"
  organization: "YOUR_GITHUB_ORG"

security:
  oauth2State: "GENERATED_STATE"
  jwtKey: "GENERATED_JWT_KEY"

database:
  password: "YOUR_SECURE_PASSWORD"
```

### Стъпка 6: Стартиране на Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

Скриптът ще:
- Създаде k3d Kubernetes cluster
- Инсталира Istio service mesh
- Създаде необходимите namespaces
- Deploy-не всички компоненти
- Изпълни database миграции

### Стъпка 7: Проверка на Deployment

```bash
# Проверка на pods
kubectl get pods -n todoapp-system

# Проверка на services
kubectl get svc -n todoapp-system

# Проверка на Istio gateway
kubectl get gateway -n todoapp-system
```

### Стъпка 8: Достъп до Приложението

Отворете браузър на:
```
http://localhost:8000
```

---

## API Документация

### REST API

**Base URL**: `http://localhost:5000`

#### Authentication Flow

**1. Initiate OAuth Login**
```http
GET /login/github
```

Пренасочва към GitHub за authentication.

**2. OAuth Callback**
```http
GET /login/github/callback?code=<code>&state=<state>
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "writer"
  }
}
```

**3. Refresh Token**
```http
POST /auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGc..."
}
```

Response:
```json
{
  "access_token": "eyJhbGc...",
  "expires_in": 3600
}
```

#### Lists API

**Get All Lists**
```http
GET /lists
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": "uuid",
    "name": "Work Tasks",
    "description": "Tasks for work projects",
    "owner_id": "uuid",
    "visibility": "private",
    "tags": ["work", "important"],
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-01T10:00:00Z"
  }
]
```

**Create List**
```http
POST /lists
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Shopping List",
  "description": "Weekly shopping items",
  "visibility": "private",
  "tags": ["personal", "shopping"]
}
```

**Update List**
```http
PUT /lists/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "visibility": "shared"
}
```

**Delete List**
```http
DELETE /lists/:id
Authorization: Bearer <token>
```

**Grant List Access**
```http
POST /lists/:id/access
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "uuid",
  "access_level": "writer"
}
```

#### Todos API

**Get All Todos**
```http
GET /todos
Authorization: Bearer <token>
```

**Get Todos by List**
```http
GET /todos?list_id=<uuid>
Authorization: Bearer <token>
```

**Create Todo**
```http
POST /todos
Authorization: Bearer <token>
Content-Type: application/json

{
  "list_id": "uuid",
  "title": "Complete documentation",
  "description": "Write comprehensive docs",
  "priority": "high",
  "due_date": "2026-01-15T17:00:00Z",
  "tags": ["documentation", "urgent"]
}
```

**Update Todo**
```http
PUT /todos/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated title",
  "completed": true,
  "priority": "medium"
}
```

**Complete Todo**
```http
PATCH /todos/:id/complete
Authorization: Bearer <token>
```

**Delete Todo**
```http
DELETE /todos/:id
Authorization: Bearer <token>
```

### GraphQL API

**Endpoint**: `http://localhost:8000/graphql`

#### Example Queries

**Get All Lists with Todos**
```graphql
query {
  lists {
    id
    name
    description
    visibility
    owner {
      email
    }
    todos {
      id
      title
      completed
      priority
    }
  }
}
```

**Get Specific List**
```graphql
query GetList($id: ID!) {
  list(id: $id) {
    id
    name
    description
    todos {
      id
      title
      completed
      dueDate
      assignedTo {
        email
      }
    }
    collaborators {
      user {
        email
      }
      accessLevel
    }
  }
}
```

**Get Current User Info**
```graphql
query {
  userByEmail {
    id
    email
    role
    createdAt
  }
}
```

#### Example Mutations

**Create List**
```graphql
mutation CreateList($input: CreateListInput!) {
  createList(input: $input) {
    id
    name
    description
    visibility
  }
}

# Variables
{
  "input": {
    "name": "My New List",
    "description": "Description here",
    "visibility": "PRIVATE",
    "tags": ["work"]
  }
}
```

**Create Todo**
```graphql
mutation CreateTodo($input: CreateTodoInput!) {
  createTodo(input: $input) {
    id
    title
    priority
    dueDate
  }
}

# Variables
{
  "input": {
    "listId": "uuid",
    "title": "New Task",
    "description": "Task description",
    "priority": "HIGH",
    "dueDate": "2026-01-15T17:00:00Z"
  }
}
```

**Update Todo**
```graphql
mutation UpdateTodo($id: ID!, $input: UpdateTodoInput!) {
  updateTodo(id: $id, input: $input) {
    id
    title
    completed
  }
}

# Variables
{
  "id": "uuid",
  "input": {
    "completed": true,
    "priority": "MEDIUM"
  }
}
```

**Grant List Access**
```graphql
mutation AddListAccess($input: GrantListAccessInput!) {
  addListAccess(input: $input) {
    list {
      name
    }
    user {
      email
    }
    accessLevel
  }
}

# Variables
{
  "input": {
    "listId": "uuid",
    "userId": "uuid",
    "accessLevel": "WRITER"
  }
}
```

---

## База Данни

### Entity Relationship Diagram

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (PK)         │───┐
│ email           │   │
│ github_id       │   │
│ role            │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │
                      │ owner_id
                      │
┌─────────────────┐   │
│     LISTS       │◄──┘
├─────────────────┤
│ id (PK)         │───┐
│ name            │   │
│ description     │   │
│ owner_id (FK)   │   │ list_id
│ visibility      │   │
│ tags            │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
        │             │
        │             │
        │ list_id     │
        │             │
        ▼             ▼
┌─────────────────┐ ┌─────────────────┐
│     TODOS       │ │  LIST_ACCESS    │
├─────────────────┤ ├─────────────────┤
│ id (PK)         │ │ list_id (PK,FK) │
│ list_id (FK)    │ │ user_id (PK,FK) │
│ title           │ │ access_level    │
│ description     │ │ status          │
│ completed       │ └─────────────────┘
│ due_date        │
│ start_date      │
│ priority        │
│ tags            │
│ assigned_to(FK) │───┐
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │
        ┌─────────────┘
        │ user_id
        ▼
┌─────────────────────┐
│  REFRESH_TOKENS     │
├─────────────────────┤
│ id (PK)             │
│ user_id (FK)        │
│ token               │
│ expires_at          │
│ created_at          │
└─────────────────────┘
```

### Индекси

```sql
-- Lists
CREATE INDEX idx_lists_owner_id ON lists(owner_id);
CREATE INDEX idx_lists_visibility ON lists(visibility);

-- Todos
CREATE INDEX idx_todos_list_id ON todos(list_id);
CREATE INDEX idx_todos_assigned_to ON todos(assigned_to);
CREATE INDEX idx_todos_completed ON todos(completed);

-- List Access
CREATE INDEX idx_list_access_user_id ON list_access(user_id);
CREATE INDEX idx_list_access_status ON list_access(status);

-- Refresh Tokens
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### Triggers

**Automatic Updated_at Timestamp**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at 
    BEFORE UPDATE ON lists 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at 
    BEFORE UPDATE ON todos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Сигурност и Автентикация

### OAuth 2.0 Flow

```
┌─────────┐                                  ┌─────────┐
│         │                                  │         │
│  User   │                                  │ GitHub  │
│         │                                  │         │
└────┬────┘                                  └────┬────┘
     │                                            │
     │ 1. Click "Login with GitHub"              │
     │───────────────────────────────────────────►
     │                                            │
     │ 2. Redirect to GitHub OAuth               │
     │◄───────────────────────────────────────────
     │                                            │
     │ 3. GitHub Login & Authorization           │
     │───────────────────────────────────────────►
     │                                            │
     │ 4. Redirect with code                     │
     │◄───────────────────────────────────────────
     │                                            │
     │ 5. Exchange code for tokens               │
     │───────────────────────────────────────────►
     │                                            │
     │ 6. Return access_token & user info        │
     │◄───────────────────────────────────────────
     │                                            │
     │ 7. Store JWT & Refresh Token              │
     │                                            │
```

### JWT Token Structure

**Access Token** (valid 1 hour):
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "writer",
    "github_id": "12345",
    "exp": 1704988800,
    "iat": 1704985200
  }
}
```

**Refresh Token** (valid 7 days):
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "user_id": "uuid",
    "token_id": "uuid",
    "exp": 1705590000,
    "iat": 1704985200
  }
}
```

### Role-Based Access Control (RBAC)

#### Роли и Права

**Reader**
- ✅ Може да чете списъци, към които има достъп
- ✅ Може да чете задачи в списъците
- ❌ Не може да променя списъци или задачи
- ❌ Не може да създава нови списъци

**Writer**
- ✅ Всички права на Reader
- ✅ Може да създава нови списъци
- ✅ Може да променя и изтрива задачи в списъци, към които има достъп
- ✅ Може да добавя потребители към списъци, които е създал
- ❌ Не може да променя списъци, които не притежава

**Admin**
- ✅ Всички права на Writer
- ✅ Може да чете и променя всички списъци
- ✅ Може да управлява всички потребители
- ✅ Може да изтрива всякакви ресурси

#### List-Level Access Control

Всеки списък може да има допълнителни колаборатори:

- **List Owner** - пълен контрол
- **List Reader** - само четене
- **List Writer** - четене и писане
- **List Admin** - пълен контрол като owner

### Security Best Practices

1. **Environment Variables** - Sensitive данни се съхраняват като environment variables
2. **HTTPS** - Production deployment използва TLS/SSL
3. **JWT Expiration** - Short-lived access tokens с refresh mechanism
4. **Password Hashing** - N/A (използваме OAuth)
5. **Input Validation** - Валидация на всички input данни
6. **SQL Injection Prevention** - Използване на prepared statements
7. **CORS Configuration** - Правилно конфигуриран CORS
8. **Rate Limiting** - Protection срещу brute force attacks (в production)

---

## Deployment

### Kubernetes Resources

#### Namespaces

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: todoapp-system
  labels:
    istio-injection: enabled
```

#### Deployments

**REST Service**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todoapp-rest
  namespace: todoapp-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: todoapp-rest
  template:
    metadata:
      labels:
        app: todoapp-rest
    spec:
      containers:
      - name: rest
        image: victoruzunov/todoapp-rest:project
        ports:
        - containerPort: 5000
        env:
        - name: DB_HOST
          value: "todoapp-postgres"
        - name: DB_PORT
          value: "5432"
        resources:
          limits:
            cpu: "1"
            memory: "256Mi"
          requests:
            cpu: "512m"
            memory: "128Mi"
```

**GraphQL Service**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todoapp-graphql
  namespace: todoapp-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: todoapp-graphql
  template:
    metadata:
      labels:
        app: todoapp-graphql
    spec:
      containers:
      - name: graphql
        image: victoruzunov/todoapp-graphql:project
        ports:
        - containerPort: 8000
```

**PostgreSQL**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: todoapp-postgres
  namespace: todoapp-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: todoapp-postgres
  template:
    metadata:
      labels:
        app: todoapp-postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

#### Services

```yaml
apiVersion: v1
kind: Service
metadata:
  name: todoapp-rest
  namespace: todoapp-system
spec:
  selector:
    app: todoapp-rest
  ports:
  - port: 5000
    targetPort: 5000

---
apiVersion: v1
kind: Service
metadata:
  name: todoapp-graphql
  namespace: todoapp-system
spec:
  selector:
    app: todoapp-graphql
  ports:
  - port: 8000
    targetPort: 8000

---
apiVersion: v1
kind: Service
metadata:
  name: todoapp-postgres
  namespace: todoapp-system
spec:
  selector:
    app: todoapp-postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### Istio Configuration

**Gateway**
```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: todoapp-gateway
  namespace: todoapp-system
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"
```

**VirtualService**
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: todoapp-routes
  namespace: todoapp-system
spec:
  hosts:
  - "*"
  gateways:
  - todoapp-gateway
  http:
  - match:
    - uri:
        prefix: "/graphql"
    route:
    - destination:
        host: todoapp-graphql
        port:
          number: 8000
  - match:
    - uri:
        prefix: "/api"
    route:
    - destination:
        host: todoapp-rest
        port:
          number: 5000
  - route:
    - destination:
        host: todoapp-ui
        port:
          number: 80
```

**mTLS Policy**
```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: todoapp-system
spec:
  mtls:
    mode: PERMISSIVE
```

### Helm Chart Structure

```
charts/todoapp/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── ingress-gateway.yaml
│   ├── mTLS.yaml
│   └── _helpers.tpl
└── charts/
    ├── rest/
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   └── templates/
    │       ├── deployment.yaml
    │       ├── service.yaml
    │       ├── configmap.yaml
    │       └── secret.yaml
    ├── graphql/
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   └── templates/
    │       ├── deployment.yaml
    │       └── service.yaml
    ├── postgres/
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   └── templates/
    │       ├── deployment.yaml
    │       ├── service.yaml
    │       ├── pvc.yaml
    │       └── migration-job.yaml
    └── ui/
        ├── Chart.yaml
        ├── values.yaml
        └── templates/
            ├── deployment.yaml
            └── service.yaml
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

Проектът използва GitHub Actions за CI/CD с следните jobs:

#### 1. Markdown Lint
```yaml
name: Markdown Check
on: [push]
jobs:
  markdown-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install markdownlint
        run: npm install -g markdownlint-cli
      - name: Lint README
        run: markdownlint README.md
```

#### 2. Lint and Format Check
- Проверява код форматиране с `gofmt`
- Проверява код quality с `golangci-lint`
- Отделни jobs за REST и GraphQL services

#### 3. Build
- Компилира Go кода
- Проверява за compilation errors
- Кеширане на dependencies

#### 4. SonarCloud Analysis
- Static code analysis
- Code quality metrics
- Security vulnerability detection
- Technical debt tracking

#### 5. Snyk Security Scan
- Dependency vulnerability scanning
- License compliance check
- Automatic PR creation за fixes

#### 6. Docker Build and Push
- Build на Docker images
- Tag-ване с commit SHA и branch name
- Push в Docker Hub registry

#### 7. Deploy to Kubernetes
- Автоматично deployment на успешен build
- Rolling update strategy
- Health checks

### Pipeline Flow

```
┌──────────────┐
│  Git Push    │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  Markdown Lint       │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Lint & Format       │
│  (REST + GraphQL)    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│  Build               │
│  (REST + GraphQL)    │
└──────┬───────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│  SonarCloud  │  │    Snyk      │
│   Analysis   │  │   Security   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
       ┌──────────────────┐
       │  Docker Build    │
       │  & Push          │
       └────────┬─────────┘
                │
                ▼
       ┌──────────────────┐
       │  Deploy to K8s   │
       └──────────────────┘
```

---

## Използване

### Стартиране на Приложението

**Метод 1: Автоматичен Setup**
```bash
./setup.sh
```

**Метод 2: Ръчен Setup**

1. Създаване на cluster:
```bash
k3d cluster create todoapp-cluster \
  --port 8000:80@loadbalancer \
  --wait
```

2. Инсталиране на Istio:
```bash
istioctl install --set profile=demo -y
```

3. Създаване на namespace:
```bash
kubectl create namespace todoapp-system
kubectl label namespace todoapp-system istio-injection=enabled
```

4. Deploy на приложението:
```bash
helm install todoapp ./charts/todoapp \
  --namespace todoapp-system \
  --set-file config=config.yaml
```

### Използване на UI

1. **Login**
    - Отворете `http://localhost:8000`
    - Кликнете "Login with GitHub"
    - Authorize приложението

2. **Създаване на List**
    - Click на "+" бутон
    - Въведете име и описание
    - Изберете visibility
    - Добавете tags (optional)

3. **Добавяне на Todos**
    - Кликнете на списък
    - Click на "Add Todo"
    - Попълнете детайлите
    - Set priority и due date

4. **Споделяне на List**
    - Отворете списък
    - Click на "Share"
    - Въведете email на потребител
    - Изберете access level

5. **Managing Tasks**
    - Check задача за да я маркирате като completed
    - Edit за да промените детайли
    - Assign на друг потребител
    - Delete за да изтриете

### Използване на GraphQL Playground

1. Отворете `http://localhost:8000/graphql`
2. Вижте schema в документацията
3. Пишете queries и mutations
4. Test различни scenarios

Example:
```graphql
query MyLists {
  lists {
    id
    name
    todos {
      title
      completed
    }
  }
}
```

### Използване на REST API

**С curl:**

```bash
# Login
curl http://localhost:8000/login/github

# Get Lists (след login)
curl -H "Authorization: Bearer <token>" \
     http://localhost:5000/lists

# Create List
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"My List","visibility":"private"}' \
     http://localhost:5000/lists

# Create Todo
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"list_id":"<uuid>","title":"Task 1","priority":"high"}' \
     http://localhost:5000/todos
```

**С Postman:**
1. Import collection
2. Set environment variables (token, base_url)
3. Execute requests

---

## Troubleshooting

### Common Issues

#### 1. Pods не стартират

**Problem**: Pods висят в Pending status

**Solution**:
```bash
# Проверка на pod status
kubectl describe pod <pod-name> -n todoapp-system

# Проверка на resources
kubectl top nodes

# Проверка на events
kubectl get events -n todoapp-system --sort-by='.lastTimestamp'
```

#### 2. Database Connection Failed

**Problem**: REST API не може да се свърже с PostgreSQL

**Solution**:
```bash
# Проверка на Postgres pod
kubectl logs -n todoapp-system -l app=todoapp-postgres

# Проверка на service
kubectl get svc -n todoapp-system todoapp-postgres

# Test connection
kubectl run -it --rm --restart=Never postgres-test \
  --image=postgres:14 \
  --namespace=todoapp-system \
  -- psql -h todoapp-postgres -U postgres
```

#### 3. OAuth Redirect Issues

**Problem**: GitHub OAuth redirect fails

**Solution**:
1. Проверете GitHub OAuth app settings
2. Verify redirect URL matches exactly
3. Check config.yaml settings
4. Restart REST pod

```bash
kubectl rollout restart deployment/todoapp-rest -n todoapp-system
```

#### 4. JWT Token Expired

**Problem**: API returns 401 Unauthorized

**Solution**:
- Use refresh token endpoint
- Login отново
- Check token expiration time

```bash
# Refresh token
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<token>"}' \
  http://localhost:5000/auth/refresh
```

#### 5. Istio Gateway Not Working

**Problem**: Cannot access application on port 8000

**Solution**:
```bash
# Check Istio installation
kubectl get pods -n istio-system

# Check gateway
kubectl get gateway -n todoapp-system

# Check virtual service
kubectl get virtualservice -n todoapp-system

# Port forward as fallback
kubectl port-forward -n todoapp-system \
  svc/todoapp-ui 8000:80
```

### Debugging Commands

**View Logs**
```bash
# REST API logs
kubectl logs -n todoapp-system -l app=todoapp-rest -f

# GraphQL logs
kubectl logs -n todoapp-system -l app=todoapp-graphql -f

# UI logs
kubectl logs -n todoapp-system -l app=todoapp-ui -f

# Postgres logs
kubectl logs -n todoapp-system -l app=todoapp-postgres -f
```

**Execute Commands in Pods**
```bash
# Access REST API container
kubectl exec -it -n todoapp-system \
  deployment/todoapp-rest -- /bin/sh

# Access Database
kubectl exec -it -n todoapp-system \
  deployment/todoapp-postgres -- psql -U postgres
```

**Check Resources**
```bash
# CPU and Memory usage
kubectl top pods -n todoapp-system

# Describe deployment
kubectl describe deployment todoapp-rest -n todoapp-system

# Get all resources
kubectl get all -n todoapp-system
```

### Clean Up

**Remove Application**
```bash
# Uninstall Helm release
helm uninstall todoapp -n todoapp-system

# Delete namespace
kubectl delete namespace todoapp-system
```

**Delete Cluster**
```bash
# Delete k3d cluster
k3d cluster delete todoapp-cluster
```

**Complete Cleanup**
```bash
# Stop and remove everything
k3d cluster delete todoapp-cluster
docker system prune -a
```

---

## Допълнителни Ресурси

### Документация

- [Go Documentation](https://golang.org/doc/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Istio Documentation](https://istio.io/latest/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [SAP UI5 Documentation](https://ui5.sap.com/)

### Свързани Файлове

- `SETUP_GUIDE.md` - Детайлна инструкция за setup
- `PIPELINE.md` - CI/CD pipeline документация
- `config.example.yaml` - Configuration template
- `README.md` - Project overview

### Контакти и Support

За въпроси и проблеми:
- Отворете Issue в GitHub repository
- Проверете existing issues за решения
- Консултирайте се с документацията

---

## Заключение

TodoList Project представлява пълноценно микросервизно приложение, което демонстрира съвременни best practices в областта на:

- **Software Architecture** - Микросервизна архитектура с ясно разделение
- **Security** - OAuth 2.0, JWT, RBAC
- **DevOps** - Containerization, Kubernetes, CI/CD
- **API Design** - RESTful и GraphQL APIs
- **Database Design** - Normalization, индекси, миграции
- **Frontend Development** - Modern UI framework

Проектът е готов за production deployment с малки модификации за конкретната production среда (SSL certificates, external database, monitoring, logging, etc.).

---

**Версия**: 1.0  
**Последна актуализация**: Януари 2026  
**Автор**: TodoList Project Team

