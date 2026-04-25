export const produtos = [
  // ==============================
  // 🍺 CERVEJAS
  // ==============================
  
  // Latas 350ml/473ml (Fardo de 12)
  { 
    id: 1, 
    nome: "Brahma Lata 350ml", 
    preco: 3.75, 
    categoria: "Cervejas", 
    volume: 0.5, 
    estoque: 100, 
    imagem: "/images/BrahmaLata.png",
    fardo: { quantidade: 12, preco: 42.00 },
    descricao: "O sabor clássico da número 1. Leve, refrescante e com aquela espuma cremosa que todo brasileiro ama. Ideal para churrascos e reuniões."
  },
  { 
    id: 2, 
    nome: "Skol Lata 350ml", 
    preco: 3.75, 
    categoria: "Cervejas", 
    volume: 0.5, 
    estoque: 100, 
    imagem: "/images/SkolLata.png",
    fardo: { quantidade: 12, preco: 42.00 },
    descricao: "A cerveja que desce redondo. Levíssima, clara e pouco amarga, perfeita para beber geladíssima nos dias de calor."
  },
  { 
    id: 3, 
    nome: "Amstel Lata 350ml", 
    preco: 3.75, 
    categoria: "Cervejas", 
    volume: 0.5, 
    estoque: 100, 
    imagem: "/images/AmstelLata.png",
    fardo: { quantidade: 12, preco: 42.00 },
    descricao: "Puro malte nascida em Amsterdã. Receita europeia com ingredientes naturais, sem aditivos, garantindo um sabor autêntico e suave."
  },
  { 
    id: 4, 
    nome: "Antarctica Boa Lata 350ml", 
    preco: 3.75, 
    categoria: "Cervejas", 
    volume: 0.5, 
    estoque: 100, 
    imagem: "/images/AntarcticaBoaLata.png",
    fardo: { quantidade: 12, preco: 42.00 },
    descricao: "A boa do boteco. Pilsen clara, com sabor suave e baixa fermentação. A companheira fiel dos petiscos e da conversa boa."
  },
  { 
    id: 5, 
    nome: "Budweiser Lata 350ml", 
    preco: 4.00, 
    categoria: "Cervejas", 
    volume: 0.5, 
    estoque: 100, 
    imagem: "/images/BudweiserLata.png",
    fardo: { quantidade: 12, preco: 45.00 },
    descricao: "The King of Beers. Standard American Lager de sabor marcante e processo de maturação com madeira de faia (Beechwood), garantindo equilíbrio único."
  },
  { 
    id: 6, 
    nome: "Crystal Lata 350ml", 
    preco: 2.75, 
    categoria: "Cervejas", 
    volume: 0.5, 
    estoque: 100, 
    imagem: "/images/CrystalLata.png",
    fardo: { quantidade: 12, preco: 30.00 },
    descricao: "Cerveja Pilsen leve e dourada, produzida com matérias-primas selecionadas. Excelente custo-benefício para grandes festas."
  },
  { 
    id: 7, 
    nome: "Ecobier Latão 473ml", 
    preco: 3.50, 
    categoria: "Cervejas", 
    volume: 0.6, 
    estoque: 100, 
    imagem: "/images/EcobierLatao.png",
    fardo: { quantidade: 12, preco: 38.00 },
    descricao: "Puro malte de verdade com preço justo. Sabor encorpado e coloração dourada, seguindo a Lei da Pureza Alemã."
  },
  { 
    id: 8, 
    nome: "Heineken Lata 350ml", 
    preco: 5.50, 
    categoria: "Cervejas", 
    volume: 0.5, 
    estoque: 100, 
    imagem: "/images/HeinekenLata.png",
    fardo: { quantidade: 12, preco: 62.00 },
    descricao: "Inconfundível. Puro malte, sem conservantes, fermentada em tanques horizontais. Aquele amargor característico que os fãs adoram."
  },

  // Longneck (Fardos de 6)
  { 
    id: 9, 
    nome: "Heineken Longneck 330ml", 
    preco: 6.50, 
    categoria: "Cervejas", 
    volume: 0.6, 
    estoque: 60, 
    imagem: "/images/HeinekenLongNeck.png",
    fardo: { quantidade: 6, preco: 37.00 },
    descricao: "A versão clássica em garrafa da Heineken. Mantém o sabor puro malte premium e o estilo icônico da garrafa verde."
  },
  { 
    id: 10, 
    nome: "Heineken Zero Longneck 330ml", 
    preco: 6.50, 
    categoria: "Cervejas", 
    volume: 0.6, 
    estoque: 30, 
    imagem: "/images/HeinekenZeroLongNeck.png",
    fardo: { quantidade: 6, preco: 37.00 },
    descricao: "O mesmo sabor de qualidade da Heineken tradicional, mas sem álcool. Refrescante, frutada e com corpo suave de malte."
  },
  { 
    id: 11, 
    nome: "Budweiser Longneck 330ml", 
    preco: 5.50, 
    categoria: "Cervejas", 
    volume: 0.6, 
    estoque: 60, 
    imagem: "/images/BudweiserLongNeck.png",
    fardo: { quantidade: 6, preco: 31.00 },
    descricao: "Budweiser em sua versão clássica de garrafa. Sabor leve e acabamento fresco, ideal para começar a noite."
  },
  { 
    id: 12, 
    nome: "Budweiser Zero Longneck 330ml", 
    preco: 5.50, 
    categoria: "Cervejas", 
    volume: 0.6, 
    estoque: 30, 
    imagem: "/images/BudweiserZeroLongNeck.png",
    fardo: { quantidade: 6, preco: 31.00 },
    descricao: "Todo o sabor da King of Beers, zero álcool. Processo de desalcoolização cuidadoso para manter as características originais."
  },
  { 
    id: 13, 
    nome: "Corona Longneck 330ml", 
    preco: 6.50, 
    categoria: "Cervejas", 
    volume: 0.6, 
    estoque: 60, 
    imagem: "/images/CoronaLongNeck.png",
    fardo: { quantidade: 6, preco: 37.00 },
    descricao: "A cerveja mexicana mais famosa do mundo. Leve, refrescante e perfeita com uma fatia de limão no gargalo. Sinta a praia onde estiver."
  },

  // 300ml - Fardo de 12
  { id: 14, nome: "Brahma 300ml", preco: 2.69, categoria: "Cervejas", volume: 0.5, estoque: 50, imagem: "/images/Brahma300ml.png", fardo: { quantidade: 12, preco: 30.00 }, descricao: "A famosa 'Romarinho'. Tamanho ideal para beber sempre gelada, do primeiro ao último gole." },
  { id: 15, nome: "Skol 300ml", preco: 2.69, categoria: "Cervejas", volume: 0.5, estoque: 50, imagem: "/images/Skol300ml.png", fardo: { quantidade: 12, preco: 30.00 }, descricao: "Skolzinha 300ml. A medida certa da refrescância para quem não gosta de cerveja esquentando no copo." },
  { id: 16, nome: "Antarctica 300ml", preco: 2.69, categoria: "Cervejas", volume: 0.5, estoque: 50, imagem: "/images/Antarctica300ml.png", fardo: { quantidade: 12, preco: 30.00 }, descricao: "Antarctica tradicional em garrafa compacta. Sabor suave e tradição de qualidade." },
  { id: 17, nome: "Budweiser 300ml", preco: 3.20, categoria: "Cervejas", volume: 0.5, estoque: 50, imagem: "/images/Budweiser300ml.png", fardo: { quantidade: 12, preco: 36.00 }, descricao: "Budweiser na versão retornável/compacta. O sabor internacional que você conhece." },
  { id: 18, nome: "Original 300ml", preco: 3.25, categoria: "Cervejas", volume: 0.5, estoque: 50, imagem: "/images/Original300ml.png", fardo: { quantidade: 12, preco: 37.00 }, descricao: "Cerveja Pilsen de alta qualidade, sabor encorpado e amargor suave. Um clássico dos bares agora na sua casa." },

  // 600ml e Litrão - Caixas de 12
  { id: 19, nome: "Heineken 600ml", preco: 12.00, categoria: "Cervejas", volume: 1, estoque: 40, imagem: "/images/Heineken600ml.png", fardo: { quantidade: 12, preco: 135.00 }, descricao: "Garrafa de 600ml para compartilhar. O puro malte premium quality da Heineken em maior quantidade." },
  { id: 20, nome: "Brahma Litrão", preco: 7.50, categoria: "Cervejas", volume: 1.5, estoque: 40, imagem: "/images/BrahmaLitrao.png", fardo: { quantidade: 12, preco: 85.00 }, descricao: "O litrão da massa. Economia e quantidade para dividir com a galera sem faltar cerveja." },
  { id: 21, nome: "Antarctica Litrão", preco: 7.50, categoria: "Cervejas", volume: 1.5, estoque: 40, imagem: "/images/AntarcticaLitrao.png", fardo: { quantidade: 12, preco: 85.00 }, descricao: "Litrão da Boa. Perfeito para mesas grandes e conversas longas." },
  { id: 22, nome: "Glacial Litrão", preco: 5.50, categoria: "Cervejas", volume: 1.5, estoque: 40, imagem: "/images/GlacialLitrao.png", fardo: { quantidade: 12, preco: 62.00 }, descricao: "Opção econômica e refrescante. Litrão gelado para quem quer gastar pouco e beber bem." },

  // ==============================
  // 🥤 ÁGUA, SUCOS E REFRIGERANTES
  // ==============================

  { id: 23, nome: "Água Plena 500ml", preco: 2.50, categoria: "Sem Álcool", volume: 0.5, estoque: 50, imagem: "/images/AguaPlena500ml.png", descricao: "Água mineral natural, leve e pura. Essencial para hidratação." },
  { id: 24, nome: "Água Plena 1,5L", preco: 4.00, categoria: "Sem Álcool", volume: 1.5, estoque: 30, imagem: "/images/AguaPlena1500ml.png", descricao: "Garrafa grande de água mineral. Ideal para ter em casa ou dividir." },
  { id: 25, nome: "Água de Coco Mais Coco 1L", preco: 8.00, categoria: "Sem Álcool", volume: 1, estoque: 20, imagem: "/images/AguaCocoMaisCoco1L.png", descricao: "Hidratação natural. Água de coco integral, saborosa e refrescante como se fosse tirada na hora." },

  { id: 26, nome: "H2OH Limoneto 500ml", preco: 5.00, categoria: "Sem Álcool", volume: 0.5, estoque: 30, imagem: "/images/H2OHLimoneto500ml.png", descricao: "Levemente gaseificada com suco de limão. Refrescância intensa sem as calorias de um refrigerante comum." },
  { id: 27, nome: "H2OH Limão 500ml", preco: 5.00, categoria: "Sem Álcool", volume: 0.5, estoque: 30, imagem: "/images/H2OHLimao500ml.png", descricao: "O clássico H2OH de limão. Zero açúcar, leve gás e muito sabor." },
  { id: 28, nome: "H2OH Limoneto 1,5L", preco: 8.00, categoria: "Sem Álcool", volume: 1.5, estoque: 20, imagem: "/images/H2OHLimoneto1500ml.png", descricao: "Versão família do H2OH Limoneto. Refrescância para todos." },
  { id: 29, nome: "H2OH Limão 1,5L", preco: 8.00, categoria: "Sem Álcool", volume: 1.5, estoque: 20, imagem: "/images/H2OHLimao1500ml.png", descricao: "Versão família do H2OH Limão. Zero açúcar para acompanhar as refeições." },
  { id: 30, nome: "Suco Frupic 450ml", preco: 5.00, categoria: "Sem Álcool", volume: 0.5, estoque: 30, imagem: "/images/FrupicCitricas.png", descricao: "Suco de frutas cítricas, saboroso e prático. Ótimo puro ou como mixer para vodka." },
  
  { id: 31, nome: "Gatorade Limão", preco: 6.00, categoria: "Sem Álcool", volume: 0.5, estoque: 30, imagem: "/images/GatoradeLimao.png", descricao: "Isotônico sabor limão. Repõe líquidos e sais minerais perdidos. Energia rápida." },
  { id: 32, nome: "Gatorade Tangerina", preco: 6.00, categoria: "Sem Álcool", volume: 0.5, estoque: 30, imagem: "/images/GatoradeTangerina.png", descricao: "Isotônico sabor tangerina. Hidratação com sabor cítrico marcante." },
  { id: 33, nome: "Gatorade Uva", preco: 6.00, categoria: "Sem Álcool", volume: 0.5, estoque: 30, imagem: "/images/GatoradeUva.png", descricao: "Isotônico sabor uva. O favorito de muitos para repor energias." },
  { id: 34, nome: "Gatorade Morango Maracujá", preco: 6.00, categoria: "Sem Álcool", volume: 0.5, estoque: 30, imagem: "/images/GatoradeMorangoMaracuja.png", descricao: "Isotônico com mix de morango e maracujá. Sabor único e revigorante." },

  { id: 35, nome: "Coca-Cola 2L Descartável", preco: 10.50, categoria: "Refrigerantes", volume: 2, estoque: 60, imagem: "/images/CocaCola2L.png", descricao: "A Coca-Cola original. Sabor inigualável que combina com tudo. Garrafa família." },
  { id: 36, nome: "Coca-Cola 2L Retornável", preco: 8.00, categoria: "Refrigerantes", volume: 2, estoque: 40, imagem: "/images/CocaColaRetornavel2L.png", descricao: "Coca-Cola original na versão retornável (apenas líquido). Mais economia e sustentabilidade." },
  { id: 37, nome: "Guaraná Antarctica 2L", preco: 8.50, categoria: "Refrigerantes", volume: 2, estoque: 40, imagem: "/images/Guarana2L.png", descricao: "O original do Brasil. Feito com guaraná da Amazônia, sabor doce e refrescante." },
  { id: 38, nome: "Pepsi 2L", preco: 8.50, categoria: "Refrigerantes", volume: 2, estoque: 40, imagem: "/images/Pepsi2L.png", descricao: "Pode ser Pepsi? Claro! Sabor encorpado e refrescante de cola." },
  { id: 39, nome: "Pepsi Black 2L", preco: 8.50, categoria: "Refrigerantes", volume: 2, estoque: 20, imagem: "/images/PepsiBlack2L.png", descricao: "Intensidade máxima de sabor, zero açúcar. Para quem quer ousadia sem calorias." },
  { id: 40, nome: "Fanta Laranja 2L", preco: 8.50, categoria: "Refrigerantes", volume: 2, estoque: 30, imagem: "/images/FantaLaranja2L.png", descricao: "Diversão em forma de refrigerante. Sabor intenso de laranja, vibrante e doce." },
  { id: 41, nome: "Fanta Uva 2L", preco: 8.50, categoria: "Refrigerantes", volume: 2, estoque: 20, imagem: "/images/FantaUva2L.png", descricao: "O clássico sabor de uva da Fanta. Doce e perfeito para acompanhar lanches." },
  { id: 42, nome: "Sprite Limão 2L", preco: 8.50, categoria: "Refrigerantes", volume: 2, estoque: 30, imagem: "/images/Sprite2L.png", descricao: "O sabor lima-limão mais famoso. Cristalino, refrescante e mata a sede de verdade." },
  { id: 43, nome: "Sprite Sem Açúcar 2L", preco: 8.50, categoria: "Refrigerantes", volume: 2, estoque: 20, imagem: "/images/SpriteZero2L.png", descricao: "Refrescância original do Sprite, sem açúcar. Leveza total." },
  { id: 44, nome: "Jaboti Limão 2L", preco: 5.00, categoria: "Refrigerantes", volume: 2, estoque: 50, imagem: "/images/JabotiLimao.png", descricao: "Refrigerante regional de qualidade. Sabor limão refrescante com preço campeão." },
  { id: 45, nome: "Jaboti Laranja 2L", preco: 5.00, categoria: "Refrigerantes", volume: 2, estoque: 50, imagem: "/images/JabotiLaranja.png", descricao: "Refrigerante de laranja Jaboti. Doce na medida certa e muito econômico." },
  { id: 46, nome: "Jaboti Guaraná 2L", preco: 5.00, categoria: "Refrigerantes", volume: 2, estoque: 50, imagem: "/images/JabotiGuarana.png", descricao: "Guaraná Jaboti. O sabor brasileiro com um preço que cabe no bolso." },
  { id: 47, nome: "Jaboti Maçã 2L", preco: 5.00, categoria: "Refrigerantes", volume: 2, estoque: 50, imagem: "/images/JabotiMaca.png", descricao: "Diferente e saboroso. Refrigerante de maçã Jaboti, leve e adocicado." },
  { id: 48, nome: "Coca-Cola Lata 350ml", preco: 4.50, categoria: "Refrigerantes", volume: 0.5, estoque: 50, imagem: "/images/CocaColaLata.png", descricao: "A dose certa de felicidade. Coca-Cola gelada na lata para consumo imediato." },

  // ==============================
  // ⚡ ENERGÉTICOS
  // ==============================
  
  { id: 49, nome: "Monster Tradicional 473ml", preco: 10.00, categoria: "Energéticos", volume: 0.5, estoque: 40, imagem: "/images/MonsterTradicional.png", descricao: "Unleash the Beast. O Monster original, sabor cítrico intenso e muita energia (Taurina + Cafeína)." },
  { id: 50, nome: "Monster Mango Loco 473ml", preco: 10.00, categoria: "Energéticos", volume: 0.5, estoque: 40, imagem: "/images/MonsterMangoLoco.png", descricao: "Uma mistura celestial de sucos exóticos com o toque Monster. Sabor manga predominante." },
  { id: 51, nome: "Monster Rio Punch 473ml", preco: 10.00, categoria: "Energéticos", volume: 0.5, estoque: 20, imagem: "/images/MonsterRioPunch.png", descricao: "Inspirado nas frutas tropicais. Um punch de sabores com a energia que você precisa." },
  { id: 52, nome: "Monster Ultra Peachy Keen", preco: 10.00, categoria: "Energéticos", volume: 0.5, estoque: 20, imagem: "/images/MonsterPeachyKeen.png", descricao: "Zero açúcar, sabor pêssego refrescante. Leve e perfeito para o verão." },
  { id: 53, nome: "Monster Pacific Punch", preco: 10.00, categoria: "Energéticos", volume: 0.5, estoque: 20, imagem: "/images/MonsterPacificPunch.png", descricao: "Sabor de ponche de frutas clássico, mais leve e menos doce, mas com a complexidade do Monster." },
  { id: 54, nome: "Monster Khaotic", preco: 10.00, categoria: "Energéticos", volume: 0.5, estoque: 20, imagem: "/images/MonsterKhaotic.png", descricao: "Uma evolução do sabor suco. Cítrico, alaranjado e reformulado para um gosto incrível." },
  { id: 55, nome: "Monster Ultra Fiesta Mango", preco: 10.00, categoria: "Energéticos", volume: 0.5, estoque: 20, imagem: "/images/MonsterFiestaMango.png", descricao: "Zero Açúcar com sabor de Manga. A festa não para com essa versão Ultra leve." },
  { id: 56, nome: "Monster Ultra Watermelon", preco: 10.00, categoria: "Energéticos", volume: 0.5, estoque: 20, imagem: "/images/MonsterWatermelon.png", descricao: "Zero Açúcar, sabor melancia. Refrescância pura para os dias quentes." },
  
  { id: 57, nome: "Red Bull 250ml", preco: 9.00, categoria: "Energéticos", volume: 0.3, estoque: 50, imagem: "/images/RedBull250ml.png", descricao: "Te dá asas. O energético mais famoso do mundo, vitaliza corpo e mente." },
  { id: 58, nome: "Red Bull 473ml", preco: 13.00, categoria: "Energéticos", volume: 0.5, estoque: 40, imagem: "/images/RedBull473ml.png", descricao: "Lata grande para quem precisa de energia extra. O clássico sabor Red Bull." },

  { id: 59, nome: "Baly 2 Litros", preco: 14.00, categoria: "Energéticos", volume: 2, estoque: 30, imagem: "/images/Baly2L.png", descricao: "Energia tamanho família. O melhor custo-benefício para fazer drinks na festa toda." },
  { id: 60, nome: "Baly Lata Coco e Açaí 269ml", preco: 5.00, categoria: "Energéticos", volume: 0.3, estoque: 30, imagem: "/images/BalyCocoAcai.png", descricao: "Sabor brasileiro tropical de Coco com Açaí. Energia com um toque diferente." },
  { id: 61, nome: "Baly Lata Maçã Verde 269ml", preco: 5.00, categoria: "Energéticos", volume: 0.3, estoque: 30, imagem: "/images/BalyMacaVerde.png", descricao: "Sabor Maçã Verde, azedinho e doce na medida. Ótimo para misturar com Gin." },

  // ==============================
  // 🍸 BEBIDAS ICE & COROTES
  // ==============================
  { id: 62, nome: "Ice Askov Blueberry 275ml", preco: 5.00, categoria: "Ice", volume: 0.5, estoque: 20, imagem: "/images/IceAskovBlueberry.png", descricao: "Bebida mista pronta para beber. Sabor Blueberry (Mirtilo), doce e azul vibrante." },
  { id: 63, nome: "Ice Askov Kiwi 275ml", preco: 5.00, categoria: "Ice", volume: 0.5, estoque: 20, imagem: "/images/IceAskovKiwi.png", descricao: "Ice refrescante sabor Kiwi. Leve acidez e muito sabor de fruta." },
  { id: 64, nome: "Ice Askov Limão 275ml", preco: 5.00, categoria: "Ice", volume: 0.5, estoque: 20, imagem: "/images/IceAskovLimao.png", descricao: "O clássico sabor limão. Cítrico, gelado e perfeito para qualquer esquenta." },
  { id: 65, nome: "Ice Askov Frutas Vermelhas 275ml", preco: 5.00, categoria: "Ice", volume: 0.5, estoque: 20, imagem: "/images/IceAskovVermelhas.png", descricao: "Mix de frutas vermelhas. Docinho e aromático." },
  
  { id: 66, nome: "Ice Corote Limão", preco: 5.00, categoria: "Ice", volume: 0.3, estoque: 40, imagem: "/images/IceCoroteLimao.png", descricao: "A lenda universitária em versão Ice. Sabor Limão, pronto para beber." },
  { id: 67, nome: "Ice Corote Pink Lemonade", preco: 5.00, categoria: "Ice", volume: 0.3, estoque: 40, imagem: "/images/IceCorotePinkLemonade.png", descricao: "Estilo e sabor. Pink Lemonade traz um toque cítrico de limão com frutas vermelhas." },
  { id: 68, nome: "Ice Corote Sex On The Beach", preco: 5.00, categoria: "Ice", volume: 0.3, estoque: 40, imagem: "/images/IceCoroteSexOnTheBeach.png", descricao: "Inspirado no drink famoso. Pêssego, laranja e vodka em uma garrafinha prática." },
  { id: 69, nome: "Ice Corote Tropicalia", preco: 5.00, categoria: "Ice", volume: 0.3, estoque: 40, imagem: "/images/IceCoroteTropicalia.png", descricao: "Explosão de frutas tropicais. A cara do verão brasileiro." },
  { id: 70, nome: "Ice Corote Mango Jungle", preco: 5.00, categoria: "Ice", volume: 0.3, estoque: 40, imagem: "/images/IceCoroteMangoJungle.png", descricao: "Sabor exótico de manga. Doce e envolvente." },
  
  { id: 71, nome: "51 Ice Limão", preco: 6.00, categoria: "Ice", volume: 0.3, estoque: 50, imagem: "/images/51IceLimao.png", descricao: "A pioneira. Feita com a melhor cachaça, sabor limão. Leve e inconfundível." },
  { id: 72, nome: "51 Ice Kiwi", preco: 6.00, categoria: "Ice", volume: 0.3, estoque: 50, imagem: "/images/51IceKiwi.png", descricao: "51 Ice sabor Kiwi. Refrescância verde com o toque da Cachaça 51." },
  
  { id: 73, nome: "Cabaré Ice Limão", preco: 7.00, categoria: "Ice", volume: 0.3, estoque: 40, imagem: "/images/CabareIceLimao.png", descricao: "Ice premium feita com cachaça Cabaré. Sabor Limão intenso e qualidade superior." },
  { id: 74, nome: "Cabaré Ice Frutas Amarelas", preco: 7.00, categoria: "Ice", volume: 0.3, estoque: 40, imagem: "/images/CabareIceFrutasAmarelas.png", descricao: "Toque sofisticado de frutas amarelas. Doçura equilibrada e base alcoólica de qualidade." },
  
  { id: 75, nome: "Smirnoff Ice Original", preco: 8.00, categoria: "Ice", volume: 0.3, estoque: 40, imagem: "/images/SmirnoffIce.png", descricao: "A Ice original de Vodka. Sabor limão, gaseificada e pronta para gelar sua festa." },
  { id: 76, nome: "Corote de Pinga (Puro)", preco: 4.50, categoria: "Ice", volume: 0.5, estoque: 60, imagem: "/images/CorotePinga.png", descricao: "O Corotinho raiz. Coquetel alcoólico sabor tradicional, para quem curte drinks fortes ou puros." },

  // ==============================
  // 🍾 DESTILADOS
  // ==============================
  { id: 77, nome: "Askov Gin Morango 900ml", preco: 18.00, categoria: "Destilados", volume: 1, estoque: 15, imagem: "/images/AskovGinMorango.png", descricao: "Gin doce sabor morango. O queridinho para fazer Gin Tônica rosa e docinho." },
  { id: 78, nome: "Askov Gin Limão 900ml", preco: 18.00, categoria: "Destilados", volume: 1, estoque: 15, imagem: "/images/AskovGinLimao.png", descricao: "Gin Askov com toque cítrico de limão. Ideal para drinks refrescantes." },
  { id: 79, nome: "Canelinha 900ml", preco: 15.00, categoria: "Destilados", volume: 1, estoque: 20, imagem: "/images/Canelinha.png", descricao: "Bebida mista de cachaça com canela. Sabor picante e doce, ótimo para shots gelados." },
  { id: 80, nome: "Whisky Red Label 1L", preco: 120.00, categoria: "Destilados", volume: 1, estoque: 10, imagem: "/images/RedLabel.png", descricao: "Johnnie Walker Red Label. O Scotch Whisky mais vendido do mundo. Vibrante, defumado e perfeito para misturar." },
  { id: 81, nome: "Vodka Absolut 1L", preco: 90.00, categoria: "Destilados", volume: 1, estoque: 10, imagem: "/images/VodkaAbsolut.png", descricao: "Vodka sueca premium. Destilada infinitas vezes, sabor puro e suave. A base de luxo para seus coquetéis." },
  { id: 82, nome: "Cachaça 51 965ml", preco: 30.00, categoria: "Destilados", volume: 1, estoque: 20, imagem: "/images/Cachaça51.png", descricao: "Uma boa ideia. A cachaça mais tradicional do Brasil, indispensável para a caipirinha perfeita." },

  // ==============================
  // 🥨 SALGADINHOS
  // ==============================
  
  // --- Elma Chips (Tamanhos Grandes) ---
  { id: 83, nome: "Ruffles Original 115g", preco: 14.99, categoria: "Petiscos", volume: 0.3, estoque: 20, imagem: "/images/RufflesOriginal115g.png", descricao: "A batata da onda. Pacote grande para dividir. Crocante, salgadinha e clássica." },
  { id: 84, nome: "Doritos Queijo Nacho 210g", preco: 18.90, categoria: "Petiscos", volume: 0.3, estoque: 20, imagem: "/images/DoritosNacho210g.png", descricao: "Pacote gigante para a galera. Tortilha de milho com sabor intenso de queijo nacho. Para os fortes." }, 
  { id: 85, nome: "Cebolitos Clássicos 138g", preco: 14.50, categoria: "Petiscos", volume: 0.3, estoque: 20, imagem: "/images/Cebolitos138g.png", descricao: "Salgadinho de milho com sabor inconfundível de cebola. Derrete na boca." }, 
  { id: 86, nome: "Baconzitos 86g", preco: 10.90, categoria: "Petiscos", volume: 0.3, estoque: 20, imagem: "/images/Baconzitos86g.png", descricao: "Sabor de bacon defumado em forma de salgadinho. Crocante e delicioso." }, 
  { id: 87, nome: "Lays Clássica 70g", preco: 9.99, categoria: "Petiscos", volume: 0.2, estoque: 20, imagem: "/images/LaysClassica70g.png", descricao: "Batata de verdade, fininha e crocante. Apenas batata, óleo e sal." },
  { id: 88, nome: "Lays Sour Cream 70g", preco: 10.90, categoria: "Petiscos", volume: 0.2, estoque: 20, imagem: "/images/LaysSourCream70g.png", descricao: "Batata Lays com o sabor sofisticado de Creme de Cebola (Sour Cream). Irresistível." }, 
  { id: 89, nome: "Doritos Queijo Nacho 75g", preco: 9.99, categoria: "Petiscos", volume: 0.2, estoque: 20, imagem: "/images/DoritosNacho75g.png", descricao: "Tamanho médio do clássico Doritos Queijo Nacho. Ideal para um lanche reforçado." },
  { id: 90, nome: "Amendoin Elma Chips Japonês 145g", preco: 9.50, categoria: "Petiscos", volume: 0.3, estoque: 20, imagem: "/images/AmendoimJapones.png", descricao: "Amendoim tipo japonês com casca crocante e sabor shoyu. O petisco oficial da cerveja." }, 
  { id: 91, nome: "Cheetos Requeijão 160g", preco: 10.00, categoria: "Petiscos", volume: 1, estoque: 50, imagem: "/images/CheetosRequeijao160g.png", descricao: "A onda do sabor. Cheetos crocante com gosto suave e cremoso de requeijão. Pacote grande." },

  // --- Elma Chips (Tamanhos Pequenos) ---
  { id: 92, nome: "Doritos Queijo Nacho 37g", preco: 4.99, categoria: "Petiscos", volume: 0.1, estoque: 40, imagem: "/images/DoritosNacho37g.png", descricao: "Doritos versão snack. A dose rápida de sabor queijo nacho." },
  { id: 93, nome: "Ruffles Original 32g", preco: 3.99, categoria: "Petiscos", volume: 0.1, estoque: 40, imagem: "/images/RufflesOriginal32g.png", descricao: "Ruffles versão snack. Batata ondulada crocante para comer agora." },
  { id: 94, nome: "Doritos Sweet Chili 37g", preco: 4.99, categoria: "Petiscos", volume: 0.1, estoque: 40, imagem: "/images/DoritosSweetChili37g.png", descricao: "Sabor pimenta adocicada. Um toque picante e doce na medida certa." }, 
  { id: 95, nome: "Cheetos Mix de Queijos 41g", preco: 8.99, categoria: "Petiscos", volume: 0.2, estoque: 30, imagem: "/images/CheetosMix41g.png", descricao: "Explosão de queijos em formato de salgadinho. O favorito da criançada (e dos adultos)." },
  { id: 96, nome: "Cheetos Parmesão 40g", preco: 3.49, categoria: "Petiscos", volume: 0.1, estoque: 40, imagem: "/images/CheetosParmesao40g.png", descricao: "O cheiro e sabor forte de parmesão que todo mundo reconhece de longe." },
  { id: 97, nome: "Cebolitos 36g", preco: 3.99, categoria: "Petiscos", volume: 0.1, estoque: 40, imagem: "/images/Cebolitos36g.png", descricao: "Versão snack do clássico Cebolitos. Sabor cebola intenso." },
  { id: 98, nome: "Fandangos 37g", preco: 2.99, categoria: "Petiscos", volume: 0.1, estoque: 40, imagem: "/images/Fandangos37g.png", descricao: "Salgadinho de milho sabor presunto. Formato de conchinha, assado e crocante." },

  // --- Pringles ---
  { id: 99, nome: "Pringles Churrasco 109g", preco: 15.90, categoria: "Petiscos", volume: 0.3, estoque: 20, imagem: "/images/PringlesChurrasco.png", descricao: "Batata empilhada sabor churrasco. Tempero defumado e textura perfeita." }, 
  { id: 100, nome: "Pringles Queijo 109g", preco: 15.90, categoria: "Petiscos", volume: 0.3, estoque: 20, imagem: "/images/PringlesQueijo.png", descricao: "Pringles sabor queijo. Salgadinha e viciante, impossível comer uma só." }, 
  { id: 101, nome: "Pringles Cheddar e Bacon 105g", preco: 15.90, categoria: "Petiscos", volume: 0.3, estoque: 20, imagem: "/images/PringlesCheddarBacon.png", descricao: "Combinação poderosa: Queijo Cheddar e Bacon. Sabor intenso na batata mais famosa do mundo." }, 
];