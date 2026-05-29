# SWSAI Document Hub

Full-stack document management dashboard built with React, Node.js, Express, and MongoDB with real-time WebSocket notifications.

## Features

- **Single & Bulk PDF Upload** - Upload up to 20 files per request
- **Client-side PDF Filtering** - Only PDF files allowed
- **Upload Progress Bar** - Real-time progress tracking with loading states
- **Document Management** - Store, preview, download, and delete PDFs
- **Real-time Notifications** - WebSocket-powered instant updates across all clients
- **Metadata Storage** - Document information stored in MongoDB
- **Responsive UI** - White and blue dashboard with Livvic font

## Run Locally

```bash
npm run install:all
npm run dev
```

- **Client:** `http://localhost:3000`
- **Server:** `http://localhost:5001`

The server reads MongoDB configuration from `Backend/.env`.

---

## Database Schema & ERD

### Entity Relationship Diagram

```
┌─────────────────────┐         ┌──────────────────────┐
│     Document        │         │   Notification       │
├─────────────────────┤         ├──────────────────────┤
│ _id (ObjectId)      │◄────────│ _id (ObjectId)       │
│ docId (UUID)        │   1:N   │ message (String)     │
│ name (String)       │         │ type (String)        │
│ type (String)       │         │ read (Boolean)       │
│ size (Number)       │         │ createdAt (Date)     │
│ fileId (ObjectId)   │         │                      │
│ uploadDate (Date)   │         │                      │
│ uploadMode (String) │         │                      │
└─────────────────────┘         └──────────────────────┘
```

### Document Collection Schema

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  docId: String,                    // Unique identifier (UUID v4)
  name: String,                     // Original filename
  type: String,                     // MIME type (application/pdf)
  size: Number,                     // File size in bytes
  fileId: ObjectId,                 // GridFS file reference
  uploadDate: Date,                 // ISO 8601 timestamp
  uploadMode: String,               // "single" or "bulk"
  __v: 0                            // Version (disabled)
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | MongoDB auto-generated ID |
| `docId` | UUID | Yes | Unique document identifier |
| `name` | String | Yes | Original PDF filename |
| `type` | String | Yes | MIME type (always `application/pdf`) |
| `size` | Number | Yes | File size in bytes (max 25MB) |
| `fileId` | ObjectId | Yes | Reference to GridFS file storage |
| `uploadDate` | Date | Yes | Timestamp when uploaded |
| `uploadMode` | String | No | Upload mode: "single" or "bulk" |

**Indexes:**
```javascript
// docId is unique (prevents duplicate uploads)
docId: { type: String, unique: true, required: true }

// Sort documents by upload date (newest first)
uploadDate: { type: Date, default: Date.now, required: true }
```

**Example Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "docId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Financial_Report_2024.pdf",
  "type": "application/pdf",
  "size": 2048576,
  "fileId": "507f1f77bcf86cd799439012",
  "uploadDate": "2024-05-29T10:30:45.123Z",
  "uploadMode": "bulk"
}
```

---

### Notification Collection Schema

```javascript
{
  _id: ObjectId,                    // MongoDB auto-generated ID
  message: String,                  // Notification content
  type: String,                     // "info", "success", "warning", "error"
  read: Boolean,                    // Read status
  createdAt: Date,                  // ISO 8601 timestamp
  __v: 0                            // Version (disabled)
}
```

**Field Descriptions:**

| Field | Type | Enum | Required | Description |
|-------|------|------|----------|-------------|
| `_id` | ObjectId | - | Yes | MongoDB auto-generated ID |
| `message` | String | - | Yes | Notification text content |
| `type` | String | info, success, warning, error | No | Notification type (default: "info") |
| `read` | Boolean | - | Yes | Whether user has read it (default: false) |
| `createdAt` | Date | - | Yes | Auto-timestamp on creation |

**Indexes:**
```javascript
// Sort by creation date (newest first)
createdAt: { type: Date, default: Date.now, required: true }

// Query unread notifications
read: { type: Boolean, default: false, required: true }
```

**Example Notifications:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "message": "2 documents uploaded successfully.",
    "type": "success",
    "read": false,
    "createdAt": "2024-05-29T10:30:45.123Z"
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "message": "Financial_Report_2024.pdf was deleted.",
    "type": "info",
    "read": true,
    "createdAt": "2024-05-29T10:25:20.456Z"
  }
]
```

---

### Data Flow & Relationships

```
┌─────────────────────────────────────────────────────────┐
│              User Uploads PDF                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  Frontend Validation  │ (PDF type check)
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  POST /api/documents │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Backend Validation    │ (size, count, format)
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    ┌─────────┐         ┌──────────────┐
    │ GridFS  │         │ Document     │
    │ Storage │         │ Collection   │
    │ (PDFs)  │         │ (Metadata)   │
    └────┬────┘         └──────┬───────┘
         │                     │
         └──────────┬──────────┘
                    │
                    ▼
        ┌──────────────────────────┐
        │ Create Notification      │ (Success message)
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ Notification Collection  │
        └──────────┬───────────────┘
                   │
                   ▼
        ┌──────────────────────────┐
        │ WebSocket Broadcast      │
        │ (to all connected        │
        │  clients)                │
        └──────────┬───────────────┘
                   │
        ┌──────────┴──────────────┬──────────────┐
        │                         │              │
        ▼                         ▼              ▼
    Browser 1              Browser 2        Browser 3
    Update UI              Update UI         Update UI
    Display Doc            Display Doc       Display Doc
    Instantly              Instantly         Instantly
```

---

### API Endpoints & Data Schema

#### POST `/api/documents/upload`
**Request:**
```
Content-Type: multipart/form-data
Body: FormData { documents: [File, File, ...] }
```

**Response (201):**
```json
{
  "message": "2 documents uploaded successfully.",
  "documents": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "docId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Report.pdf",
      "type": "application/pdf",
      "size": 2048576,
      "fileId": "507f1f77bcf86cd799439012",
      "uploadDate": "2024-05-29T10:30:45.123Z",
      "uploadMode": "bulk"
    }
  ],
  "notifications": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "message": "2 documents uploaded successfully.",
      "type": "success",
      "read": false,
      "createdAt": "2024-05-29T10:30:45.123Z"
    }
  ]
}
```

#### GET `/api/documents`
**Response (200):**
```json
{
  "documents": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "docId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Report.pdf",
      "type": "application/pdf",
      "size": 2048576,
      "fileId": "507f1f77bcf86cd799439012",
      "uploadDate": "2024-05-29T10:30:45.123Z",
      "uploadMode": "bulk"
    }
  ]
}
```
(Returns max 50 documents, sorted by `uploadDate` newest first)

#### DELETE `/api/documents/:docId`
**Response (200):**
```json
{
  "message": "Document deleted successfully.",
  "docId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "notification": {
    "_id": "507f1f77bcf86cd799439014",
    "message": "Report.pdf was deleted.",
    "type": "info",
    "read": false,
    "createdAt": "2024-05-29T10:35:10.789Z"
  }
}
```

#### GET `/api/notifications`
**Response (200):**
```json
{
  "notifications": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "message": "2 documents uploaded successfully.",
      "type": "success",
      "read": false,
      "createdAt": "2024-05-29T10:30:45.123Z"
    }
  ]
}
```
(Returns max 50 notifications, sorted by `createdAt` newest first)

---

### WebSocket Events Schema

#### Event: `documents-uploaded`
**Emitted by:** `POST /api/documents/upload`
**Broadcast to:** All connected clients
```json
{
  "documents": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "docId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Report.pdf",
      "type": "application/pdf",
      "size": 2048576,
      "fileId": "507f1f77bcf86cd799439012",
      "uploadDate": "2024-05-29T10:30:45.123Z",
      "uploadMode": "bulk"
    }
  ],
  "notification": {
    "_id": "507f1f77bcf86cd799439013",
    "message": "2 documents uploaded successfully.",
    "type": "success",
    "read": false,
    "createdAt": "2024-05-29T10:30:45.123Z"
  },
  "uploadMode": "bulk"
}
```

#### Event: `document-deleted`
**Emitted by:** `DELETE /api/documents/:docId`
**Broadcast to:** All connected clients
```json
{
  "docId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "notification": {
    "_id": "507f1f77bcf86cd799439014",
    "message": "Report.pdf was deleted.",
    "type": "info",
    "read": false,
    "createdAt": "2024-05-29T10:35:10.789Z"
  }
}
```

#### Event: `notification-created`
**Emitted by:** `POST /api/notifications`
**Broadcast to:** All connected clients
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "message": "Custom notification message",
  "type": "info",
  "read": false,
  "createdAt": "2024-05-29T10:40:25.000Z"
}
```

#### Event: `notifications-marked-read`
**Emitted by:** `PATCH /api/notifications/read`
**Broadcast to:** All connected clients
```json
{
  "success": true
}
```

#### Event: `notifications-cleared`
**Emitted by:** `DELETE /api/notifications`
**Broadcast to:** All connected clients
```json
{
  "success": true
}
```

---

### Data Constraints & Validation

**Document Upload Constraints:**
- Max file size: 25 MB per file
- Max files per upload: 20 files
- Allowed type: `application/pdf` only
- Filename: Preserved from original
- UUID generation: v4 random (ensures uniqueness)

**Notification Constraints:**
- Message: Required, trimmed (min 1 character)
- Type: Must be one of: `info`, `success`, `warning`, `error`
- Read: Boolean (default: false)

**Query Limits:**
- Documents fetch: Max 50 per request
- Notifications fetch: Max 50 per request
- Sorting: By date descending (newest first)
