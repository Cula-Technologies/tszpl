import type { Component } from './common.js';

export interface RawProps {
  readonly data: string;
}

export type RawNode = Component<'raw', RawProps>;
