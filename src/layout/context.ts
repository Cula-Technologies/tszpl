export interface MeasureRequest {
  readonly text: string;
  readonly fontUrl: string;
  readonly size: number;
  readonly maxWidth?: number;
}

export interface MeasureResult {
  readonly width: number;
  readonly height: number;
  readonly wrappedLines: readonly string[];
}

export interface TextMeasurer {
  measure(req: MeasureRequest): Promise<MeasureResult>;
}

export interface LayoutCtx {
  readonly measure?: TextMeasurer;
}
