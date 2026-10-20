import {
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  SettingOutlined,
  ApartmentOutlined,
  BankOutlined,
  ClusterOutlined,
  ProfileOutlined,
  SolutionOutlined,
  BookOutlined,
  FileTextOutlined,
  AuditOutlined,
  SafetyCertificateOutlined,
  KeyOutlined,
  LockOutlined,
  ApiOutlined,
  CloudOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  GiftOutlined,
  WalletOutlined,
  DollarOutlined,
  CalculatorOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BellOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  ShopOutlined,
  CarOutlined,
  ToolOutlined,
  BuildOutlined,
  AppstoreOutlined,
  MenuOutlined,
  BarsOutlined,
  HomeOutlined,
  RocketOutlined,
  StarOutlined,
  HeartOutlined,
  TagOutlined,
  TagsOutlined,
  FolderOutlined,
  HistoryOutlined,
  FolderOpenOutlined,
  FileSearchOutlined,
  SecurityScanOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  BarChartOutlined,
  TrophyOutlined,
  AppstoreAddOutlined,
  SwapOutlined,
  ShareAltOutlined,
  SyncOutlined,
  WarningOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";

export const iconMap = {
  dashboard: DashboardOutlined,

  user: UserOutlined,

  team: TeamOutlined,

  setting: SettingOutlined,

  apartment: ApartmentOutlined,

  bank: BankOutlined,

  cluster: ClusterOutlined,

  profile: ProfileOutlined,

  solution: SolutionOutlined,

  book: BookOutlined,

  file: FileTextOutlined,

  audit: AuditOutlined,

  safety: SafetyCertificateOutlined,

  key: KeyOutlined,

  lock: LockOutlined,

  api: ApiOutlined,

  cloud: CloudOutlined,

  database: DatabaseOutlined,

  deployment: DeploymentUnitOutlined,

  gift: GiftOutlined,

  wallet: WalletOutlined,

  dollar: DollarOutlined,

  calculator: CalculatorOutlined,

  calendar: CalendarOutlined,

  clock: ClockCircleOutlined,

  bell: BellOutlined,

  mail: MailOutlined,

  phone: PhoneOutlined,

  environment: EnvironmentOutlined,

  global: GlobalOutlined,

  shop: ShopOutlined,

  car: CarOutlined,

  tool: ToolOutlined,

  build: BuildOutlined,

  appstore: AppstoreOutlined,

  menu: MenuOutlined,

  bars: BarsOutlined,

  home: HomeOutlined,

  rocket: RocketOutlined,

  star: StarOutlined,

  heart: HeartOutlined,

  tag: TagOutlined,

  tags: TagsOutlined,

  folder: FolderOutlined,

  folderOpen: FolderOpenOutlined,
  history: HistoryOutlined,
  fileSearch: FileSearchOutlined,
  securityScan: SecurityScanOutlined,
  unorderedList: UnorderedListOutlined,
  userAdd: UserAddOutlined,
  barChart: BarChartOutlined,
  trophy: TrophyOutlined,
  appstoreAdd: AppstoreAddOutlined,
  swap: SwapOutlined,
  shareAlt: ShareAltOutlined,
  sync: SyncOutlined,
  warning: WarningOutlined,
  userSwitch: UserSwitchOutlined,
};


const normalizedMap = Object.fromEntries(
  Object.entries(iconMap).map(([k, v]) => [k.toLowerCase(), v])
);

export function getPortalIcon(iconCode) {
  const key = String(iconCode || "").trim().toLowerCase();
  const Icon =
    normalizedMap[key] ||
    AppstoreOutlined;

  return <Icon />;
}