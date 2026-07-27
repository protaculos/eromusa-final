# Estratégia — Admin Panel + Banco de Dados para Cenas

> Documento criado em 27/07/2026 para manter o contexto entre conversas.

---

## 1. Problema Resolvido

Atualmente os templates (cenas) são gerados estaticamente a partir de `src/data/styles.json` + pastas em `public/videos/`. Isso impede:

- Editar nome, créditos, style_id sem deploy
- Adicionar/remover cenas sem deploy
- Upload de vídeos de loop sem git
- Gerenciar categorias dinamicamente
- Controle de admin

**Solução:** Mover tudo pro Supabase (banco + storage) e criar painel admin.

---

## 2. Modelo de Dados (Supabase)

### Tabela: `profiles` (já existe — adicionar coluna)

```sql
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin'));
```

- `role = 'client'` → usuário comum
- `role = 'admin'` → acesso ao painel de admin
- Admin altera manualmente no Supabase Dashboard

### Tabela: `categories` (NOVA)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela: `scenes` (NOVA)

```sql
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER DEFAULT 10,
  style_id TEXT NOT NULL,
  loop_video_url TEXT NOT NULL,
  gradient TEXT DEFAULT 'from-orange-500 via-pink-500 to-purple-600',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabela: `category_scenes` (NOVA — relação N:N)

```sql
CREATE TABLE category_scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  "order" INTEGER DEFAULT 0,
  UNIQUE(category_id, scene_id)
);
```

**Por que N:N?** Uma mesma cena (ex: "Blowjob POV") pode aparecer em várias categorias ("Populares", "Blowjobs", "POV"). Com chave estrangeira direta na `scenes`, precisaria duplicar a cena.

### Bucket Storage: `scene-videos`

- Bucket público no Supabase Storage
- Pastas: `{scene_id}/video.webm`
- Política: leitura pública, escrita apenas por admin (via service_role)

---

## 3. Migração dos Dados Atuais

### O que migrar:
1. **Pastas em `public/videos/`** — cada pasta tem um `video.webm`
2. **`src/data/styles.json`** — contém `id` (style_id), `name`, `cost` (créditos)
3. **Categorias atuais** — as categorias fixas em `page.tsx` viram registros na tabela `categories`

### Script de migração (`scripts/migrate-scenes.ts`):

```typescript
// Para cada pasta em public/videos/:
//   1. Encontrar style correspondente em styles.json (pelo slug do nome)
//   2. Fazer upload do video.webm para Supabase Storage (bucket: scene-videos)
//   3. Criar registro na tabela scenes
//   4. Criar categorias iniciais e vincular cenas via category_scenes
```

### Categorias iniciais a criar:
- 🔥 Popular
- 🎯 Free
- Blowjob, Anal, Positions, Sex, Cum, Foot, Handjob, POV, Pussy, Tits, Pregnant, BBC, 69, Kissing, Squirt, Toys, Solo, Other

---

## 4. Fluxo Admin

### 4.1. Autenticação
- `AuthContext` expõe `isAdmin: boolean` baseado em `user.role === 'admin'`
- Admin é definido manualmente no Supabase Dashboard: `profiles.role = 'admin'`

### 4.2. Página Discovery — Admin vê:

#### Gear Icon ⚙️ em cada TemplateCard
- Só aparece se `isAdmin === true`
- Abre `SceneEditModal`

#### Botão "Nova Categoria" (+)
- Input de texto → cria categoria no banco
- Aparece no topo da página

#### Botão "Deletar Categoria" (🗑️)
- Só aparece ao passar o mouse na categoria
- Confirmação antes de deletar
- Ao deletar, desvincula as cenas (não deleta as cenas)

#### Botão "+" para adicionar cena à categoria
- Abre `AddScenePopup`

### 4.3. SceneEditModal (ao clicar na engrenagem)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | Text input | Nome da cena |
| Créditos | Number input | Quantidade de créditos |
| Style ID | Text input | Ex: `ulora_226` |
| Vídeo Loop | File upload | Upload de .webm para Supabase Storage |
| Deletar cena | Botão vermelho | Confirmação antes de deletar |

### 4.4. AddScenePopup (ao clicar "+" na categoria)

- **Topo:** Input "Criar Nova" + botão "Criar"
- **Abaixo:** Lista de TODAS as cenas existentes (com preview de vídeo)
- **Busca:** Filtra por nome
- **Clique:** Vincula a cena à categoria (insere em `category_scenes`)

---

## 5. Mudanças no Frontend

### Arquivos a criar:

| Arquivo | Descrição |
|---------|-----------|
| `src/components/admin/SceneEditModal.tsx` | Modal de edição de cena |
| `src/components/admin/AddScenePopup.tsx` | Popup para adicionar cena à categoria |
| `src/components/admin/CategoryManager.tsx` | Gerenciamento de categorias |
| `src/app/api/admin/categories/route.ts` | CRUD categorias |
| `src/app/api/admin/scenes/route.ts` | CRUD cenas |
| `src/app/api/admin/scenes/[id]/route.ts` | Update/delete cena |
| `src/app/api/admin/category-scenes/route.ts` | Vincular/desvincular cena-categoria |
| `src/app/api/scenes/route.ts` | Listar cenas (público) |
| `src/app/api/categories/route.ts` | Listar categorias (público) |
| `scripts/migrate-scenes.ts` | Script de migração |

### Arquivos a modificar:

| Arquivo | Mudança |
|---------|---------|
| `src/context/AuthContext.tsx` | Adicionar `isAdmin` e `role` |
| `src/app/page.tsx` | Buscar do Supabase em vez de `allTemplates` |
| `src/components/video/TemplateCard.tsx` | Gear icon para admin |
| `src/components/CarouselSection.tsx` | Botões de admin (add cena, del categoria) |
| `src/data/templates.ts` | Manter como fallback (ou remover depois) |
| `.gitignore` | Adicionar `public/videos/` |

---

## 6. API de Geração (LeakifyHub)

Atualmente a API de teste (`/api/generate`) envia `styleId` para o LeakifyHub.

**Fluxo futuro (API real):**
1. Cliente clica "Criar Vídeo"
2. Sistema pega o `style_id` da cena (ex: `ulora_226`)
3. Envia pra API real junto com a foto do usuário
4. API retorna o job ID

O `style_id` já está sendo salvo na cena — quando trocar pra API real, é só usar o mesmo campo.

---

## 7. Sugestões de Melhoria (futuro)

- [ ] **Ordenação drag-and-drop** de cenas dentro da categoria
- [ ] **Múltiplos admins** (basta setar `role = 'admin'` no banco)
- [ ] **Log de atividades** do admin
- [ ] **Preview em tempo real** do vídeo ao editar
- [ ] **Cache** das cenas (evitar fetch a cada load)
- [ ] **Página separada de admin** (`/admin`) com visão geral

---

## 8. Ordem de Implementação

1. ✅ Criar este documento de estratégia
2. ✅ Adicionar coluna `role` na tabela `profiles` (SQL em `scripts/001-schema.sql`)
3. ✅ Criar bucket `scene-videos` no Supabase Storage (manual no Dashboard)
4. ✅ Criar tabelas `categories`, `scenes`, `category_scenes` (SQL em `scripts/001-schema.sql`)
5. ✅ Atualizar `AuthContext` com `isAdmin`
6. ✅ Criar API routes (admin CRUD + listagens públicas)
7. ✅ Criar `SceneEditModal` (gear icon → editar cena)
8. ✅ Criar `AddScenePopup` (adicionar cena à categoria)
9. ✅ Modificar `page.tsx` para buscar do Supabase
10. ✅ Modificar `TemplateCard` e `CarouselSection` para admin
11. ✅ Adicionar `public/videos/` ao `.gitignore`
12. ⬜ **EXECUTAR SQL** no Supabase Dashboard (scripts/001-schema.sql)
13. ⬜ **CRIAR BUCKET** scene-videos no Supabase Storage (público)
14. ⬜ **RODAR MIGRAÇÃO**: `npx tsx scripts/migrate-scenes.ts`
15. ⬜ **SETAR ADMIN**: `profiles.role = 'admin'` para weslley3186@gmail.com
16. ⬜ **DEPLOY**: `npm run build && vercel --prod`

---

## 9. Comandos Úteis

```bash
# Rodar script de migração
npx tsx scripts/migrate-scenes.ts

# Deploy
npm run build
vercel --prod
```
