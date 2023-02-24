-- CreateIndex
CREATE INDEX "Food_name_idx" ON "Food" USING GIN ("name" gin_trgm_ops);
