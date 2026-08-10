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
  FolderOpenOutlined,
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
};


export function getPortalIcon(iconCode) {
  const key = String(iconCode || "").trim().toLowerCase();
  const Icon =
    iconMap[key] ||
    AppstoreOutlined;

  return <Icon />;
}