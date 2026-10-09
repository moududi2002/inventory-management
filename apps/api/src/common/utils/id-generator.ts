// Auto-increment ID generator using MongoDB counters collection.
// Produces IDs like: PRD-10001, SL-000001, RT-00001, TXN-<timestamp>

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from './counter.schema';

export type CounterKey = 'product' | 'sale' | 'return';

@Injectable()
export class IdGenerator {
  constructor(
    @InjectModel(Counter.name) private readonly counterModel: Model<CounterDocument>,
  ) {}

  // Generic: atomically increments and returns next sequence number
  private async nextSeq(key: CounterKey): Promise<number> {
    const doc = await this.counterModel.findOneAndUpdate(
      { _id: key },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return doc!.seq;
  }

  // PRD-10001, PRD-10002 ...
  async nextProductSku(): Promise<string> {
    const seq = await this.nextSeq('product');
    return `PRD-${(10000 + seq).toString()}`;
  }

  // SL-000001, SL-000002 ...
  async nextSaleId(): Promise<string> {
    const seq = await this.nextSeq('sale');
    return `SL-${seq.toString().padStart(6, '0')}`;
  }

  // RT-00001, RT-00002 ...
  async nextReturnId(): Promise<string> {
    const seq = await this.nextSeq('return');
    return `RT-${seq.toString().padStart(5, '0')}`;
  }

  // TXN-<timestamp>-<random>  (not sequential — always unique)
  nextTransactionId(): string {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 7);
    return `TXN-${ts}-${rand}`;
  }
}
