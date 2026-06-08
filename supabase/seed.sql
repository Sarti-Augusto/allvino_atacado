-- =====================================================================
-- Wine Catalog B2B - Seed de Exemplo
-- Use APENAS em ambiente de dev. Não rodar em produção.
-- =====================================================================

insert into public.wines
  (nome, produtor, pais, regiao, uva_varietal, tipo, safra, graduacao_alcoolica, preco_atacado, caixa_fechada_qnt, imagem_url, ficha_tecnica_detalhada, destaque, ordem)
values
  ('Malbec Reserva',           'Bodega Catena',     'Argentina', 'Mendoza',           'Malbec',                 'Tinto',     2021, 13.50, 89.90,  6, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3', 'Vinho tinto encorpado, com notas de ameixa preta, couro e baunilha. Maturado 12 meses em carvalho francês.', true,  1),
  ('Sauvignon Blanc Estate',   'Casa Valduga',      'Brasil',    'Vale dos Vinhedos', 'Sauvignon Blanc',        'Branco',    2023, 12.00, 64.50,  6, 'https://images.unsplash.com/photo-1566995541428-f2a3fc01b3df', 'Branco fresco, aromas cítricos e herbáceos. Ideal com peixes e saladas.', false, 2),
  ('Espumante Brut Rose',      'Miolo',             'Brasil',    'Vale dos Vinhedos', 'Pinot Noir / Chardonnay', 'Espumante', 2022, 12.50, 119.00, 6, 'https://images.unsplash.com/photo-1547595628-c61a29f496f0', 'Borbulhas finas e persistentes. Sabor frutado com final elegante.', true,  3),
  ('Cabernet Sauvignon Gran',  'Concha y Toro',     'Chile',     'Vale Central',      'Cabernet Sauvignon',    'Tinto',     2020, 14.00, 79.90,  6, 'https://images.unsplash.com/photo-1474722883778-792e7990302f', 'Tinto estruturado, taninos firmes, ideal para acompanhar carnes vermelhas.', false, 4),
  ('Chablis Premier Cru',      'Louis Latour',      'França',    'Borgonha',          'Chardonnay',            'Branco',    2021, 13.00, 389.00, 6, 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559', 'Branco mineral e elegante, com longa persistência. Referência mundial.', false, 5);
