-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_leads" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome_perfil" TEXT NOT NULL,
    "link_perfil" TEXT NOT NULL,
    "whatsapp" TEXT,
    "plataforma_contato" TEXT NOT NULL DEFAULT 'Instagram',
    "segmento_nicho" TEXT,
    "data_primeiro_contato" DATETIME,
    "followup_1_data" DATETIME,
    "followup_1_confirmado" BOOLEAN NOT NULL DEFAULT false,
    "followup_2_data" DATETIME,
    "followup_2_confirmado" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "data_reuniao" DATETIME,
    "proposta_enviada" BOOLEAN NOT NULL DEFAULT false,
    "valor_proposta" REAL,
    "temperatura" TEXT NOT NULL DEFAULT 'MORNO',
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);
INSERT INTO "new_leads" ("atualizado_em", "criado_em", "data_primeiro_contato", "data_reuniao", "followup_1_data", "followup_2_data", "id", "link_perfil", "nome_perfil", "observacoes", "plataforma_contato", "proposta_enviada", "segmento_nicho", "status", "temperatura", "valor_proposta") SELECT "atualizado_em", "criado_em", "data_primeiro_contato", "data_reuniao", "followup_1_data", "followup_2_data", "id", "link_perfil", "nome_perfil", "observacoes", "plataforma_contato", "proposta_enviada", "segmento_nicho", "status", "temperatura", "valor_proposta" FROM "leads";
DROP TABLE "leads";
ALTER TABLE "new_leads" RENAME TO "leads";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
