import { Context } from 'telegraf';
import { RentalStatus } from '@prisma/client';

export interface BotContext extends Context {
  // Расширение контекста при необходимости
}

export { RentalStatus } from '@prisma/client';

export interface RentalData {
  userId: number;
  term: number; // months
  status: RentalStatus;
  startDate?: Date;
  endDate?: Date;
}

export type PlatformType = 'iOS' | 'Android' | 'Windows' | 'macOS';

export interface RentalPrice {
  months: number;
  price: number;
  label: string;
}
