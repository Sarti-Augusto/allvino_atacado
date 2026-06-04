# Roadmap: Allvino Catalog B2B

## Active Milestone (v1.0)

**Status:** Scoped / In progress.
**Goal:** Implementar o painel administrativo, autenticação, upload de imagens, PDF avançado e QR code de compartilhamento para o Catálogo B2B.

### Phase Overview

| Phase | Goal | Requirements | Success Criteria |
|-------|------|--------------|------------------|
| 1 | Autenticação & Segurança | `AUTH-01`, `AUTH-02`, `AUTH-03` | Admin login working, middleware protecting `/admin` routing, session persisting on refresh. |
| 2 | Painel Admin & CRUD | `ADMIN-01` to `ADMIN-08` | Fully functional wine CRUD interface with image upload to Supabase, toggles, and sorting capability. |
| 3 | Geração Avançada de PDF | `PDF-01` to `PDF-04` | PDF generated from select store with custom cover page, commercial metadata fields, and optimized images. |
| 4 | QR Code & Compartilhamento | `SHARE-01`, `SHARE-02` | Dynamic QR code displayed on product pages, and sharing options for WhatsApp/Web Share API. |

---

### Phase Details

#### Phase 1: Autenticação & Segurança
* **Goal**: Implementar a autenticação de administradores usando o Supabase Auth com proteção de rotas no Next.js Middleware.
* **Requirements**: `AUTH-01`, `AUTH-02`, `AUTH-03`
* **Success criteria**:
  1. Login em `/admin/login` enviando credenciais ao Supabase Auth.
  2. Redirecionamento de usuários deslogados tentando acessar `/admin` para `/admin/login`.
  3. Sessão mantida após refresh.

#### Phase 2: Painel Admin & CRUD
* **Goal**: Criar o painel de gerenciamento de vinhos, incluindo listagem, formulários de criação/edição com upload de imagens para o Supabase Storage, toggles rápidos e reordenação.
* **Requirements**: `ADMIN-01` to `ADMIN-08`
* **Success criteria**:
  1. Acesso à listagem completa de vinhos em `/admin/vinhos` e dashboard em `/admin`.
  2. Operações de Criar, Editar e Excluir vinhos funcionando ponta a ponta com persistência no banco.
  3. Upload de imagens de vinhos diretamente para o bucket `wine-images`.
  4. Ativação/inativação e destaque de vinhos alterando instantaneamente na tela.
  5. Ordenação manual salvando no banco.

#### Phase 3: Geração Avançada de PDF
* **Goal**: Expandir a geração client-side de PDF para incluir personalização visual, dados do representante, termos comerciais e garantir o carregamento correto de imagens.
* **Requirements**: `PDF-01` to `PDF-04`
* **Success criteria**:
  1. Interface modal coletando informações comerciais e de contato antes de exportar.
  2. PDF gerado contendo capa estilizada e seções organizadas de forma visualmente premium.
  3. Imagens de vinhos renderizando corretamente no PDF gerado sem quebras.

#### Phase 4: QR Code & Compartilhamento
* **Goal**: Implementar QR Codes dinâmicos na ficha técnica do vinho e otimizar os caminhos de compartilhamento.
* **Requirements**: `SHARE-01`, `SHARE-02`
* **Success criteria**:
  1. Renderização de um QR Code legível na página `/vinho/[id]` apontando para a própria URL.
  2. Opções de compartilhamento via WhatsApp e Web Share API testadas e funcionais.

---

## Milestone History

*(Nenhum marco anterior registrado)*
