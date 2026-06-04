# Requirements: Allvino Catalog B2B

**Defined:** 2026-06-04
**Core Value:** Proporcionar aos clientes B2B um catálogo de vinhos rápido, interativo e gerador de vendas, permitindo a seleção ágil de produtos e a exportação direta para orçamentos e compartilhamentos personalizados.

## v1 Requirements

### Autenticação (AUTH)

- [ ] **AUTH-01**: Usuário administrador pode fazer login com email e senha usando Supabase Auth.
- [ ] **AUTH-02**: Middleware do Next.js bloqueia rotas sob `/admin` para usuários não autenticados, redirecionando para `/admin/login`.
- [ ] **AUTH-03**: Persistência de sessão de login administrativa após recarregamento do navegador.

### Painel Admin & CRUD (ADMIN)

- [ ] **ADMIN-01**: Dashboard administrativo exibindo estatísticas rápidas do catálogo (total de vinhos, ativos, destaques).
- [ ] **ADMIN-02**: Listagem interativa de vinhos no painel admin com paginação, busca e filtros rápidos.
- [ ] **ADMIN-03**: Formulário de criação de vinhos com validações (nome, produtor, preço atacado, uva, safra).
- [ ] **ADMIN-04**: Formulário de edição de vinhos existentes.
- [ ] **ADMIN-05**: Exclusão segura de vinhos com confirmação em tela.
- [ ] **ADMIN-06**: Upload e associação de imagem do vinho diretamente para o bucket `wine-images` do Supabase Storage.
- [ ] **ADMIN-07**: Toggle instantâneo para ativar/desativar vinho (`ativo = true/false`) e marcar como destaque (`destaque = true/false`).
- [ ] **ADMIN-08**: Ordenação manual dos vinhos no catálogo através de interface arrastar-e-soltar ou botões de ordem.

### Geração Avançada de PDF (PDF)

- [ ] **PDF-01**: Botão flutuante no catálogo que gera PDF apenas dos vinhos selecionados via Zustand store.
- [ ] **PDF-02**: Inclusão de capa estilizada no PDF (marca Allvino, título e data de geração).
- [ ] **PDF-03**: Formulário modal no front-end para o usuário inserir informações comerciais (prazo, pedido mínimo, frete) e dados do representante antes de exportar o PDF.
- [ ] **PDF-04**: Otimização/pré-carregamento de imagens do catálogo para evitar que o PDF seja gerado com imagens em branco ou quebradas.

### Compartilhamento & QR Code (SHARE)

- [ ] **SHARE-01**: Exibição de QR Code único na tela de detalhe de cada vinho (`/vinho/[id]`).
- [ ] **SHARE-02**: Botão para compartilhar link do vinho ou PDF diretamente via Web Share API ou WhatsApp (wa.me).

## v2 Requirements

### Analytics & Histórico

- **ANLT-01**: Histórico de catálogos gerados por cliente autenticado.
- **ANLT-02**: Dashboard de cliques e acessos de clientes B2B em cada vinho para análise comercial.

### Integrações

- **INTG-01**: Integração direta com a API do WhatsApp Business para envio automático do catálogo PDF selecionado.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Gateway de Pagamento | O foco inicial é apenas a geração e compartilhamento de catálogos personalizados. Os pedidos e pagamentos são negociados externamente. |
| Aplicativo Mobile Nativo | Mantido foco exclusivo em Next.js Web App PWA para maximizar compatibilidade e agilidade de manutenção. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1: Autenticação & Segurança | Pending |
| AUTH-02 | Phase 1: Autenticação & Segurança | Pending |
| AUTH-03 | Phase 1: Autenticação & Segurança | Pending |
| ADMIN-01 | Phase 2: Painel Admin & CRUD | Pending |
| ADMIN-02 | Phase 2: Painel Admin & CRUD | Pending |
| ADMIN-03 | Phase 2: Painel Admin & CRUD | Pending |
| ADMIN-04 | Phase 2: Painel Admin & CRUD | Pending |
| ADMIN-05 | Phase 2: Painel Admin & CRUD | Pending |
| ADMIN-06 | Phase 2: Painel Admin & CRUD | Pending |
| ADMIN-07 | Phase 2: Painel Admin & CRUD | Pending |
| ADMIN-08 | Phase 2: Painel Admin & CRUD | Pending |
| PDF-01 | Phase 3: Geração Avançada de PDF | Pending |
| PDF-02 | Phase 3: Geração Avançada de PDF | Pending |
| PDF-03 | Phase 3: Geração Avançada de PDF | Pending |
| PDF-04 | Phase 3: Geração Avançada de PDF | Pending |
| SHARE-01 | Phase 4: QR Code & Compartilhamento | Pending |
| SHARE-02 | Phase 4: QR Code & Compartilhamento | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-04*
*Last updated: 2026-06-04 after initial definition*
