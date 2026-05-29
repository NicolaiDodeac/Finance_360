import type { ReceiptPaymentMethod } from "@/types/database";
import type { ReceiptReviewLevel } from "@/lib/receipts/ocr/types";

/**
 * Text-based receipt fixtures covering many receipt types (not only Tesco).
 * Each fixture is raw OCR/PDF text plus the values we expect the deterministic
 * pipeline to extract. Used by `npm run check:receipt-ocr`.
 */
export interface ReceiptFixture {
  id: string;
  description: string;
  text: string;
  expect: {
    merchant?: string;
    knownMerchantId?: string | null;
    totalAmount?: number;
    receiptDate?: string;
    paymentMethod?: ReceiptPaymentMethod | null;
    vatAmount?: number;
    /** Classifier pattern id we expect to match (or null for none). */
    classificationPattern?: string | null;
    reviewLevel?: ReceiptReviewLevel;
  };
}

export const RECEIPT_FIXTURES: ReceiptFixture[] = [
  {
    id: "tesco_supermarket",
    description: "Tesco supermarket — full receipt with subtotal + savings",
    text: `TESCO
Telford Hadley Centre Express
22/05/2026 08:52
Bananas Loose 0.78
Milk 2 Pint 1.15
Subtotal £18.20
Savings -£1.80
TOTAL £16.40
Card £16.40
Mastercard Credit
VAT £2.73
Thank you for shopping`,
    expect: {
      merchant: "Tesco",
      knownMerchantId: "tesco",
      totalAmount: 16.4,
      receiptDate: "2026-05-22",
      paymentMethod: "card",
      vatAmount: 2.73,
      classificationPattern: "groceries",
      reviewLevel: "high",
    },
  },
  {
    id: "fuel_shell",
    description: "Shell fuel receipt — litres + pump, must not pick VAT",
    text: `SHELL
Holyhead Road Service Station
14 May 2026 17:22
Unleaded 32.10 L
Price/L 1.459
Fuel Sale 46.83
TOTAL £46.83
VISA DEBIT
VAT @ 20% 7.81`,
    expect: {
      merchant: "Shell",
      knownMerchantId: "shell",
      totalAmount: 46.83,
      receiptDate: "2026-05-14",
      paymentMethod: "card",
      vatAmount: 7.81,
      classificationPattern: "fuel",
      reviewLevel: "high",
    },
  },
  {
    id: "cafe_costa",
    description: "Costa coffee — contactless, small amount",
    text: `COSTA COFFEE
Unit 4 High Street
03/05/2026 09:14
Flat White 3.10
Almond Croissant 2.25
Amount Due 5.35
TOTAL 5.35
CONTACTLESS`,
    expect: {
      merchant: "Costa",
      knownMerchantId: "costa",
      totalAmount: 5.35,
      receiptDate: "2026-05-03",
      paymentMethod: "contactless",
      classificationPattern: "eating_out",
      reviewLevel: "high",
    },
  },
  {
    id: "pharmacy_boots",
    description: "Boots pharmacy — cash payment",
    text: `BOOTS
The Chemist
07/05/2026
Paracetamol 500mg 0.85
Vitamin D 4.99
TOTAL 5.84
CASH 10.00
CHANGE 4.16`,
    expect: {
      merchant: "Boots",
      knownMerchantId: "boots",
      totalAmount: 5.84,
      receiptDate: "2026-05-07",
      paymentMethod: "cash",
      classificationPattern: "health",
      reviewLevel: "high",
    },
  },
  {
    id: "beauty_supplies",
    description: "Beauty supplies wholesaler — business stock",
    text: `SALON SUPPLIES DIRECT
Wholesale Beauty
19/05/2026
Nitrile Gloves Box 6.50
Lash Pigment Set 18.00
Aftercare Wipes 4.20
TOTAL £28.70
PAID BY CARD`,
    expect: {
      totalAmount: 28.7,
      receiptDate: "2026-05-19",
      paymentMethod: "card",
      classificationPattern: "beauty_supplies",
      reviewLevel: "high",
    },
  },
  {
    id: "cash_market_stall",
    description: "Cash receipt — independent merchant, no card",
    text: `RIVERSIDE MARKET
Fresh Produce Stall
11/05/2026
Apples 1kg 1.80
Carrots 0.90
TOTAL 2.70
CASH`,
    expect: {
      totalAmount: 2.7,
      receiptDate: "2026-05-11",
      paymentMethod: "cash",
      reviewLevel: "high",
    },
  },
  {
    id: "card_office_supplies",
    description: "Card receipt — office equipment, business",
    text: `RYMAN STATIONERY
05/05/2026
Printer Ink Cartridge 24.99
A4 Paper Ream 4.50
TOTAL £29.49
VISA CREDIT`,
    expect: {
      totalAmount: 29.49,
      receiptDate: "2026-05-05",
      paymentMethod: "card",
      classificationPattern: "office_equipment",
      reviewLevel: "high",
    },
  },
  {
    id: "rontec_fuel_large",
    description: "Rontec fuel receipt — large cash fill, must not pick VAT",
    text: `RONTEC TRENCH LOCK
Service Station
25/05/2026 16:40
Unleaded 68.78 L
Price/L 1.460
Fuel 100.42
TOTAL £100.42
VAT £16.74
CASH`,
    expect: {
      totalAmount: 100.42,
      receiptDate: "2026-05-25",
      paymentMethod: "cash",
      vatAmount: 16.74,
      classificationPattern: "fuel",
      reviewLevel: "high",
    },
  },
  {
    id: "rontec_fuel_small",
    description: "Rontec fuel receipt — small cash fill",
    text: `RONTEC TRENCH LOCK
Service Station
18/03/2026 09:05
Diesel 20.55 L
Fuel 30.00
TOTAL £30.00
VAT £5.00
CASH`,
    expect: {
      totalAmount: 30,
      receiptDate: "2026-03-18",
      paymentMethod: "cash",
      vatAmount: 5,
      classificationPattern: "fuel",
      reviewLevel: "high",
    },
  },
  {
    id: "bq_hardware",
    description:
      "B&Q DIY/garden receipt — cash; promo footer must NOT trigger software/ads",
    text: `B&Q
Telford 1122
Telford Bridge, Retail Park, Telford
WESTLAND PEAT FREE MPC 8.50
RESOLVA PATH & DRIVE WEEDKILLER 5.50
VERVE GENERAL PURPOSE GARDEN GLOVE 2.60
BYPASS SECATEUR 5.00
TOTAL £64.80
Cash £65.00
Shopping is now faster and easier than ever with the B&Q app.
Search B&Q in the App Store and Google Play store today.
02/05/2026 12:32`,
    expect: {
      merchant: "B&Q",
      knownMerchantId: "bq",
      totalAmount: 64.8,
      receiptDate: "2026-05-02",
      paymentMethod: "cash",
      classificationPattern: "diy_hardware",
      reviewLevel: "high",
    },
  },
  {
    id: "bad_noisy",
    description: "Bad/noisy receipt — no usable fields, must need review",
    text: `### ~~~ @@@@
SHA ENE RUHR FE SER RE 8 PL REHTES
zzzz xxxx qqqq
%%% &&&`,
    expect: {
      reviewLevel: "needs_review",
    },
  },
];
