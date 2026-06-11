export interface FeatureConfig {
  path: string;
  name: string;
  description?: string;
}

export const FEATURES_IN_DEVELOPMENT: FeatureConfig[] = [
  {
    path: '/tasks/tracking',
    name: '实时跟踪',
    description: '车辆实时位置跟踪功能',
  },
  {
    path: '/system/permissions',
    name: '权限配置',
    description: '系统角色权限配置功能',
  },
];

export const isFeatureInDevelopment = (path: string): boolean => {
  return FEATURES_IN_DEVELOPMENT.some((feature) => feature.path === path);
};

export const getFeatureConfig = (path: string): FeatureConfig | undefined => {
  return FEATURES_IN_DEVELOPMENT.find((feature) => feature.path === path);
};
