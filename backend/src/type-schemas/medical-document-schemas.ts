import { Type, type Static } from "@sinclair/typebox";

/**
 * model MedicalDocumentation {
  id           String   @id @default(cuid())
  patientId    String
  createdById  String
  admittedById String? 
  
  assessment   String?
  diagnosis    String?
  treatment    String?
  prescription String?
  
  status       DocumentationStatus @default(draft)
  
  patient      Patient @relation(fields: [patientId], references: [id])
  creator      Account @relation(fields: [createdById], references: [id])
  admittedBy   Doctors? @relation(fields: [admittedById], references: [id])
  
  // One medical documentation has one medical bill
  medicalBill  MedicalBill?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("medical_documentations")
  @@index([patientId])
  @@index([createdById])
  @@index([admittedById]) 
  @@index([status])
}
 */

export const createMedicalDocumentationSchema = Type.Object({
    patientId: Type.String(),
    
});

export type createMedicalDocumentationType = Static<typeof createMedicalDocumentationSchema>;