# HR Integration AI Gateway
1. AI Integration 

Base URL : https://hrm.onephuket.co

Authentication
Header
  authorization : Hanuman_world_Token em_live_2d3ba59a_a4c5ed32e706d5b338f11ae03d5a7be4af933a154aeb261b
  Content-Type: application/json

## 1. Discover Modules
GET /api/integration/modules
ใช้สำหรับ
* แต่ละ Module รองรับ Action อะไร
## 2. Module Schema
GET /api/integration/schema
ใช้สำหรับ
* ดู Search Fields
* Filter Fields
* Sort Fields
* Primary Key
* Pagination

## 3. OpenAPI Specification
GET /api/integration/openapi
ใช้สำหรับ
* Open WebUI
* MCP
* LangChain
* Swagger
* AI Agent

## 4. Examples
GET /api/integration/examples
ใช้สำหรับ
* ดูตัวอย่าง Request Body
* ทุก Module
* ทุก Action

## 5. Health Check
GET /api/integration/health
ใช้สำหรับ
* ตรวจสอบ API
* Database
* Response Time

## 6. Query Gateway
POST /api/integration/query
ใช้ Query ข้อมูลทั้งหมด
ตัวอย่าง
```json
{
    "module":"employees",
    "action":"list"
}
```

```json
{
    "module":"employees",
    "action":"search",
    "search":"สมชาย"
}
```

```json
{
    "module":"employees",
    "action":"count"
}
```

```json
{
    "module":"employees",
    "action":"summary"
}
```

```json
{
    "module":"branches",
    "action":"list"
}
```





AI Start

↓

GET /api/integration/modules

↓

GET /api/integration/schema

↓

GET /api/integration/examples

↓

(ถ้ารองรับ OpenAPI)

GET /api/integration/openapi

↓

GET /api/integration/health

↓

POST /api/integration/query