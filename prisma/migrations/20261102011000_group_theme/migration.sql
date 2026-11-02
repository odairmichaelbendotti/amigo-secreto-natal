-- Existing groups keep their original appearance until a theme is selected.
ALTER TABLE "Group" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'none';
