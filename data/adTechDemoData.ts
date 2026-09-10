import { AdCampaign, AdDevice, ContractTemplate, Company } from '../types';

export const DEFAULT_COMPANY: Company = {
  id: 'asfalto-cativante',
  name: 'Asfalto Cativante',
  tradeName: 'Asfalto Cativante Gestão TVDE Lda',
  nipc: '516892340',
  address: 'Avenida da Liberdade, 245, 4º Andar, 1250-142 Lisboa',
  phone: '+351 912 345 678',
  email: 'geral@asfaltocativante.pt',
  manager: 'António Silva',
  plan: 'PRO_FLEET',
  tvdeLicence: 'TVDE/LIC/2023/0481',
  defaultSlotFeePercentage: 4,
  defaultIvaRate: 6,
  adTechActive: true,
  adTechDriverSharePercentage: 30, // 30% of revenue distributed as driver bonus
  masterTabletCode: 'ASFALTO2026',
  createdAt: new Date('2023-01-15')
};

export const MOCK_COMPANIES: Company[] = [
  DEFAULT_COMPANY,
  {
    id: 'lisboa-riders',
    name: 'Lisboa Riders Frota',
    tradeName: 'Lisboa Riders Mobilidade Unipessoal Lda',
    nipc: '517223981',
    address: 'Parque das Nações, Alameda dos Oceanos 41, Lisboa',
    phone: '+351 925 882 110',
    email: 'contacto@lisboariders.pt',
    manager: 'Mariana Costa',
    plan: 'STARTER',
    tvdeLicence: 'TVDE/LIC/2024/0112',
    defaultSlotFeePercentage: 4,
    defaultIvaRate: 6,
    adTechActive: true,
    adTechDriverSharePercentage: 25,
    masterTabletCode: 'LISBOA2026',
    createdAt: new Date('2024-03-10')
  },
  {
    id: 'porto-prime-tvde',
    name: 'Porto Prime TVDE',
    tradeName: 'Porto Prime Fleet Solutions Lda',
    nipc: '515901234',
    address: 'Rua de Santa Catarina 820, Porto',
    phone: '+351 933 441 552',
    email: 'operacoes@portoprime.pt',
    manager: 'Carlos Magalhães',
    plan: 'ENTERPRISE',
    tvdeLicence: 'TVDE/LIC/2022/0993',
    defaultSlotFeePercentage: 4,
    defaultIvaRate: 6,
    adTechActive: true,
    adTechDriverSharePercentage: 35,
    masterTabletCode: 'PORTO2026',
    createdAt: new Date('2022-08-01')
  }
];

export const MOCK_AD_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'camp-super-bock',
    companyId: 'asfalto-cativante',
    title: 'Super Bock 0.0 - Sabor Autêntico na Sua Viagem',
    advertiser: 'Super Bock Group',
    category: 'Bebidas & Consumo',
    mediaUrl: 'https://images.unsplash.com/photo-1608270178496-e26090e84b83?w=1200&auto=format&fit=crop&q=80',
    mediaType: 'image',
    targetUrl: 'https://www.superbock.pt/produtos/sem-alcool',
    qrCodeData: 'https://www.superbock.pt/promocao-tvde-2026?origem=asfalto_cativante',
    status: 'ACTIVE',
    impressions: 14820,
    scans: 642,
    revenue: 555.30,
    cpm: 18.00,
    scanReward: 0.45,
    startDate: new Date('2026-08-01'),
    endDate: new Date('2026-10-31'),
    description: 'Campanha de awareness para passageiros TVDE no Grande Lisboa e Porto com oferta de vale digital de degustação.',
    callToAction: 'Faça scan e receba 1 voucher de oferta!',
    driverBonusRate: 30
  },
  {
    id: 'camp-meo-5g',
    companyId: 'asfalto-cativante',
    title: 'MEO Fibra & 5G Ultra - A Rede que Liga Portugal',
    advertiser: 'Altice Portugal / MEO',
    category: 'Telecomunicações',
    mediaUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop&q=80',
    mediaType: 'image',
    targetUrl: 'https://www.meo.pt/pacotes-tv-net-voz',
    qrCodeData: 'https://www.meo.pt/ofertas-tvde-passageiro?ref=rota5',
    status: 'ACTIVE',
    impressions: 21450,
    scans: 890,
    revenue: 1005.90,
    cpm: 22.00,
    scanReward: 0.60,
    startDate: new Date('2026-07-15'),
    endDate: new Date('2026-11-30'),
    description: 'Campanha premium com conversão direta para adesão com primeira mensalidade grátis para passageiros TVDE.',
    callToAction: 'Descubra a melhor cobertura 5G com desconto exclusivo',
    driverBonusRate: 30
  },
  {
    id: 'camp-pestana-hotel',
    companyId: 'asfalto-cativante',
    title: 'Pestana Hotel Group - Escapadinhas de Outono',
    advertiser: 'Pestana Hotels & Resorts',
    category: 'Turismo & Hotelaria',
    mediaUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80',
    mediaType: 'image',
    targetUrl: 'https://www.pestana.com/pt/ofertas-especiais',
    qrCodeData: 'https://www.pestana.com/pt/tvde-guest-pass?code=ASFALTO2026',
    status: 'ACTIVE',
    impressions: 9840,
    scans: 412,
    revenue: 555.00,
    cpm: 25.00,
    scanReward: 0.75,
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-12-15'),
    description: 'Apresentação de estadias em Palácios e Pousadas de Portugal com late check-out garantido.',
    callToAction: 'Reserve agora com 20% de desconto imediato',
    driverBonusRate: 30
  },
  {
    id: 'camp-galp-ev',
    companyId: 'asfalto-cativante',
    title: 'Galp EvCharge - 15% Desconto na Rede Pública',
    advertiser: 'Galp Energia',
    category: 'Mobilidade & Energia',
    mediaUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&auto=format&fit=crop&q=80',
    mediaType: 'image',
    targetUrl: 'https://galp.com/pt/pt/particulares/eletricidade-gas/mobilidade-eletrica',
    qrCodeData: 'https://galp.com/app-ev-rota?promo=TVDEPLUS',
    status: 'SCHEDULED',
    impressions: 3200,
    scans: 145,
    revenue: 136.50,
    cpm: 20.00,
    scanReward: 0.50,
    startDate: new Date('2026-09-15'),
    endDate: new Date('2026-11-15'),
    description: 'Incentivo à mobilidade elétrica sustentável para utilizadores frequentes de TVDE.',
    callToAction: 'Instale a app e ganhe 5€ em carregamentos',
    driverBonusRate: 30
  }
];

export const MOCK_AD_DEVICES: AdDevice[] = [
  {
    id: 'dev-tab-001',
    companyId: 'asfalto-cativante',
    matricula: 'FROTA-001',
    driverId: 'demo-frota-driver-1',
    driverName: 'Motorista Frota A (Demo)',
    tabletModel: 'Samsung Galaxy Tab A9+ 11" 5G',
    status: 'ONLINE',
    batteryLevel: 94,
    lastPing: new Date(),
    totalImpressions: 12450,
    totalScans: 530,
    earnedBonus: 147.20, // 30% of media revenue generated in this car
    currentCampaignId: 'camp-super-bock',
    appVersion: 'ROTA-AD-2.4'
  },
  {
    id: 'dev-tab-002',
    companyId: 'asfalto-cativante',
    matricula: 'FROTA-002',
    driverId: 'demo-frota-driver-2',
    driverName: 'Motorista Frota B (Demo)',
    tabletModel: 'Lenovo Tab M11 LTE Enterprise',
    status: 'ONLINE',
    batteryLevel: 82,
    lastPing: new Date(),
    totalImpressions: 15300,
    totalScans: 610,
    earnedBonus: 184.50,
    currentCampaignId: 'camp-meo-5g',
    appVersion: 'ROTA-AD-2.4'
  },
  {
    id: 'dev-tab-003',
    companyId: 'asfalto-cativante',
    matricula: 'FROTA-003',
    driverId: 'demo-frota-driver-3',
    driverName: 'Motorista Frota C (Demo)',
    tabletModel: 'Samsung Galaxy Tab A9+ 11" 5G',
    status: 'ONLINE',
    batteryLevel: 68,
    lastPing: new Date(),
    totalImpressions: 8900,
    totalScans: 390,
    earnedBonus: 108.40,
    currentCampaignId: 'camp-pestana-hotel',
    appVersion: 'ROTA-AD-2.4'
  },
  {
    id: 'dev-tab-004',
    companyId: 'asfalto-cativante',
    matricula: 'FROTA-004',
    driverId: 'demo-frota-driver-4',
    driverName: 'Motorista Frota D (Demo)',
    tabletModel: 'Xiaomi Pad 6 Car Edition',
    status: 'STANDBY',
    batteryLevel: 45,
    lastPing: new Date(Date.now() - 35 * 60 * 1000),
    totalImpressions: 6400,
    totalScans: 260,
    earnedBonus: 76.90,
    currentCampaignId: 'camp-super-bock',
    appVersion: 'ROTA-AD-2.3'
  },
  {
    id: 'dev-tab-005',
    companyId: 'asfalto-cativante',
    matricula: 'FROTA-005',
    driverId: 'demo-frota-driver-5',
    driverName: 'Motorista Frota E (Demo)',
    tabletModel: 'Samsung Galaxy Tab Active4 Pro',
    status: 'OFFLINE',
    batteryLevel: 15,
    lastPing: new Date(Date.now() - 14 * 3600 * 1000),
    totalImpressions: 3100,
    totalScans: 120,
    earnedBonus: 38.10,
    currentCampaignId: 'camp-meo-5g',
    appVersion: 'ROTA-AD-2.2'
  }
];

export const MOCK_CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'contract-slot',
    title: 'Contrato de Adesão a Slot de Licenciamento TVDE (4%)',
    type: 'SLOT_TVDE',
    description: 'Minuta padrão para motoristas proprietários de viatura que utilizam a licença TVDE e infraestrutura da operadora.',
    lastUpdated: '2026-08-15',
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS E UTILIZAÇÃO DE LICENÇA DE OPERADOR TVDE

ENTRE:
1º OUTORGANTE: ASFALTO CATIVANTE GESTÃO TVDE LDA, NIPC 516892340, com sede em Lisboa, titular da Licença de Operador TVDE nº TVDE/LIC/2023/0481, adiante designada por "OPERADORA";
E
2º OUTORGANTE: [NOME DO MOTORISTA], NIF [NIF DO MOTORISTA], titular da carta de condução e CMTVDE válido, proprietário/locatário da viatura de matrícula [MATRÍCULA], adiante designado por "PARCEIRO".

CLÁUSULA 1ª (OBJETO):
A OPERADORA concede ao PARCEIRO a integração na sua frota licenciada para operação de transporte individual e remunerado de passageiros em veículos descaracterizados a partir de plataforma eletrónica (TVDE), ao abrigo da Lei nº 45/2018.

CLÁUSULA 2ª (RETRIBUIÇÃO E TAXA DE SLOT):
1. Pela prestação dos serviços de faturação, suporte e conformidade legal, a OPERADORA deduzirá a comissão de 4,00% (quatro por cento) calculada sobre a base pura de viagens faturadas nas plataformas autorizadas (Uber, Bolt).
2. As gorjetas e portagens reembolsadas pelas plataformas serão integralmente repassadas ao PARCEIRO sem incidência da taxa de gestão.

CLÁUSULA 3ª (LIQUIDAÇÃO SEMANAL):
O acerto de contas é processado semanalmente (período de Segunda-feira a Domingo), sendo emitido o resumo discriminado através da plataforma ROTA TVDE 5.0.

Lisboa, [DATA DO CONTRATO]`
  },
  {
    id: 'contract-aluguer',
    title: 'Contrato de Cessão de Viatura TVDE em Regime Frota',
    type: 'FROTA_ALUGUER',
    description: 'Acordo de aluguer semanal de viatura descaracterizada com manutenção, seguro de responsabilidade civil e cartão frota.',
    lastUpdated: '2026-07-20',
    content: `CONTRATO DE CEDÊNCIA E ALUGUER DE VIATURA AUTOMÓVEL PARA ATIVIDADE TVDE

ENTRE A OPERADORA E O MOTORISTA IDENTIFICADOS NO REGISTO DIGITAL:

CLÁUSULA 1ª (VIATURA):
A OPERADORA cede ao MOTORISTA o uso exclusivo e afetação profissional da viatura de matrícula [MATRÍCULA], marca [MODELO], para exercício exclusivo da atividade TVDE.

CLÁUSULA 2ª (VALOR DE ALUGUER E CARTÃO FROTA):
1. O valor semanal de aluguer fixado é debitado diretamente nos acertos semanais através da aplicação ROTA TVDE 5.0.
2. O combustível ou carregamento elétrico consumido através do Cartão Frota fornecido será apurado e deduzido conforme os extratos oficiais emitidos pelas petrolíferas (Prio, Galp, Repsol).
3. As portagens Via Verde da viatura são lançadas automaticamente no resumo semanal.

CLÁUSULA 3ª (MANUTENÇÃO E SEGUROS):
A manutenção preventiva, revisões oficiais, inspeção periódica obrigatória e o seguro contra todos os riscos com cobertura específica para TVDE são da inteira responsabilidade da OPERADORA.`
  },
  {
    id: 'contract-adtech',
    title: 'Aditamento de Monetização e Mídia Embarcada (ROTA AdTech)',
    type: 'ADTECH_TERMS',
    description: 'Termos de partilha de receita publicitária e responsabilidade pela operação do tablet interativo instalado no encosto de cabeça.',
    lastUpdated: '2026-09-01',
    content: `TERMOS DE PARTICIPAÇÃO NO PROGRAMA ROTA ADTECH - MÍDIA INTERATIVA EM VEÍCULOS TVDE

1. O MOTORISTA aceita a instalação e conservação no habitáculo da viatura de 1 (um) Tablet multimédia dedicado à exibição de campanhas informativas e publicitárias para passageiros.
2. É garantido ao MOTORISTA um Bónus AdTech de 30% (trinta por cento) sobre toda a receita publicitária apurada com base nas visualizações (CPM) e interações por QR Code registadas no seu veículo.
3. O valor acumulado do Bónus AdTech é creditado semanalmente de forma transparente no Extrato de Rendimentos do ROTA TVDE 5.0.
4. O MOTORISTA compromete-se a manter o dispositivo devidamente alimentado e limpo durante a jornada de trabalho.`
  }
];
