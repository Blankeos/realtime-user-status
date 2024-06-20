-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "createdTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedTimestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdTimestamp", "id", "passwordHash", "updatedTimestamp", "username") SELECT "createdTimestamp", "id", "passwordHash", "updatedTimestamp", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
