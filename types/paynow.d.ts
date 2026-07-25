/**
 * Ambient type declarations for the `paynow` npm package (official Paynow
 * Zimbabwe SDK), which ships compiled JS with no .d.ts files. Shapes are
 * verified against the SDK source (paynow/Paynow-NodeJS-SDK, MIT licensed)
 * — only the API surface this project actually uses.
 */
declare module "paynow" {
  export class CartItem {
    constructor(title: string, amount: number, quantity?: number);
    title: string;
    amount: number;
    quantity: number;
  }

  export class Cart {
    items: CartItem[];
    add(item: CartItem): number;
    length(): number;
    getTotal(): number;
  }

  export default class Payment {
    constructor(reference: string, authEmail: string, items?: Cart);
    reference: string;
    authEmail: string;
    items: Cart;
    add(title: string, amount: number, quantity?: number): Payment;
    info(): string;
    total(): number;
  }

  export class InitResponse {
    success: boolean;
    hasRedirect: boolean;
    redirectUrl?: string;
    error?: string;
    pollUrl?: string;
    instructions?: string;
    status: string;
  }

  export class StatusResponse {
    reference: string;
    amount: string;
    paynowReference: string;
    pollUrl: string;
    status: string;
    error?: string;
  }

  export class Paynow {
    constructor(
      integrationId: string,
      integrationKey: string,
      resultUrl: string,
      returnUrl: string
    );
    integrationId: string;
    integrationKey: string;
    resultUrl: string;
    returnUrl: string;

    createPayment(reference: string, authEmail: string): Payment;
    send(payment: Payment): Promise<InitResponse | undefined>;
    sendMobile(payment: Payment, phone: string, method: string): Promise<InitResponse | undefined>;
    pollTransaction(url: string): Promise<InitResponse | undefined>;
    parseStatusUpdate(response: string): StatusResponse;
    verifyHash(values: Record<string, string>): boolean;
  }
}
