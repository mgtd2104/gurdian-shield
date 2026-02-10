// Scan result model
export class ScanResult {
  constructor(type, input, result, threats = [], createdAt = new Date()) {
    this.type = type; // 'vulnerability' or 'virus'
    this.input = input;
    this.result = result;
    this.threats = threats;
    this.createdAt = createdAt;
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

export const scanStorage = [];
