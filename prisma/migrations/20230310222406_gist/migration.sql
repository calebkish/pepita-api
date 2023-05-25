-- DropIndex
DROP INDEX "Food_indexedName_idx";

-- DropIndex
DROP INDEX "Recipe_name_idx";

-- CreateIndex
CREATE INDEX "Food_indexedName_idx" ON "Food" USING GIST ("indexedName" gist_trgm_ops(siglen=256));

-- CreateIndex
CREATE INDEX "Recipe_name_idx" ON "Recipe" USING GIST ("name" gist_trgm_ops(siglen=256));
