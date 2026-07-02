-- CreateTable
CREATE TABLE "leads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_perfil" TEXT NOT NULL,
    "link_perfil" TEXT NOT NULL,
    "plataforma_contato" TEXT NOT NULL DEFAULT 'IG',
    "segmento_nicho" TEXT,
    "data_primeiro_contato" DATETIME,
    "followup_1_data" DATETIME,
    "followup_2_data" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "data_reuniao" DATETIME,
    "proposta_enviada" BOOLEAN NOT NULL DEFAULT false,
    "valor_proposta" REAL,
    "temperatura" TEXT NOT NULL DEFAULT 'MORNO',
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "opcoes_segmento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "opcoes_plataforma" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "interacoes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lead_id" INTEGER NOT NULL,
    "data" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT,
    CONSTRAINT "interacoes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "playbook_categorias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criavel_pelo_usuario" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "playbook_scripts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoria_id" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "playbook_scripts_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "playbook_categorias" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "opcoes_segmento_nome_key" ON "opcoes_segmento"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "opcoes_plataforma_nome_key" ON "opcoes_plataforma"("nome");
