import { Type, type Static } from "@sinclair/typebox";

// ============ ENUMS ============

const PaymentStatusEnum = {
  paid: "paid",
  unpaid: "unpaid",
  partially_paid: "partially_paid"
};

const RoleEnum = {
  admin: "admin",
  encoder: "encoder"
};

const ServiceCategoryEnum = {
  hematology: "hematology",
  bacteriology: "bacteriology",
  clinical_microscopy: "clinical_microscopy",
  twenty_four_hour_urine_test: "twenty_four_hour_urine_test",
  serology_immunology: "serology_immunology",
  clinical_chemistry: "clinical_chemistry",
  electrolytes: "electrolytes",
  vaccine: "vaccine",
  histopathology: "histopathology",
  to_be_read_by_pathologist: "to_be_read_by_pathologist",
  tumor_markers: "tumor_markers",
  thyroid_function_test: "thyroid_function_test",
  hormones: "hormones",
  hepatitis: "hepatitis",
  enzymes: "enzymes",
  others: "others"
};

// ============ SERVICE ITEM IN BILL ============

export const billedServiceItemSchema = Type.Object({
  serviceId: Type.String({
    description: "Service ID to be billed"
  }),
  quantity: Type.Integer({
    description: "Quantity of service",
    minimum: 1
  })
});

export type billedServiceItemType = Static<typeof billedServiceItemSchema>;

// ============ CREATE MEDICAL BILL REQUEST ============

/**
 * Schema for creating a medical bill
 * Only accepts essentials - payment fields are calculated from PaymentHistory
 */
export const createMedicalBillSchema = Type.Object({
  medicalDocumentationId: Type.String({
    description: "ID of the medical documentation to bill for",
  }),
  
  services: Type.Array(billedServiceItemSchema, {
    minItems: 1,
    description: "Array of services to include in the bill",
  }),
  
  notes: Type.Optional(
    Type.Union([Type.String(), Type.Null()], {
      description: "Optional notes (payment arrangements, discounts, etc.)",
    })
  ),
  
  initialPaymentAmount: Type.Optional(
    Type.Number({
      minimum: 0,
      description: "Optional initial payment amount if paying at billing time",
    })
  ),
  
  paymentMethod: Type.Optional(
    Type.String({
      description: "Payment method if initialPaymentAmount is provided (cash, card, insurance, gcash etc.)",
    })
  ),
  
  isSeniorPwdDiscountApplied: Type.Optional(
    Type.Boolean({
      default: false,
      description: "Apply automatic 20% senior/PWD discount. Requires patient to have valid csdIdOrPwdId.",
    })
  ),
  
  discountRate: Type.Optional(
    Type.Number({
      minimum: 0,
      maximum: 100,
      default: 0,
      description: "Manual discount rate (0-100%). Can be used without senior/PWD ID. Applied to services only, not consultation fee.",
    })
  ),
});

export type createMedicalBillType = Static<typeof createMedicalBillSchema>;

// ============ PAYMENT HISTORY ITEM ============

const paymentHistoryItemSchema = Type.Object({
  id: Type.String(),
  amountPaid: Type.Number(),
  paymentMethod: Type.Union([Type.String(), Type.Null()]),
  notes: Type.Union([Type.String(), Type.Null()]),
  recordedByName: Type.String(),
  recordedByRole: Type.Enum(RoleEnum),
  createdAt: Type.String({ format: "date-time" })
});

// ============ BILLED SERVICE ITEM (SNAPSHOT) ============

const billedServiceResponseSchema = Type.Object({
  id: Type.String(),
  serviceName: Type.String({
    description: "Service name snapshot at time of billing"
  }),
  serviceCategory: Type.Enum(ServiceCategoryEnum),
  servicePriceAtTime: Type.Number({
    description: "Service price at time of billing (snapshot)"
  }),
  quantity: Type.Integer(),
  subtotal: Type.Number({
    description: "Quantity × Price"
  }),
  createdAt: Type.String({ format: "date-time" })
});

// ============ CREATE MEDICAL BILL RESPONSE ============

export const createMedicalBillResponseSchema = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  data: Type.Object({
    id: Type.String({
      description: "Medical bill ID"
    }),
    medicalDocumentationId: Type.String(),
    totalAmount: Type.Number({
      description: "Total bill amount (sum of all services)"
    }),
    amountPaid: Type.Number({
      description: "Amount paid so far (calculated from PaymentHistory)"
    }),
    balance: Type.Number({
      description: "Remaining balance (totalAmount - amountPaid)"
    }),
    paymentStatus: Type.Enum(PaymentStatusEnum, {
      description: "Derived from balance: paid | unpaid | partially_paid"
    }),
    billedServicesCount: Type.Integer({
      description: "Number of services in this bill"
    }),
    createdByName: Type.String(),
    createdByRole: Type.Enum(RoleEnum),
    notes: Type.Union([Type.String(), Type.Null()]),
    createdAt: Type.String({ format: "date-time" }),
    updatedAt: Type.String({ format: "date-time" })
  })
});

export type createMedicalBillResponseType = Static<
  typeof createMedicalBillResponseSchema
>;

// ============ GET MEDICAL BILL RESPONSE ============

export const getMedicalBillResponseSchema = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  data: Type.Optional(
    Type.Object({
      id: Type.String(),
      medicalDocumentationId: Type.String(),
      totalAmount: Type.Number(),
      amountPaid: Type.Number({
        description: "Sum of all payments in PaymentHistory"
      }),
      balance: Type.Number({
        description: "Remaining balance to be paid"
      }),
      paymentStatus: Type.Enum(PaymentStatusEnum, {
        description: "Calculated: paid | unpaid | partially_paid"
      }),
      notes: Type.Union([Type.String(), Type.Null()]),
      createdByName: Type.String(),
      createdByRole: Type.Enum(RoleEnum),
      lastUpdatedByName: Type.Union([Type.String(), Type.Null()]),
      lastUpdatedByRole: Type.Union([Type.Enum(RoleEnum), Type.Null()]),
      billedServices: Type.Array(billedServiceResponseSchema),
      paymentHistory: Type.Array(paymentHistoryItemSchema),
      createdAt: Type.String({ format: "date-time" }),
      updatedAt: Type.String({ format: "date-time" })
    })
  )
});

export type getMedicalBillResponseType = Static<typeof getMedicalBillResponseSchema>;

// ============ SERVICE INPUT TYPE FOR SERVICE LAYER ============

export const createMedicalBillServiceInputSchema = Type.Object({
  medicalDocumentationId: Type.String(),
  services: Type.Array(billedServiceItemSchema),
  notes: Type.Union([Type.String(), Type.Null()]),
  initialPaymentAmount: Type.Optional(Type.Number({ minimum: 0 })),
  paymentMethod: Type.Optional(Type.String()),
  createdByName: Type.String(),
  createdByRole: Type.Enum(RoleEnum),
  isSeniorPwdDiscountApplied: Type.Optional(Type.Boolean()),
  discountRate: Type.Optional(Type.Number({ minimum: 0, maximum: 100 })),
});

export type createMedicalBillServiceInputType = Static<typeof createMedicalBillServiceInputSchema>;