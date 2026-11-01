# Histórico legado do SQLite

Estas migrations foram arquivadas na mudança para PostgreSQL e são mantidas apenas como referência. O Prisma usa o histórico ativo em `prisma/migrations`, iniciado pela migration `20261101175933_init_postgresql`.

O SQL deste arquivo histórico é específico do SQLite e não deve ser aplicado ao PostgreSQL. A migration inicial do PostgreSQL cria o schema atual; ela não transfere dados de um banco SQLite existente.
