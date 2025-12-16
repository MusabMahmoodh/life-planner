# Postman Collection for Smart Life Planner API

## Files

- **`Smart-Life-Planner-API.postman_collection.json`** - Main API collection
- **`Smart-Life-Planner-Local.postman_environment.json`** - Local development environment

## Import Instructions

### 1. Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop `Smart-Life-Planner-API.postman_collection.json`
4. Or click **Upload Files** and select the file

### 2. Import Environment

1. Click **Import** button
2. Drag and drop `Smart-Life-Planner-Local.postman_environment.json`
3. Or click **Upload Files** and select the file

### 3. Select Environment

1. In the top-right corner, click the environment dropdown
2. Select **"Smart Life Planner - Local"**

### 4. Configure Auth Token

1. Click the **eye icon** next to the environment dropdown
2. Click **Edit** on the environment
3. Set `authToken` to your Supabase JWT token
4. Save the environment

## Getting a JWT Token

To get a valid Supabase JWT token for testing:

### Option 1: From Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **Authentication** > **Users**
3. Create a test user or use existing
4. Use Supabase client to sign in and get the token

### Option 2: Via Supabase Client (Node.js)

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

async function getToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'your-password',
  });

  console.log('Token:', data.session.access_token);
}

getToken();
```

### Option 3: For Development (Bypass Auth)

During development, you can temporarily disable auth in `app.module.ts`:

```typescript
// Comment out the global auth guard for testing
// {
//   provide: APP_GUARD,
//   useClass: AuthGuard,
// },
```

## Collection Structure

```
Smart Life Planner API/
├── Goals/
│   ├── Generate Goal (AI)
│   ├── Generate Goal - Fitness Example
│   ├── Generate Goal - Minimal
│   ├── List Goals
│   ├── List Goals - Active Only
│   ├── List Goals - Paginated
│   └── Get Goal by ID
├── Tasks/
│   ├── Complete Task
│   ├── Complete Task - No Duration
│   └── Skip Task
├── Adaptations/
│   ├── List Adaptations for Goal
│   ├── List Adaptations - Suggested Only
│   ├── Accept Adaptation
│   ├── Reject Adaptation
│   └── Rollback Adaptation
├── Error Cases/
│   ├── Generate Goal - Missing Required Fields
│   ├── Generate Goal - Invalid Enum
│   ├── Get Goal - Not Found
│   ├── Complete Task - Not Found
│   ├── Complete Task - Invalid Duration
│   └── Unauthorized Request
├── Test Flows/
│   └── Flow: Create Goal → Complete Tasks → Check Adaptations/
│       ├── 1. Generate Goal
│       ├── 2. Complete First Task
│       ├── 3. Skip Second Task
│       ├── 4. Get Goal Details
│       └── 5. Check for Adaptations
└── Health Check/
    └── Health Check
```

## Testing Workflow

### Quick Test

1. Run **"Generate Goal (AI)"** - Creates a goal and saves IDs
2. Run **"Get Goal by ID"** - Verify goal was created
3. Run **"Complete Task"** - Mark a task as done
4. Run **"List Adaptations for Goal"** - Check if any adaptations proposed

### Full Flow Test

1. Open **"Test Flows"** folder
2. Run the folder (right-click → Run folder)
3. This executes all steps in sequence and validates responses

## Variables

The collection automatically saves these variables from responses:

| Variable        | Set By              | Description             |
| --------------- | ------------------- | ----------------------- |
| `goalId`        | Generate/List Goals | Current goal UUID       |
| `taskId`        | Generate/Get Goal   | Current task UUID       |
| `adaptationId`  | List Adaptations    | Current adaptation UUID |
| `flowGoalId`    | Test Flow           | Goal ID for flow test   |
| `flowTaskId1-3` | Test Flow           | Task IDs for flow test  |

## Rate Limits

- **POST /goals/generate**: 5 requests per 60 seconds per user
- Other endpoints: No rate limiting

## Common Errors

| Status | Meaning          | Solution                                     |
| ------ | ---------------- | -------------------------------------------- |
| 401    | Unauthorized     | Check authToken is valid                     |
| 400    | Validation Error | Check request body matches schema            |
| 404    | Not Found        | Check the ID exists and belongs to your user |
| 429    | Rate Limited     | Wait before retrying /goals/generate         |

## API Summary

| Method | Endpoint                    | Description                  |
| ------ | --------------------------- | ---------------------------- |
| POST   | `/goals/generate`           | Generate AI goal with tasks  |
| GET    | `/goals`                    | List user's goals            |
| GET    | `/goals/:id`                | Get goal details with tasks  |
| PATCH  | `/tasks/:id/complete`       | Complete a task              |
| PATCH  | `/tasks/:id/skip`           | Skip a task                  |
| GET    | `/adaptations/:goalId`      | List adaptations for goal    |
| POST   | `/adaptations/:id/accept`   | Accept adaptation            |
| POST   | `/adaptations/:id/reject`   | Reject adaptation            |
| POST   | `/adaptations/:id/rollback` | Rollback accepted adaptation |
