-- CreateTable
CREATE TABLE "article_purchases" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "articleId" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "amount" INTEGER,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "article_purchases_userId_articleId_key" ON "article_purchases"("userId", "articleId");

-- AddForeignKey
ALTER TABLE "article_purchases" ADD CONSTRAINT "article_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_purchases" ADD CONSTRAINT "article_purchases_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "academy_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

