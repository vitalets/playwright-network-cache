import { Route } from '@playwright/test';

export type RequestOverrides = Parameters<Route['fetch']>[0];

export type ResponseInfo = {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
};
