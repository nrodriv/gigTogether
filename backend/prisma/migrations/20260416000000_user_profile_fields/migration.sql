-- AlterTable: add profile fields to User
ALTER TABLE "User" ADD COLUMN "profilePicture" TEXT;
ALTER TABLE "User" ADD COLUMN "currentSong" TEXT;
ALTER TABLE "User" ADD COLUMN "musicGenres" TEXT[] NOT NULL DEFAULT '{}';
