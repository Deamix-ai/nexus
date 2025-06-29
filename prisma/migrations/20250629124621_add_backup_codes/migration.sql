-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "avatar" TEXT,
    "password" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "backupCodes" TEXT NOT NULL DEFAULT '[]',
    "passwordResetToken" TEXT,
    "passwordResetExpires" DATETIME,
    "role" TEXT NOT NULL,
    "showroomId" TEXT,
    "permissions" TEXT NOT NULL DEFAULT '{}',
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "users_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "showrooms" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("avatar", "createdAt", "deletedAt", "email", "emailVerified", "firstName", "id", "isActive", "lastLogin", "lastName", "password", "passwordResetExpires", "passwordResetToken", "permissions", "phone", "preferences", "role", "showroomId", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "username") SELECT "avatar", "createdAt", "deletedAt", "email", "emailVerified", "firstName", "id", "isActive", "lastLogin", "lastName", "password", "passwordResetExpires", "passwordResetToken", "permissions", "phone", "preferences", "role", "showroomId", "twoFactorEnabled", "twoFactorSecret", "updatedAt", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
