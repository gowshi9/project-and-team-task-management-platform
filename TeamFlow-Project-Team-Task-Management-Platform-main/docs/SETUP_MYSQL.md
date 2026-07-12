# Setup local MySQL for TeamFlow

MySQL80 is expected on `localhost:3306`.

## 1. Create database (as root)

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS teamflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Optional dedicated user:

```sql
CREATE USER IF NOT EXISTS 'teamflow'@'localhost' IDENTIFIED BY 'teamflow';
GRANT ALL PRIVILEGES ON teamflow.* TO 'teamflow'@'localhost';
FLUSH PRIVILEGES;
```

## 2. Configure backend/.env

```env
DATABASE_URL="mysql://teamflow:teamflow@localhost:3306/teamflow"
# or
DATABASE_URL="mysql://root:YOUR_ROOT_PASSWORD@localhost:3306/teamflow"
JWT_SECRET="replace-with-a-long-secret"
JWT_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="http://localhost:3000"
NODE_ENV=development
```

## 3. Migrate and seed

From `backend/` (prefer `E:\project\teamflow\backend` on Windows):

```bash
npm run prisma:generate
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

Avoid `npx prisma` if your folder path contains `&`.

## Docker alternative

If Docker Desktop works:

```bash
docker compose up -d
```

Then use:

```env
DATABASE_URL="mysql://teamflow:teamflow@localhost:3306/teamflow"
```
