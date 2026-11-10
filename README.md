# Aslan AI

React / Express / tRPC / Drizzle starter, adapted from the Sandbox web-db-user template.

- `pnpm dev`: development server; honors `PORT` (default 3000).
- `pnpm build` / `pnpm start`: build and serve `dist/index.js` and `dist/public/`.
- `pnpm db:migrate`: apply checked-in migrations. `pnpm db:push`: generate and apply new schema changes.
- `pnpm check` / `pnpm test`: types and application tests.

Start with the Webdev skill's default-template guide. Platform login, storage, payments and service contracts live in its shared references; read the relevant capability before extending its helper.

`server/_core/publicConfig.ts` exposes only named public runtime values. Private keys stay server-side. The platform serves managed `/manus-storage/` assets; the application does not register a second proxy.

## Qwen3-4B Plus modeli

Aslan Plus, yerel Qwen3-4B sunucusuna bağlanabilir. Yaklaşık 7,6 GB olan model ağırlıkları GitHub’a yüklenmez; `models/QWEN3-4B.md` ve `scripts/download-qwen3-4b.sh` dosyaları Hugging Face’ten güvenli indirme yolunu açıklar.

Platform configuration is readable and editable through `webdev.config`. Default settings are initial values, not enforced constraints. The agent may modify the files, commands and configuration or follow the flexible guide for another stack.
