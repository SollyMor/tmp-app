-- CreateTable
CREATE TABLE "DayMeeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "sortKey" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "DayMeeting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DayMeeting_userId_date_sortKey_idx" ON "DayMeeting"("userId", "date", "sortKey");
